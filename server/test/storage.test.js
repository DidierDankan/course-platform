// Supabase storage (lib/storage.js) without a Supabase account: the backend is tested against a stand-in client that
// records the calls, and protectVideos is tested with the app's storage switched to "redirect" mode. What a stand-in
// can't prove (Supabase really accepting the upload, a signed link really playing, seeking inside it) is the manual
// check in TODO GO-LIVE step 2h.
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { app } from "../app.js";
import db from "../db/connection.js";
import PaymentService from "../db/PaymentService.js";
import storage, { BUCKETS, createSupabaseStorage, removeStaleTempUploads } from "../lib/storage.js";
import { IMAGE, VIDEO, login, makeUser, resetTables } from "./helpers.js";

// A stand-in for supabase.storage: answers like the SDK ({ data, error }) and records every call.
function fakeSupabase({ uploadError = null, signError = null, removed = 1 } = {}) {
  const calls = [];
  const client = {
    storage: {
      from: (bucket) => ({
        upload: async (name, body, options) => {
          calls.push({ op: "upload", bucket, name, body, options });
          return { data: uploadError ? null : { path: name }, error: uploadError };
        },
        remove: async (names) => {
          calls.push({ op: "remove", bucket, names });
          return { data: Array.from({ length: removed }, () => ({ name: names[0] })), error: null };
        },
        getPublicUrl: (name) => {
          calls.push({ op: "public", bucket, name });
          return { data: { publicUrl: `https://project.supabase.co/storage/v1/object/public/${bucket}/${name}` } };
        },
        createSignedUrl: async (name, ttl) => {
          calls.push({ op: "sign", bucket, name, ttl });
          return signError
            ? { data: null, error: signError }
            : { data: { signedUrl: `https://project.supabase.co/storage/v1/object/sign/${bucket}/${name}?token=t` }, error: null };
        },
      }),
    },
  };
  return { client, calls };
}

const tempFile = async (name, bytes) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "lumen-storage-test-"));
  const file = path.join(dir, name);
  await fs.writeFile(file, bytes);
  return { path: file, filename: name };
};

describe("Supabase backend (stand-in client)", () => {
  const make = (options) => {
    const fake = fakeSupabase(options);
    return { ...fake, store: createSupabaseStorage({ client: fake.client, tempDir: os.tmpdir(), signedUrlTtlSeconds: 900 }) };
  };

  it("a video goes to the private bucket and an image to the public one, with the type from the extension", async () => {
    const { store, calls } = make();
    await store.saveUploads([await tempFile("lesson.mp4", VIDEO), await tempFile("thumb.png", IMAGE), null]);

    expect(calls.map(({ op, bucket, name, options }) => ({ op, bucket, name, type: options.contentType, upsert: options.upsert })))
      .toEqual([
        { op: "upload", bucket: BUCKETS.video, name: "lesson.mp4", type: "video/mp4", upsert: false },
        { op: "upload", bucket: BUCKETS.image, name: "thumb.png", type: "image/png", upsert: false },
      ]);
    expect(Buffer.compare(calls[0].body, VIDEO)).toBe(0); // the file's bytes, not its path
  });

  it("a failed upload throws, so the save stops before the database is touched", async () => {
    const { store } = make({ uploadError: { message: "Payload too large" } });
    await expect(store.saveUploads([await tempFile("lesson.mp4", VIDEO)])).rejects.toThrow(/upload failed/);
  });

  it("remove picks the bucket from the name and says whether something was there", async () => {
    const { store, calls } = make();
    expect(await store.remove("/uploads/abc.webm")).toBe(true);
    expect(await store.remove("photo.jpg")).toBe(true); // profile photos store the bare name
    expect(calls).toEqual([
      { op: "remove", bucket: BUCKETS.video, names: ["abc.webm"] },
      { op: "remove", bucket: BUCKETS.image, names: ["photo.jpg"] },
    ]);
    expect(await make({ removed: 0 }).store.remove("/uploads/gone.mp4")).toBe(false);
  });

  it("never removes or links anything that isn't a stored media name", async () => {
    const { store, calls } = make();
    expect(await store.remove("/uploads/page.html")).toBe(false);
    expect(await store.remove("/uploads/")).toBe(false);
    expect(await store.deliveryUrl("/uploads/notes.txt")).toBeNull();
    expect(calls).toEqual([]);
  });

  it("a path in the name can't reach another folder: only the last part is used", async () => {
    const { store, calls } = make();
    await store.remove("/uploads/../../secret/abc.mp4");
    expect(calls[0].names).toEqual(["abc.mp4"]);
  });

  it("an image link is the public URL; a video link is signed with the configured lifetime", async () => {
    const { store, calls } = make();
    expect(await store.deliveryUrl("/uploads/thumb.webp")).toBe(
      `https://project.supabase.co/storage/v1/object/public/${BUCKETS.image}/thumb.webp`
    );
    expect(await store.deliveryUrl("/uploads/lesson.mov")).toMatch(new RegExp(`/object/sign/${BUCKETS.video}/lesson\\.mov\\?token=`));
    expect(calls.find((c) => c.op === "sign")).toMatchObject({ bucket: BUCKETS.video, ttl: 900 });
  });

  it("a video missing from the bucket -> null (the route answers 404); any other signing error throws", async () => {
    expect(await make({ signError: { message: "Object not found" } }).store.deliveryUrl("x.mp4")).toBeNull();
    await expect(make({ signError: { message: "Invalid JWT" } }).store.deliveryUrl("x.mp4")).rejects.toThrow(/signing failed/);
  });
});

// The app's real storage, switched to redirect mode: protectVideos' checks run as in production, deliveryUrl is the
// stand-in. The point: who gets a link, and that a refused viewer never causes one to be made.
describe("/uploads with Supabase on (redirects)", () => {
  let seller, buyer, stranger, paidUrl, previewUrl, thumbUrl;
  const SIGNED = "https://project.supabase.co/storage/v1/object/sign/course-videos/x?token=t";
  const PUBLIC = "https://project.supabase.co/storage/v1/object/public/public-media/x";

  beforeAll(async () => {
    await resetTables();
    seller = await login(await makeUser("seller"));
    const created = await request(app)
      .post("/api/courses")
      .set("Cookie", seller)
      .field("title", "Storage course")
      .field("description", "d")
      .field("price", "20")
      .attach("thumbnail", IMAGE, { filename: "t.png", contentType: "image/png" })
      .field("meta[]", JSON.stringify({ title: "Intro", description: "", duration: 30, is_preview: true }))
      .attach("videos", VIDEO, { filename: "a.mp4", contentType: "video/mp4" })
      .field("meta[]", JSON.stringify({ title: "Paid", description: "", duration: 30 }))
      .attach("videos", VIDEO, { filename: "b.mp4", contentType: "video/mp4" });
    expect(created.status).toBe(201);
    const courseId = created.body.course.id;
    const [media] = await db.query("SELECT type, title, url FROM course_media WHERE course_id = ?", [courseId]);
    paidUrl = media.find((m) => m.title === "Paid").url;
    previewUrl = media.find((m) => m.title === "Intro").url;
    thumbUrl = media.find((m) => m.type === "image").url;

    const buyerUser = await makeUser("user");
    // What checkout + webhook do for a paid purchase (the Stripe calls themselves can't run in tests).
    await PaymentService.upsertPendingPayment({ userId: buyerUser.id, courseId, amount: 20, sessionId: "cs_test_storage" });
    await PaymentService.recordPaidPurchase({ userId: buyerUser.id, courseId, sessionId: "cs_test_storage" });
    buyer = await login(buyerUser);
    stranger = await login(await makeUser("user"));
  });

  let deliveryUrl;
  const servedLocally = storage.servesLocally; // true: the tests run on the disk backend
  const redirectMode = (answer) => {
    storage.servesLocally = false;
    deliveryUrl = vi.spyOn(storage, "deliveryUrl").mockImplementation(async (name) => answer(name));
  };
  afterEach(() => {
    storage.servesLocally = servedLocally;
    vi.restoreAllMocks();
  });

  it("the buyer -> 302 to a signed link, not cacheable; the link is made for that file", async () => {
    redirectMode(() => SIGNED);
    const res = await request(app).get(paidUrl).set("Cookie", buyer);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(SIGNED);
    expect(res.headers["cache-control"]).toBe("private, no-store");
    expect(deliveryUrl).toHaveBeenCalledWith(path.basename(paidUrl));
  });

  it("the owner -> 302 too (no enrollment needed)", async () => {
    redirectMode(() => SIGNED);
    expect((await request(app).get(paidUrl).set("Cookie", seller)).status).toBe(302);
  });

  it("not enrolled -> 403 and logged out -> 401, and neither makes a link", async () => {
    redirectMode(() => SIGNED);
    expect((await request(app).get(paidUrl).set("Cookie", stranger)).status).toBe(403);
    expect((await request(app).get(paidUrl)).status).toBe(401);
    expect(deliveryUrl).not.toHaveBeenCalled();
  });

  it("a preview lesson -> 302 for anyone, still not cacheable", async () => {
    redirectMode(() => SIGNED);
    const res = await request(app).get(previewUrl);
    expect(res.status).toBe(302);
    expect(res.headers["cache-control"]).toBe("private, no-store");
  });

  it("an image -> 302 to the public URL, cacheable for a day", async () => {
    redirectMode(() => PUBLIC);
    const res = await request(app).get(thumbUrl);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(PUBLIC);
    expect(res.headers["cache-control"]).toBe("public, max-age=86400");
  });

  it("a video with no course behind it -> 404, no link made", async () => {
    redirectMode(() => SIGNED);
    expect((await request(app).get("/uploads/00000000-0000-0000-0000-000000000000.mp4").set("Cookie", buyer)).status).toBe(404);
    expect(deliveryUrl).not.toHaveBeenCalled();
  });

  it("the file isn't in the bucket -> 404, not a redirect to nowhere", async () => {
    redirectMode(() => null);
    expect((await request(app).get(paidUrl).set("Cookie", buyer)).status).toBe(404);
  });

  it("the storage fails -> 500 with no details", async () => {
    storage.servesLocally = false;
    vi.spyOn(storage, "deliveryUrl").mockRejectedValue(new Error("Storage signing failed: Invalid JWT"));
    const res = await request(app).get(paidUrl).set("Cookie", buyer);
    expect(res.status).toBe(500);
    expect(res.text).not.toMatch(/JWT|supabase/i);
  });
});

// With Supabase on, multer's copy is only a temp file: it must be gone once the response is over, whether the save
// worked or failed. Simulated on the disk backend: saveUploads (the Supabase step) records what multer wrote.
describe("temp uploads are removed when the response ends", () => {
  let seller;
  beforeAll(async () => {
    seller = await login(await makeUser("seller"));
  });
  const usedTemp = storage.usesTempUploads;
  afterEach(() => {
    storage.usesTempUploads = usedTemp;
    vi.restoreAllMocks();
  });

  const createCourse = () =>
    request(app)
      .post("/api/courses")
      .set("Cookie", seller)
      .field("title", "Temp course")
      .field("description", "d")
      .field("price", "0")
      .field("meta[]", JSON.stringify({ title: "L", description: "", duration: 30 }))
      .attach("videos", VIDEO, { filename: "a.mp4", contentType: "video/mp4" });
  const exists = (file) => fs.access(file).then(() => true, () => false);

  it("after a successful save", async () => {
    storage.usesTempUploads = true;
    const seen = [];
    vi.spyOn(storage, "saveUploads").mockImplementation(async (files) => {
      for (const file of files.filter(Boolean)) seen.push({ path: file.path, there: await exists(file.path) });
    });

    expect((await createCourse()).status).toBe(201);
    expect(seen).toHaveLength(1);
    expect(seen[0].there).toBe(true); // the upload step could read it
    await vi.waitFor(async () => expect(await exists(seen[0].path)).toBe(false));
  });

  it("after a failed save (the storage refused it) -> 500, and the temp file is gone too", async () => {
    storage.usesTempUploads = true;
    const seen = [];
    vi.spyOn(storage, "saveUploads").mockImplementation(async (files) => {
      seen.push(...files.filter(Boolean).map((file) => file.path));
      throw new Error("Storage upload failed: test");
    });
    // The rollback asks the storage to remove the upload; on disk that would delete this same file and hide the test.
    vi.spyOn(storage, "remove").mockResolvedValue(false);

    expect((await createCourse()).status).toBe(500);
    await vi.waitFor(async () => expect(await exists(seen[0])).toBe(false));
  });
});

// At start-up (Supabase mode) the temp folder is tidied, but only of OLD copies: another server process may share the
// folder and be mid-upload (found in the real check: a restart that emptied the folder failed a running upload).
describe("start-up tidy-up of the temp folder", () => {
  it("removes copies older than an hour and keeps recent ones", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "lumen-stale-test-"));
    const old = path.join(dir, "old.mp4"), fresh = path.join(dir, "fresh.mp4");
    await fs.writeFile(old, VIDEO);
    await fs.writeFile(fresh, VIDEO);
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    await fs.utimes(old, twoHoursAgo, twoHoursAgo);

    removeStaleTempUploads(dir);

    expect(await fs.readdir(dir)).toEqual(["fresh.mp4"]);
  });
});

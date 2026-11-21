// Where uploaded files live. One interface, two backends:
//   disk     - dev and tests (and the default): multer writes straight into config.uploadDir, Express serves it.
//   Supabase - the live site (Render's disk is wiped on every deploy): multer writes to a temp folder, the server sends
//              each file to a bucket before the database save, and /uploads answers with a redirect to the bucket.
// Files are named "<uuid>.<ext>" by the server (middleware/uploadMiddleware.js) in both, and the database stores
// "/uploads/<name>" in both, so moving between them changes no row and no client code.
//
// Buckets (DEPLOY.txt 1.1): images in a PUBLIC bucket (thumbnails and profile photos are shown to everyone anyway),
// videos in a PRIVATE one: a video link is signed by this server after protectVideos' checks, and it expires.
import fs from "node:fs/promises";
import { mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import config from "../config.js";
import { contentTypeOf, fileNameOf, mediaKindOf } from "./mediaTypes.js";
import { logError } from "./logError.js";

export const BUCKETS = Object.freeze({ image: "public-media", video: "course-videos" });

// Removes a file from the local disk. True if it was there; a file that's already gone is the goal state.
async function unlinkIfExists(filePath) {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (err) {
    if (err.code === "ENOENT") return false;
    throw err;
  }
}

// Plain objects, not frozen: the tests stand in for Supabase by replacing a method or flag (test/storage.test.js).
export function createDiskStorage(dir) {
  return {
    kind: "disk",
    uploadDestination: dir,
    usesTempUploads: false, // the file multer wrote IS the stored file
    servesLocally: true, // express.static answers /uploads
    async saveUploads() {}, // already in place
    async putFile(sourcePath, name) {
      await fs.mkdir(dir, { recursive: true });
      await fs.copyFile(sourcePath, path.join(dir, fileNameOf(name)));
    },
    async remove(urlOrName) {
      const name = fileNameOf(urlOrName);
      return name ? unlinkIfExists(path.join(dir, name)) : false;
    },
    async deliveryUrl() {
      return null; // never asked: servesLocally
    },
  };
}

// `client` is a Supabase client (or a stand-in with the same storage.from(bucket) methods, in the tests).
export function createSupabaseStorage({ client, tempDir, signedUrlTtlSeconds }) {
  const bucketOf = (name) => {
    const kind = mediaKindOf(name);
    if (!kind) throw new Error("Not a stored media type"); // never shows the name: callers log it with logError
    return client.storage.from(BUCKETS[kind]);
  };

  // A Buffer, not a stream: a stream has no length, and a plain upload with a known length is what every Supabase
  // plan accepts. Files go one at a time, so a request holds at most one file (50 MB cap) in memory.
  const upload = async (localPath, name) => {
    const body = await fs.readFile(localPath);
    const { error } = await bucketOf(name).upload(name, body, { contentType: contentTypeOf(name), upsert: false });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
  };

  return {
    kind: "supabase",
    uploadDestination: tempDir,
    usesTempUploads: true, // removed when the response ends (removeTempUploadsWhenDone)
    servesLocally: false,
    async saveUploads(files) {
      for (const file of files.filter(Boolean)) await upload(file.path, file.filename);
    },
    async putFile(sourcePath, name) {
      await upload(sourcePath, fileNameOf(name));
    },
    async remove(urlOrName) {
      const name = fileNameOf(urlOrName);
      if (!name || !mediaKindOf(name)) return false;
      const { data, error } = await bucketOf(name).remove([name]);
      if (error) throw new Error(`Storage remove failed: ${error.message}`);
      return data.length > 0;
    },
    // Where the browser gets the file: the public URL for an image, a link that expires for a video. Null when the
    // name isn't a media type we store, or the video isn't in the bucket.
    async deliveryUrl(urlOrName) {
      const name = fileNameOf(urlOrName);
      const kind = name && mediaKindOf(name);
      if (!kind) return null;
      if (kind === "image") return bucketOf(name).getPublicUrl(name).data.publicUrl;
      const { data, error } = await bucketOf(name).createSignedUrl(name, signedUrlTtlSeconds);
      if (error) {
        if (/not.?found/i.test(error.message)) return null;
        throw new Error(`Storage signing failed: ${error.message}`);
      }
      return data.signedUrl;
    },
  };
}

// Copies left by a run that stopped mid-request (a crash or a restart skips the end-of-response cleanup). Only old ones:
// another server process may share this folder and be mid-upload right now (a second local server, or the previous
// instance still answering during a Render deploy), and wiping its file would fail that upload.
const STALE_TEMP_UPLOAD_MS = 60 * 60 * 1000;
export function removeStaleTempUploads(dir) {
  const cutoff = Date.now() - STALE_TEMP_UPLOAD_MS;
  for (const name of readdirSync(dir)) {
    const file = path.join(dir, name);
    try {
      if (statSync(file).mtimeMs < cutoff) rmSync(file, { force: true });
    } catch (err) {
      logError("Remove stale temp upload", err); // a start-up tidy-up: never a reason to stop the server
    }
  }
}

function createConfiguredStorage() {
  if (!config.supabase) return createDiskStorage(config.uploadDir);
  mkdirSync(config.uploadTempDir, { recursive: true }); // multer's destination must exist
  removeStaleTempUploads(config.uploadTempDir);
  const client = createClient(config.supabase.url, config.supabase.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false }, // a server key: no user session to keep
  });
  return createSupabaseStorage({
    client,
    tempDir: config.uploadTempDir,
    signedUrlTtlSeconds: config.supabase.signedUrlTtlSeconds,
  });
}

const storage = createConfiguredStorage();
export default storage;

// Every file multer attached to the request, whatever the route's field setup.
export const uploadedFiles = (req) => {
  if (req.file) return [req.file];
  if (Array.isArray(req.files)) return req.files;
  return Object.values(req.files ?? {}).flat();
};

// Removes the files multer wrote for a request that is refused before anything was saved (validateRequest). They are
// local files in both backends: nothing has been sent to a bucket yet. A file that won't go is logged, never thrown.
export async function discardUploads(req) {
  await Promise.all(
    uploadedFiles(req).map((file) => unlinkIfExists(file.path).catch((err) => logError("Discard refused upload", err)))
  );
}

// With temp uploads, the copy multer wrote is removed once the response is over, whatever happened: saved, refused,
// or failed. Registered before the routes; it reads the request's files only when the response closes.
export function removeTempUploadsWhenDone(req, res, next) {
  if (!storage.usesTempUploads) return next();
  res.on("close", () => {
    for (const file of uploadedFiles(req)) {
      unlinkIfExists(file.path).catch((err) => logError("Remove temp upload", err));
    }
  });
  return next();
}

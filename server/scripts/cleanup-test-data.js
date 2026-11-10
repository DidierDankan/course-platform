// server/scripts/cleanup-test-data.js
// Deletes the accounts end-to-end tests create (e2e-*@example.test), their courses, and the uploaded
// files those rows point to. Real accounts and the demo accounts are never matched.
//
//   npm run cleanup:test-data             delete
//   npm run cleanup:test-data -- --dry-run  only list what would go
//   (NODE_ENV=production also needs --force)
//
// Idempotent: a second run finds nothing and changes nothing.
import db from "../db/connection.js";
import { refuseProductionUnlessForced, removeUploadFile, runScript, uploadPathFromUrl } from "./lib.js";

const SCRIPT = "cleanup-test-data";
// LIKE narrows the query; the regex is the real check ("_" and "%" are LIKE wildcards).
const TEST_EMAIL_LIKE = "e2e-%@example.test";
const TEST_EMAIL_RE = /^e2e-[^@\s]+@example\.test$/i;
// Tables with a user_id column; the table names are constants, never input.
const USER_TABLES = [
  "lesson_progress",
  "enrollments",
  "payments",
  "favorites",
  "qualifications",
  "user_skills",
  "user_profiles",
];

async function main() {
  refuseProductionUnlessForced(SCRIPT);
  const dryRun = process.argv.includes("--dry-run");

  const [candidates] = await db.query("SELECT id, email FROM users WHERE email LIKE ?", [TEST_EMAIL_LIKE]);
  const users = candidates.filter((u) => TEST_EMAIL_RE.test(u.email));
  if (users.length === 0) {
    console.log(`${SCRIPT}: no e2e-*@example.test users. Nothing to do.`);
    return;
  }
  const userIds = users.map((u) => u.id);

  const [courses] = await db.query("SELECT id, title FROM courses WHERE seller_id IN (?)", [userIds]);
  const courseIds = courses.map((c) => c.id);

  // Files referenced by the rows about to go: course media, profile images, certificates.
  const urls = new Set();
  if (courseIds.length) {
    const [media] = await db.query("SELECT url FROM course_media WHERE course_id IN (?)", [courseIds]);
    media.forEach((m) => urls.add(m.url));
  }
  const [profiles] = await db.query("SELECT profile_image FROM user_profiles WHERE user_id IN (?)", [userIds]);
  profiles.forEach((p) => p.profile_image && urls.add(p.profile_image));
  const [certs] = await db.query("SELECT certificate_url FROM qualifications WHERE user_id IN (?)", [userIds]);
  certs.forEach((c) => c.certificate_url && urls.add(c.certificate_url));
  const files = [...urls].filter((url) => uploadPathFromUrl(url));

  console.log(`${SCRIPT}: ${users.length} users, ${courses.length} courses, ${files.length} files`);
  users.forEach((u) => console.log(`  user   ${u.id}  ${u.email}`));
  courses.forEach((c) => console.log(`  course ${c.id}  ${c.title}`));
  files.forEach((f) => console.log(`  file   ${f}`));
  if (dryRun) {
    console.log(`${SCRIPT}: --dry-run, nothing deleted.`);
    return;
  }

  // Explicit deletes, children first, instead of relying on ON DELETE CASCADE: the local database
  // may be MyISAM (no foreign keys, so nothing cascades). Users go last, so if a run stops halfway the
  // next run finds them again and finishes the job. On InnoDB the transaction makes it all-or-nothing.
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    if (courseIds.length) {
      const [media] = await conn.query("SELECT id FROM course_media WHERE course_id IN (?)", [courseIds]);
      if (media.length) {
        await conn.query("DELETE FROM lesson_progress WHERE course_media_id IN (?)", [media.map((m) => m.id)]);
      }
      for (const table of ["course_media", "enrollments", "payments", "favorites"]) {
        await conn.query(`DELETE FROM ${table} WHERE course_id IN (?)`, [courseIds]);
      }
      await conn.query("DELETE FROM courses WHERE id IN (?)", [courseIds]);
    }
    for (const table of USER_TABLES) {
      await conn.query(`DELETE FROM ${table} WHERE user_id IN (?)`, [userIds]);
    }
    await conn.query("DELETE FROM users WHERE id IN (?)", [userIds]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  // Files only after the rows: a failed run must not leave rows pointing at deleted files.
  // A file another remaining row still uses is kept.
  let removed = 0;
  for (const url of files) {
    const [[{ n }]] = await db.query(
      `SELECT (SELECT COUNT(*) FROM course_media WHERE url = ?)
            + (SELECT COUNT(*) FROM user_profiles WHERE profile_image = ?) AS n`,
      [url, url]
    );
    if (Number(n) === 0 && (await removeUploadFile(url))) removed++;
  }
  console.log(`${SCRIPT}: deleted ${users.length} users, ${courses.length} courses, ${removed} files.`);
}

runScript(main, db);

import fs from "fs/promises";

export async function deleteFileIfExists(filePath) {
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
    console.log(`🗑 Deleted file: ${filePath}`);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error(`Failed to delete file ${filePath}:`, err);
    }
  }
}
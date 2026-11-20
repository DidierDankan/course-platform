// The file types the server accepts, and how stored files are named and found. One list for the upload middleware
// (which picks the saved extension), protectVideos (which gates videos) and the storage (which picks the bucket).

// MIME type -> the extension the server saves it with. The uploader's file name never decides the extension.
export const IMAGE_TYPES = Object.freeze({
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
});
export const VIDEO_TYPES = Object.freeze({
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
});

const contentTypeByExtension = Object.fromEntries(
  [...Object.entries(IMAGE_TYPES), ...Object.entries(VIDEO_TYPES)].map(([type, ext]) => [ext, type])
);
// Video extensions uploads never get today but older files might have: still treated as videos (gated, never public).
const OLDER_VIDEO_EXTENSIONS = [".m4v", ".mkv", ".ogv"];
const VIDEO_EXTENSIONS = new Set([...Object.values(VIDEO_TYPES), ...OLDER_VIDEO_EXTENSIONS]);
const IMAGE_EXTENSIONS = new Set(Object.values(IMAGE_TYPES));

const extensionOf = (name) => {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
};

// "video", "image", or null for anything else.
export const mediaKindOf = (name) => {
  const ext = extensionOf(name);
  if (VIDEO_EXTENSIONS.has(ext)) return "video";
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  return null;
};

// The Content-Type a stored file is served with, from its server-chosen extension.
export const contentTypeOf = (name) => contentTypeByExtension[extensionOf(name)] ?? "application/octet-stream";

// Stored URLs are "/uploads/<uuid>.<ext>" in every environment: the browser always asks the server for that path, and
// the server serves the file (disk) or redirects to it (Supabase). The value lives in database rows, so it is a
// constant, not a setting: changing it per environment would break the rows already stored.
export const UPLOADS_URL_PREFIX = "/uploads/";
export const uploadUrl = (fileName) => `${UPLOADS_URL_PREFIX}${fileName}`;
// "/uploads/abc.mp4" or "abc.mp4" (profile photos store the bare name) -> "abc.mp4". Never a path: no "/" or "..".
export const fileNameOf = (urlOrName) => {
  const parts = String(urlOrName).split(/[\\/]/);
  const name = parts[parts.length - 1];
  return name === ".." || name === "." ? "" : name;
};

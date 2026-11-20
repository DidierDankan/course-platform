import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fileStorage from '../lib/storage.js';
import { IMAGE_TYPES, VIDEO_TYPES } from '../lib/mediaTypes.js';

// Allowed file types per form field (lib/mediaTypes.js). The saved extension comes from that list,
// never from the uploader's file name, so "page.html" can't be stored as a web page.
const FIELD_TYPES = {
  profile_image: IMAGE_TYPES,
  thumbnail: IMAGE_TYPES,
  videos: VIDEO_TYPES,
};

// Per file, on every field. 50 MB is Supabase's per-file limit on the free plan (the live storage), so the server
// refuses a bigger file with a readable 400 instead of failing at the storage step.
export const MAX_FILE_SIZE_MB = 50;

// Thrown for a file type or field we don't accept; index.js turns it into a 400.
export class UploadError extends Error {}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Must exist. Disk: the uploads folder (made by the seed script locally, by test/globalSetup.js in tests).
    // Supabase: a temp folder lib/storage.js creates; the file is sent on and removed after the response.
    cb(null, fileStorage.uploadDestination);
  },
  filename: (req, file, cb) => {
    const ext = FIELD_TYPES[file.fieldname][file.mimetype]; // already checked in fileFilter
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = FIELD_TYPES[file.fieldname];
  if (!allowed) {
    return cb(new UploadError(`Unexpected file field "${file.fieldname}"`));
  }
  if (!allowed[file.mimetype]) {
    const kinds = Object.values(allowed).join(', ');
    return cb(new UploadError(`"${file.originalname}" is not an allowed file type (${kinds})`));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 21, // 1 thumbnail + up to 20 videos
    fieldSize: 5 * 1024 * 1024, // 5MB max per text field
  },
});

export default upload;

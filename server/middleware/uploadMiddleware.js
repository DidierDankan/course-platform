import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

// Allowed file types per form field. The saved extension comes from this list,
// never from the uploader's file name, so "page.html" can't be stored as a web page.
const IMAGE_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};
const VIDEO_TYPES = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};
const FIELD_TYPES = {
  profile_image: IMAGE_TYPES,
  thumbnail: IMAGE_TYPES,
  videos: VIDEO_TYPES,
};

export const MAX_FILE_SIZE_MB = 200; // per file; applies to every field

// Thrown for a file type or field we don't accept; index.js turns it into a 400.
export class UploadError extends Error {}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // ✅ must exist
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

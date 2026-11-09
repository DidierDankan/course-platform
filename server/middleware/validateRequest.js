// server/middleware/validateRequest.js
import { validationResult } from 'express-validator';
import { deleteFileIfExists } from '../utils/fileUtils.js';

// multer has to run first because it parses the multipart body, so files are already on disk
// by the time validation can fail. Without this, invalid requests could fill the disk.
const uploadedFiles = (req) => {
  if (req.file) return [req.file];
  if (Array.isArray(req.files)) return req.files;
  return Object.values(req.files ?? {}).flat();
};

export default async function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    await Promise.all(uploadedFiles(req).map((file) => deleteFileIfExists(file.path)));
    return res
      .status(400)
      .json({ errors: errors.array().map(e => e.msg) });
  }
  next();
}

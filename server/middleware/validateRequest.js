// server/middleware/validateRequest.js
import { validationResult } from 'express-validator';
import { discardUploads } from '../lib/storage.js';

// multer has to run first because it parses the multipart body, so files are already on disk
// by the time validation can fail. Without this, invalid requests could fill the disk.

export default async function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    await discardUploads(req);
    return res
      .status(400)
      .json({ errors: errors.array().map(e => e.msg) });
  }
  next();
}

import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // ✅ must exist
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    files: 21, // 1 thumbnail + up to 20 videos
    fieldSize: 5 * 1024 * 1024, // 5MB max per text field
  },
});

export default upload;

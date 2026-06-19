const multer = require('multer');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per file
const MAX_FILES_PER_REQUEST = 5; // reduced from 10 to stay within Gemini free-tier RPM

const upload = multer({
  storage: multer.memoryStorage(), // keep files in Buffer — no disk I/O needed

  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: MAX_FILES_PER_REQUEST,
  },

  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(
        new Error(`Unsupported file type: ${file.mimetype}. Allowed: JPG, PNG, WEBP`),
        false
      );
    }
    cb(null, true);
  },
});

module.exports = { upload, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, MAX_FILES_PER_REQUEST };

const multer = require("multer");
const AppError = require("../middleware/AppError");
// Only accepts images and documents
const allowedTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/bmp",
  "image/webp",
  "image/tiff",
  "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-outlook",
  "application/rtf",
  "application/x-rtf",
  "text/plain",
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          "Invalid file type! Only accepts images and documents",
          400
        ),
        false
      );
    }
  },
});

module.exports = upload;

const AppError = require("./AppError");
const File = require("../models/file.model");

const uploadFile = (required = true) => {
  return async (req, res, next) => {
    try {
      const { id: firmId } = req.params;

      if (required && !req.file) {
        throw new AppError("File not attached", 404);
      }

      if (req.file) {
        const {
          originalname: originalName,
          mimetype: mimeType,
          buffer,
        } = req.file;
        const file = new File({
          firmId,
          originalName,
          mimeType,
          buffer,
        });
        req.uploadedFile = file;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = uploadFile;

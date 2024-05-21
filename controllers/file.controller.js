const File = require("../models/file.model");
const asyncHandler = require("express-async-handler");

// @desc    Get File
// @route   GET /api/files/:id
// @access  Private
module.exports.getFile = asyncHandler(async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      throw new AppError("File not found", 404);
    }
    const fileData = {
      ...file.toObject(),
      buffer: file.buffer.toString("base64"),
    };
    return res.status(200).json({
      success: true,
      data: fileData,
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Download file
// @route   GET /api/files/:id/download
// @access  Private
module.exports.downloadFile = asyncHandler(async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      throw new AppError("File not found", 404);
    }
    res.set({
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename=${file.originalName}`,
    });
    res.send(file.buffer);
  } catch (err) {
    next(err);
  }
});

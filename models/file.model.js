const mongoose = require("mongoose");
const validator = require("validator");

const fileSchema = new mongoose.Schema(
  {
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      required: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
    },
    originalName: {
      type: String,
      trim: true,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
      validate: [validator.isMimeType, "Please enter a valid mime type"],
    },
    buffer: {
      type: Buffer,
      required: true,
    },
    tags: [{ type: String, required: true }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("File", fileSchema);

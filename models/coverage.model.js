const mongoose = require("mongoose");

const CoverageSchema = new mongoose.Schema(
  {
    firm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      required: true,
    },
    tp: {
      type: Number,
      required: true,
    },
    coverageFile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
    },
    fiscalYear: {
      type: Number,
      required: true,
    },
    quarter: {
      type: Number,
      min: 1,
      max: 4,
    },
    coverageDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coverage", CoverageSchema);

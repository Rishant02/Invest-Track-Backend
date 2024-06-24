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
    note: {
      type: String,
      trim: true,
    },
    recommendation: {
      type: String,
      enum: ["Buy", "Sell", "Hold"],
      trim: true,
    },
    coverageDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

CoverageSchema.index(
  { firm: 1, fiscalYear: 1, quarter: 1 },
  { unique: true, sparse: true, background: true }
);

module.exports = mongoose.model("Coverage", CoverageSchema);

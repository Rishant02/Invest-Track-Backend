const mongoose = require("mongoose");

const interactionSchema = new mongoose.Schema(
  {
    firm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      required: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    content: {
      type: String,
      trim: true,
      required: true,
    },
    dateOfInteraction: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Interaction", interactionSchema);

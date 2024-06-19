const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    firm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      required: true,
      validate: {
        validator: async function (value) {
          const firmExists = await mongoose
            .model("Firm")
            .exists({ _id: value });
          return Boolean(firmExists);
        },
        message: "Firm does not exist",
      },
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
      validate: {
        validator: async function (value) {
          const memberExists = await mongoose
            .model("Member")
            .exists({ _id: value });
          return Boolean(memberExists);
        },
        message: "Member does not exist",
      },
    },
    name: {
      type: String,
      trim: true,
      required: true,
    },
    type: {
      type: String,
      trim: true,
      required: true,
    },
    mode: {
      type: String,
      enum: ["Virtual", "Physical"],
      trim: true,
      required: true,
    },
    location: {
      type: String,
      trim: true,
      required: this.mode === "Physical",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    rklAttendees: {
      type: String,
      trim: true,
    },
    nextStep: {
      type: String,
      enum: ["Confirmed", "Cancelled", "Declined", "TBD"],
      trim: true,
      default: "TBD",
    },
    isInvited: {
      type: Boolean,
      default: false,
    },
    exchangeIntimated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Event", eventSchema);

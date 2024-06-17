const mongoose = require("mongoose");
const addressSchema = require("./address.schema");
const validator = require("validator");

const FirmSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    locationType: {
      type: String,
      required: true,
      trim: true,
      enum: ["Domestic", "Foreign"],
    },
    website: {
      type: String,
      trim: true,
      validate: [validator.isURL, "Please enter a valid URL"],
    },
    remark: {
      type: String,
      trim: true,
    },
    address: addressSchema,
    comment: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "Member" }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    discriminatorKey: "firmType",
  }
);

const BrokerSchema = new mongoose.Schema({
  sectors: {
    type: [String],
    trim: true,
    required: true,
    validate: {
      validator: function (value) {
        return value.length > 0;
      },
      message: "Please select at least one sector",
    },
  },
  coverages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Coverage" }],
});

const InvestorSchema = new mongoose.Schema({
  regionalFocus: {
    type: [String],
    trim: true,
    required: true,
    validate: {
      validator: function (value) {
        return value.length > 0;
      },
      message: "Please select at least one region",
    },
  },
  fundSize: {
    globalExposure: {
      type: Number,
    },
    indianExposure: {
      type: Number,
    },
  },
  fundFactsheets: [
    {
      documentDate: {
        type: Date,
        default: Date.now,
      },
      file: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "File",
      },
      _id: false,
    },
  ],
});

// Define models based on schemas
const Firm = mongoose.model("Firm", FirmSchema);
const Broker = Firm.discriminator("broker", BrokerSchema);
const Investor = Firm.discriminator("investor", InvestorSchema);

module.exports = { Firm, Broker, Investor };

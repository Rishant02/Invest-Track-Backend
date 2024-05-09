const mongoose = require("mongoose");
const validator = require("validator");
const addressSchema = require("./address.schema");

const phoneNumberSchema = new mongoose.Schema(
  {
    areaCode: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    isoCode: {
      type: String,
      trim: true,
    },
    countryCode: {
      type: Number,
    },
  },
  { _id: false }
);
phoneNumberSchema.index(
  { countryCode: 1, areaCode: 1, phoneNumber: 1 },
  { unique: true, sparse: true, background: true }
);
const memberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      unique: true,
      required: true,
      validate: [validator.isEmail, "Please enter a valid email"],
    },
    firm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      required: true,
    },
    firmHistory: [
      {
        _id: false,
        firm: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Firm",
        },
        dateOfJoining: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    designation: {
      type: String,
      trim: true,
      required: true,
    },
    mobileNumber: {
      type: phoneNumberSchema,
      required: true,
    },
    officeNumber: {
      type: phoneNumberSchema,
      required: false,
    },
    address: addressSchema,
    businessCard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
    },
    comment: {
      type: String,
      trim: true,
    },
    interactions: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Interaction" },
    ],
    isGift: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    discriminatorKey: "memberType",
  }
);

const BrokerPersonSchema = new mongoose.Schema({
  sectors: {
    type: [String],
    trim: true,
    required: true,
    validate: {
      validator: (value) => value.length > 0,
      message: "Please select at least one sector",
    },
  },
});

const investorPersonSchema = new mongoose.Schema({
  sectors: {
    type: [String],
    trim: true,
    required: true,
    validate: {
      validator: (value) => value.length > 0,
      message: "Please select at least one sector",
    },
  },
  fundSize: {
    globalExposure: Number,
    indianExposure: {
      type: Number,
      required: true,
    },
  },
  regionalFocus: {
    type: [String],
    trim: true,
    required: true,
    validate: {
      validator: (value) => value.length > 0,
      message: "Please select at least one sector",
    },
  },
  isExistingInvestor: {
    type: Boolean,
    default: false,
  },
  holdingSize: {
    type: Number,
    required: function () {
      return this.isExistingInvestor || false;
    },
  },
  lastHoldingDate: {
    type: Date,
    required: function () {
      return this.isExistingInvestor || false;
    },
  },
});

const Member = mongoose.model("Member", memberSchema);
const InvestorMember = Member.discriminator(
  "InvestorMember",
  investorPersonSchema
);
const BrokerMember = Member.discriminator("BrokerMember", BrokerPersonSchema);

module.exports = { Member, BrokerMember, InvestorMember };

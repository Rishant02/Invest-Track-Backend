const mongoose = require("mongoose");
const validator = require("validator");
const addressSchema = require("./address.schema");

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
      validate: [validator.isEmail, "Please enter a valid email"],
      unique: true,
      required: true,
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
    destination: {
      type: String,
      trim: true,
      required: true,
    },
    mobileNumber: {
      countryCode: {
        type: String,
        trim: true,
        validate: {
          validator: function (value) {
            // Example validation: Validate against ISO 3166-1 alpha-2 country codes
            return validator.isISO31661Alpha2(value);
          },
          message: "Please enter a valid country code",
        },
      },
      number: {
        type: String,
        trim: true,
        unique: true,
        validate: {
          validator: function (value) {
            return validator.isMobilePhone(value, "any", { strictMode: false });
          },
          message: "Please enter a valid mobile number",
        },
      },
    },
    officeNumber: {
      countryCode: {
        type: String,
        trim: true,
        validate: [
          validator.isISO31661Alpha2,
          "Please enter a valid country code",
        ],
      },
      number: {
        type: String,
        trim: true,
        unique: true,
      },
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
      validator: function (value) {
        return value.length > 0;
      },
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
      validator: function (value) {
        return value.length > 0;
      },
      message: "Please select at least one sector",
    },
  },
  fundSize: {
    globalExposure: {
      type: Number,
    },
    indianExposure: {
      type: Number,
      required: true,
    },
  },
  regionFocus: {
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
  isExistingInvestor: {
    type: Boolean,
    default: false,
  },
  holdingSize: {
    type: Number,
    required: () => (this.isExistingInvestor ? true : false),
  },
  lastHoldingDate: {
    type: Date,
    required: () => (this.isExistingInvestor ? true : false),
  },
});

const Member = mongoose.model("Member", memberSchema);
const InvestorMember = Member.discriminator(
  "InvestorMember",
  investorPersonSchema
);
const BrokerMember = Member.discriminator("BrokerMember", BrokerPersonSchema);

module.exports = { Member, BrokerMember, InvestorMember };

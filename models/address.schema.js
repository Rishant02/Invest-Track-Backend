const addressSchema = {
  streetLine1: {
    type: String,
    trim: true,
  },
  streetLine2: {
    type: String,
    trim: true,
  },
  state: {
    type: String,
    trim: true,
    required: true,
  },
  region: {
    type: String,
    trim: true,
    required: true,
  },
  country: {
    type: String,
    trim: true,
    required: true,
  },
  postalCode: {
    type: String,
    trim: true,
    required: true,
  },
};

module.exports = addressSchema;

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
  },
  city: {
    type: String,
    trim: true,
  },
  locality: {
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
  },
};

module.exports = addressSchema;

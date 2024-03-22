const commentSchema = {
  content: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
};

module.exports = commentSchema;

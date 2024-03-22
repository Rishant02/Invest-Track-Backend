const asyncHandler = require("express-async-handler");
const User = require("../models/user.model");
const AppError = require("../middleware/AppError");

// @desc    Get profile of logged user
// @route   GET /api/users/me
// @access  Private
module.exports.getUser = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("-password").lean();
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Update profile of logged user
// @route   PUT /api/users/:userId
// @access  Private
module.exports.updateUser = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.userId, req.body, {
      new: true,
    })
      .select("-password")
      .lean();
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
});

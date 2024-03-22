const asyncHandler = require("express-async-handler");
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const AppError = require("../middleware/AppError");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
module.exports.registerUser = asyncHandler(async (req, res, next) => {
  try {
    const { name, email, password, role, avatar } = req.body;
    const isExistingUser = await User.findOne({ email });
    if (isExistingUser) {
      throw new AppError("User already exists", 401);
    }
    const user = new User({ name, email, password, role, avatar });
    await user.save();
    user.password = undefined;
    return res.status(201).json({
      success: true,
      message: `${name} has successfully registered. You may login now`,
      data: user,
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Login a user
// @route   POST /api/auth/login
// @access  Public
module.exports.loginUser = asyncHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError("Please provide email and password", 400);
    }
    const user = await User.findOne({ email }).lean();
    if (!user) {
      throw new AppError(
        `User with email ${email} does not exist. Please register first`,
        401
      );
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError("Invalid email or password", 401);
    }
    const token = signToken(user._id);
    user.password = undefined;
    return res.status(200).json({
      success: true,
      message: `${user.name} has successfully logged in`,
      data: user,
      token,
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Logout a user
// @route   POST /api/auth/logout
// @access  Private
module.exports.logoutUser = asyncHandler(async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: "User has successfully logged out",
    });
  } catch (err) {
    next(err);
  }
});

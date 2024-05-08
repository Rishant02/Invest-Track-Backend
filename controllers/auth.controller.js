const asyncHandler = require("express-async-handler");
const User = require("../models/user.model");
const Token = require("../models/token.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sendMail = require("../utils/sendMail");
const AppError = require("../middleware/AppError");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const passwordRegex =
  /(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[@$!%*#?~(&)+=^_-]).{8,}/;
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
      user,
      accessToken: token,
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

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
module.exports.changePassword = asyncHandler(async (req, res, next) => {
  try {
    const { oldPassword, password, confirmPassword } = req.body;
    if (!oldPassword || !password || !confirmPassword) {
      throw new AppError(
        "Please provide old password, new password and confirm password",
        400
      );
    }
    const user = await User.findById(req.userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new AppError("Invalid old password", 401);
    }
    if (password !== confirmPassword) {
      throw new AppError("Passwords do not match", 401);
    }
    if (!passwordRegex.test(password)) {
      throw new AppError(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, one special character and must be at least 8 characters long",
        401
      );
    }
    user.password = password;
    await user.save();
    user.password = undefined;
    return res.status(200).json({
      success: true,
      message: "Password has been reset",
      data: user,
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
module.exports.forgotPassword = asyncHandler(async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new AppError("Please provide email", 400);
    }
    const user = await User.findOne({ email });
    if (!user) throw new AppError("User not found", 404);
    const token = await Token.findOne({ userId: user._id });
    if (token) await token.deleteOne();
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hash = await bcrypt.hash(resetToken, 10);
    await new Token({
      userId: user._id,
      token: hash,
      createdAt: Date.now(),
    }).save();
    const baseUrl =
      process.env.NODE_ENV === "production"
        ? `${req.protocol}://${req.get("host")}`
        : process.env.CLIENT_URL;
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}&id=${user._id}`;
    const info = await sendMail(
      user.email,
      "Password Reset Request - ITrack",
      `Hi <b>${user.name}</b>,
      <br><br>
      Please click on the link below to reset your password
      <br>
      <a href=${resetUrl}>Click here</a>
      <br><br>
      (Please note that the link will expire in 1 hour)
      <br><br>
      <b>Cheers</b>
      <br>
      <b>ITrack</b>
      `
    );
    if (info.response) {
      return res.status(200).json({
        success: true,
        message:
          "Password reset link has been sent to your email. Link will expire in 1 hour",
      });
    }
    throw new AppError("Something went wrong. Please try again later", 500);
    // const resetUrl = `${req.protocol}://${req.get(
    //   "host"
    // )}/api/auth/reset-password?resetToken=${resetToken}`;
  } catch (err) {
    next(err);
  }
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
module.exports.resetPassword = asyncHandler(async (req, res, next) => {
  try {
    const { userId, token, password } = req.body;
    if (!userId) throw new AppError("Please provide user id", 400);
    const user = await User.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    if (!token) throw new AppError("Please provide token", 400);
    if (!password) throw new AppError("Please provide password", 400);
    const passwordResetToken = await Token.findOne({ userId });
    if (!passwordResetToken)
      throw new AppError("Invalid or expired password reset token");
    const isValid = await bcrypt.compare(token, passwordResetToken.token);
    if (!isValid) throw new AppError("Invalid or expired password reset token");
    if (!passwordRegex.test(password))
      throw new AppError(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, one special character and must be at least 8 characters long",
        400
      );
    user.password = password;
    await user.save();
    await passwordResetToken.deleteOne();
    await sendMail(
      user.email,
      "Password Reset Successful - ITrack",
      `Hi <b>${user.name}</b>,
      <br><br>
      Your password has been successfully reset.
      <br><br>
      <b>Cheers</b>
      <br>
      <b>ITrack</b>
      `
    );
    return res.status(200).json({
      success: true,
      message: "Password has been reset. Please login with your new password",
    });
  } catch (err) {
    next(err);
  }
});

const asyncHandler = require("express-async-handler");
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sendMail = require("../utils/sendMail");
const AppError = require("../middleware/AppError");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const generateOtp = () => {
  return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
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
    if (!user) {
      throw new AppError("User not found", 404);
    }
    user.uniquePasswordToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = generateOtp();
    user.passwordResetTokenExpiry = Date.now() + 30 * 60 * 1000;
    user.isPasswordOTPVerified = false;
    await user.save();
    const mailInfo = await sendMail(
      user.email,
      "Reset Password | InvestTrack",
      `Your Reset Password OTP is <b>${user.passwordResetToken}<br><br>Cheers,<br>InvestTrack</b>`
    );
    console.log("Mail Sent:", mailInfo.response);
    return res.status(200).json({
      success: true,
      uniquePasswordToken: user.uniquePasswordToken,
      messsage: `6 digit OTP has been sent to your email ${user.email}. OTP will expire in 30 minutes.`,
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
module.exports.verifyOtp = asyncHandler(async (req, res, next) => {
  try {
    const { resetToken } = req.query;
    if (!resetToken) {
      throw new AppError("Please provide reset token", 400);
    }
    const user = await User.findOne({ uniquePasswordToken: resetToken });
    if (!user) {
      throw new AppError("User not found", 404);
    }
    if (user.passwordResetTokenExpiry < Date.now()) {
      user.uniquePasswordToken = undefined;
      user.passwordResetToken = undefined;
      user.isPasswordOTPVerified = undefined;
      user.passwordResetTokenExpiry = undefined;
      await user.save();
      throw new AppError("OTP expired. Please request for new OTP", 401);
    }
    if (user.passwordResetToken === req.body.otp) {
      user.isPasswordOTPVerified = true;
      user.passwordResetToken = undefined;
      await user.save();
      return res.status(200).json({
        success: true,
        message: "OTP verified successfully! Please reset your password",
      });
    }
    throw new AppError("Invalid OTP", 401);
  } catch (err) {
    next(err);
  }
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Private
module.exports.resetPassword = asyncHandler(async (req, res, next) => {
  try {
    const { resetToken } = req.query;
    const { password, confirmPassword } = req.body;
    if (!resetToken) {
      throw new AppError("Please provide reset token", 400);
    }
    if (!password || !confirmPassword) {
      throw new AppError(
        "Please provide new password and confirm password",
        400
      );
    }
    if (password !== confirmPassword) {
      throw new AppError("Passwords do not match", 401);
    }
    const user = await User.findOne({ uniquePasswordToken: resetToken });
    if (!user) {
      throw new AppError("User not found", 404);
    }
    if (!user.isPasswordOTPVerified) {
      throw new AppError("Please verify OTP first", 401);
    }
    if (user.passwordResetTokenExpiry < Date.now()) {
      user.uniquePasswordToken = undefined;
      user.passwordResetToken = undefined;
      user.isPasswordOTPVerified = undefined;
      user.passwordResetTokenExpiry = undefined;
      await user.save();
      throw new AppError("OTP expired. Please request for new OTP", 401);
    }
    if (!passwordRegex.test(password)) {
      throw new AppError(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, one special character and must be at least 8 characters long",
        401
      );
    }
    user.password = password;
    user.uniquePasswordToken = undefined;
    user.passwordResetToken = undefined;
    user.isPasswordOTPVerified = undefined;
    user.passwordResetTokenExpiry = undefined;
    await user.save();
    return res.status(200).json({
      success: true,
      message: "Password has been reset. Please login with new password",
    });
  } catch (err) {
    next(err);
  }
});

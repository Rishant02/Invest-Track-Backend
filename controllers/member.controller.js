const AppError = require("../middleware/AppError");
const asyncHandler = require("express-async-handler");
const { Firm, Broker, Investor } = require("../models/firm.model");
const File = require("../models/file.model");
const {
  BrokerMember,
  InvestorMember,
  Member,
} = require("../models/member.model");

// @desc    Get all members
// @route   GET /api/members
// @access  Private
module.exports.getAllMembers = asyncHandler(async (req, res, next) => {
  try {
    const { memberType, perPage, page } = req.query;
    let query;
    switch (memberType) {
      case "broker":
        query = BrokerMember.find()
          .sort({ createdAt: -1 })
          .populate("firm")
          .lean();
        break;
      case "investor":
        query = InvestorMember.find()
          .sort({ createdAt: -1 })
          .populate("firm")
          .lean();
        break;
      default:
        throw new AppError("Invalid member type", 400);
    }
    if (page && perPage) {
      const currentPage = parseInt(page);
      const pageSize = parseInt(perPage);
      const skip = (currentPage - 1) * pageSize;
      query = query.skip(skip).limit(pageSize);
    }
    const members = await query.exec();
    const totalCount = await Member.countDocuments({ memberType });
    return res.status(200).json({
      success: true,
      data: members,
      totalCount,
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Create a new member
// @route   POST /api/members
// @access  Private
module.exports.createMember = asyncHandler(async (req, res, next) => {
  try {
    const { firmId } = req.query;
    if (!firmId) {
      throw new AppError("Please provide a firmId", 400);
    }
    const firm = await Firm.findById(firmId);
    if (!firm) {
      throw new AppError("Firm not found", 404);
    }
    const { type, ...rest } = req.body;
    let member;
    switch (type) {
      case "broker":
        member = new BrokerMember({
          firm: firm._id,
          ...rest,
        });
        break;
      case "investor":
        member = new InvestorMember({
          firm: firm._id,
          ...rest,
        });
        break;
      default:
        throw new AppError("Invalid member type", 400);
    }
    member.firmHistory.push({
      firm: firm._id,
    });
    const file = req.uploadedFile;
    if (file) {
      file.firmId = firm._id;
      file.member = member._id;
      member.businessCard = file._id;
    }
    await member.save();
    await Firm.findByIdAndUpdate(member.firm, {
      $addToSet: {
        members: member._id,
      },
    });
    await file?.save();
    return res.status(201).json({
      success: true,
      data: member,
      message: `Member with name ${member.name} created successfully for ${firm.name}`,
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Get a single member
// @route   GET /api/members/:id
// @access  Private
module.exports.getMember = asyncHandler(async (req, res, next) => {
  try {
  } catch (err) {
    next(err);
  }
});

// @desc    Update a member
// @route   PUT /api/members/:id
// @access  Private
module.exports.updateMember = asyncHandler(async (req, res, next) => {
  try {
  } catch (err) {
    next(err);
  }
});

// @desc    Delete a member
// @route   DELETE /api/members/:id
// @access  Private
module.exports.deleteMember = asyncHandler(async (req, res, next) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) {
      throw new AppError("Member not found", 404);
    }
    await Firm.findByIdAndUpdate(member.firm, {
      $pull: {
        members: member._id,
      },
    });
    await File.findByIdAndDelete(member.businessCard);
    return res.status(200).json({
      success: true,
      message: `Member with name ${member.name} deleted successfully`,
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Move a member
// @route   POST /api/members/:id/move
// @access  Private
module.exports.moveMember = asyncHandler(async (req, res, next) => {
  try {
  } catch (err) {
    next(err);
  }
});

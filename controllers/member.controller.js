const AppError = require("../middleware/AppError");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const { Firm } = require("../models/firm.model");
const File = require("../models/file.model");
const capitalize = require("../utils/capitalize");
const {
  BrokerMember,
  InvestorMember,
  Member,
} = require("../models/member.model");
const Interaction = require("../models/interaction.model");

// @desc    Get all members
// @route   GET /api/members
// @access  Private
module.exports.getAllMembers = asyncHandler(async (req, res, next) => {
  try {
    const {
      memberType,
      name,
      designation,
      isGift,
      sectors,
      localities,
      perPage,
      page,
    } = req.query;

    // Check if any query parameter exists
    const hasQueryParams =
      memberType ||
      name ||
      designation ||
      localities ||
      sectors ||
      isGift !== undefined ||
      perPage ||
      page;

    let query = Member.find();

    if (hasQueryParams) {
      if (memberType) query = query.find({ memberType });
      if (name) query = query.find({ name: { $regex: name, $options: "i" } });
      if (designation)
        query = query.find({ designation: { $in: designation.split(",") } });
      if (sectors) query = query.find({ sectors: { $in: sectors.split(",") } });
      if (localities)
        query = query.find({
          "address.locality": { $in: localities.split(",") },
        });
      if (isGift !== undefined) query = query.find({ isGift });
      if (page && perPage) {
        const currentPage = parseInt(page);
        const pageSize = parseInt(perPage);
        const skip = (currentPage - 1) * pageSize;
        query = query.skip(skip).limit(pageSize);
      }
    }

    const members = await query.populate("firm").sort({ createdAt: -1 }).exec();
    return res.status(200).json({
      success: true,
      data: members,
      totalCount: members.length,
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
    const { memberType, firm, ...rest } = req.body;
    const firmData = await Firm.findById(firm);
    if (!firmData) {
      throw new AppError("Firm not found", 404);
    }
    let member;
    switch (memberType) {
      case "broker":
        member = new BrokerMember({
          firm: firmData._id,
          ...rest,
        });
        break;
      case "investor":
        member = new InvestorMember({
          firm: firmData._id,
          ...rest,
        });
        break;
      default:
        throw new AppError("Invalid member type", 400);
    }
    member.firmHistory.push({
      firm: firmData._id,
    });
    const file = req.uploadedFile;
    if (file) {
      file.firmId = firmData._id;
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
      message: `Member with name ${member.name} created successfully for ${firmData.name}`,
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Get members by firm
// @route   GET /api/members/firm/:firmId
// @access  Private
module.exports.getMembersByFirm = asyncHandler(async (req, res, next) => {
  try {
    const firm = await Firm.findById(req.params.firmId);
    if (!firm) {
      throw new AppError("Firm not found", 404);
    }
    const members = await Member.find({ firm: firm._id }).populate("firm");
    return res.status(200).json({
      success: true,
      data: members,
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
    const member = await Member.findById(req.params.id)
      .populate("firm")
      .populate("firmHistory.firm");
    if (!member) {
      throw new AppError("Member not found", 404);
    }
    return res.status(200).json({
      success: true,
      data: member,
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Update a member
// @route   PUT /api/members/:id
// @access  Private
module.exports.updateMember = asyncHandler(async (req, res, next) => {
  const { memberType, ...rest } = req.body;
  const MemberModel = memberType === "broker" ? BrokerMember : InvestorMember;
  try {
    // Find the member by ID and update it
    let member = await MemberModel.findById(req.params.id);
    // If member not found, throw error
    if (!member) {
      throw new AppError("Member not found", 404);
    }
    // Check if there's an uploaded file
    if (req.uploadedFile) {
      // Update the file details
      const uploadedFile = req.uploadedFile;
      uploadedFile.firmId = member.firm;
      uploadedFile.member = member._id;
      rest.businessCard = uploadedFile._id;

      // If there's an existing businessCard, delete it
      if (member.businessCard) {
        await File.findByIdAndDelete(member.businessCard);
      }
      await uploadedFile.save();
    }
    // Update the member with the new data
    member.set(rest);
    await member.save();
    return res.status(200).json({
      success: true,
      data: member,
      message: `Member with name ${member.name} updated successfully`,
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Delete a member
// @route   DELETE /api/members/:id
// @access  Private
module.exports.deleteMember = asyncHandler(async (req, res, next) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id).populate(
      "firm"
    );
    if (!member) {
      throw new AppError("Member not found", 404);
    }
    await Firm.findByIdAndUpdate(member.firm, {
      $pull: {
        members: member._id,
      },
    });
    await Interaction.deleteMany({ member: member._id });
    await File.findByIdAndDelete(member.businessCard);
    return res.status(200).json({
      success: true,
      message: `Member with name ${member.name} deleted successfully`,
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Move a member to another firm
// @route   PUT /api/members/:id/move
// @access  Private
module.exports.moveMember = asyncHandler(async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      throw new AppError("Member not found", 404);
    }
    // return res.status(200).json({ member });
    const { firm } = req.body;
    if (!firm) {
      throw new AppError("Firm not found", 404);
    }
    const newFirm = await Firm.findById(firm);
    if (!newFirm) {
      throw new AppError("Firm not found", 404);
    }
    if (member.firm.toString() === newFirm._id.toString()) {
      throw new AppError("Member is already in the same firm", 400);
    }
    await Firm.findByIdAndUpdate(member.firm, {
      $pull: {
        members: member._id,
      },
    });
    await Firm.findByIdAndUpdate(newFirm._id, {
      $addToSet: {
        members: member._id,
      },
    });
    const updatedMember = await Member.findByIdAndUpdate(
      member._id,
      {
        memberType:
          newFirm.firmType === "investor" ? "InvestorMember" : "BrokerMember",
        firm: newFirm._id,
        $push: {
          firmHistory: {
            firm: newFirm._id,
          },
        },
      },
      {
        overwriteDiscriminatorKey: true,
        runValidators: true,
        new: true,
      }
    );
    return res.status(200).json({
      success: true,
      message: `${member.name} has been successfully moved to ${newFirm.name}`,
      data: updatedMember,
    });
  } catch (err) {
    next(err);
  }
});

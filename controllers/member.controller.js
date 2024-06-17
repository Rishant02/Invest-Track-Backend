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

    // Fetch the firm data
    const firmData = await Firm.findById(firm);
    if (!firmData) {
      return next(new AppError("Firm not found", 404));
    }

    // Create a new member based on the member type
    let MemberModel;
    switch (memberType) {
      case "broker":
        MemberModel = BrokerMember;
        break;
      case "investor":
        MemberModel = InvestorMember;
        break;
      default:
        return next(new AppError("Invalid member type", 400));
    }

    const member = new MemberModel({
      firm: firmData._id,
      ...rest,
      firmHistory: [{ firm: firmData._id }],
    });

    // Helper function to handle file uploads
    const handleFileUpload = async (file, fieldName) => {
      if (file) {
        const uploadedFile = new File({
          firmId: firmData._id,
          member: member._id,
          originalName: file.originalname,
          mimeType: file.mimetype,
          buffer: file.buffer,
        });
        member[fieldName] = uploadedFile._id;
        await uploadedFile.save();
      }
    };

    // Handle file uploads for businessCardFront and businessCardBack
    if (req.files) {
      await Promise.all([
        handleFileUpload(req.files.businessCardFront?.[0], "businessCardFront"),
        handleFileUpload(req.files.businessCardBack?.[0], "businessCardBack"),
      ]);
    }
    // Save the member
    await member.save();

    // Update the firm's members list
    await Firm.findByIdAndUpdate(member.firm, {
      $addToSet: { members: member._id },
    });

    // Send response
    res.status(201).json({
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
    // Store references to old files
    const oldBusinessCardFront = member.businessCardFront;
    const oldBusinessCardBack = member.businessCardBack;

    // Update the member with the new data
    member.set(rest);

    // Helper function to handle file uploads
    const handleFileUpload = async (file, fieldName) => {
      if (file) {
        const uploadedFile = new File({
          firmId: member.firm,
          member: member._id,
          originalName: file.originalname,
          mimeType: file.mimetype,
          buffer: file.buffer,
        });
        member[fieldName] = uploadedFile._id;
        await uploadedFile.save();
        // If new file is uploaded, remove the old file
        if (fieldName === "businessCardFront" && oldBusinessCardFront) {
          await File.findByIdAndDelete(oldBusinessCardFront);
        }
        if (fieldName === "businessCardBack" && oldBusinessCardBack) {
          await File.findByIdAndDelete(oldBusinessCardBack);
        }
      }
    };
    // Handle file uploads for businessCardFront and businessCardBack
    if (req.files) {
      await Promise.all([
        handleFileUpload(req.files.businessCardFront?.[0], "businessCardFront"),
        handleFileUpload(req.files.businessCardBack?.[0], "businessCardBack"),
      ]);
    }
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

    // Delete associated files (businessCardFront and businessCardBack)
    if (member.businessCardFront) {
      await File.findByIdAndDelete(member.businessCardFront);
    }
    if (member.businessCardBack) {
      await File.findByIdAndDelete(member.businessCardBack);
    }

    // Delete interactions associated with the member
    await Interaction.deleteMany({ member: member._id });

    // Remove the member from the firm's members array
    await Firm.findByIdAndUpdate(member.firm, {
      $pull: { members: member._id },
    });

    return res.status(200).json({
      success: true,
      memberId: member._id, // Include the deleted member's ID in the response
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

// @desc  Add remark to the member
// @route POST /api/members/:id/remark
// @access Private
module.exports.addRemark = asyncHandler(async (req, res, next) => {
  try {
    const { id: memberId } = req.params;
    const member = await Member.findByIdAndUpdate(
      memberId,
      {
        $set: { remark: req.body.remark },
      },
      {
        new: true,
        runValidators: true,
      }
    );
    if (!member) {
      throw new AppError("Member not found", 404);
    }
    res.status(201).json({
      success: true,
      data: member,
      message: "Remark added successfully",
    });
  } catch (err) {
    next(err);
  }
});

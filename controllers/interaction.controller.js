const Interaction = require("../models/interaction.model");
const asyncHandler = require("express-async-handler");
const { Member } = require("../models/member.model");

// @desc    Get all interactions
// @route   GET /api/interactions
// @access  Private
module.exports.getAllInteraction = asyncHandler(async (req, res, next) => {
  try {
    const { firm, member } = req.query;
    const query = {};
    if (firm) query.firm = firm;
    if (member) query.member = member;
    const interactions = await Interaction.find(query);
    return res.status(200).json({
      success: true,
      data: interactions,
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Get a specific interaction
// @route   GET /api/interactions/:id
// @access  Private
module.exports.getInteraction = asyncHandler(async (req, res, next) => {
  try {
    const interaction = await Interaction.findById(req.params.id);
    if (!interaction) {
      throw new AppError("Interaction not found", 404);
    }
    return res.status(200).json({
      success: true,
      data: interaction,
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Update a specific interaction
// @route   PUT /api/interactions/:id
// @access  Private
module.exports.updateInteraction = asyncHandler(async (req, res, next) => {
  try {
    const interaction = await Interaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!interaction) {
      throw new AppError("Interaction not found", 404);
    }
    return res.status(200).json({
      success: true,
      data: interaction,
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Create a new interaction
// @route   /api/interactions
// @access  Private
module.exports.createInteraction = asyncHandler(async (req, res, next) => {
  try {
    const interaction = new Interaction(req.body);
    await interaction.save();
    await Member.findByIdAndUpdate(interaction.member, {
      $addToSet: {
        interactions: interaction._id,
      },
    });
    return res.status(201).json({
      success: true,
      data: interaction,
      message: "Interaction created successfully",
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Delete a specific interaction
// @route   DELETE /api/interactions/:id
// @access  Private
module.exports.deleteInteraction = asyncHandler(async (req, res, next) => {
  try {
    const interaction = await Interaction.findByIdAndDelete(req.params.id);
    if (!interaction) {
      throw new AppError("Interaction not found", 404);
    }
    await Member.findByIdAndUpdate(interaction.member, {
      $pull: {
        interactions: interaction._id,
      },
    });
    return res.status(200).json({
      success: true,
      message: "Interaction deleted successfully",
    });
  } catch (err) {
    next(err);
  }
});

const Event = require("../models/event.model");
const AppError = require("../middleware/AppError");
const asyncHandler = require("express-async-handler");
const { Firm } = require("../models/firm.model");
const { Member } = require("../models/member.model");

// @desc    Get all events
// @route   GET /api/events
// @access  Private
module.exports.getAllEvents = asyncHandler(async (req, res, next) => {
  try {
    const events = await Event.find()
      .populate("firm", "name")
      .populate("member", "name")
      .lean();
    return res.status(200).json({
      success: true,
      data: events,
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Get a specific event
// @route   GET /api/events/:id
// @access  Private
module.exports.getEvent = asyncHandler(async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      throw new AppError("Event not found", 404);
    }
    return res.status(200).json({
      success: true,
      data: event,
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Create a new event
// @route   POST /api/events
// @access  Private
module.exports.createEvent = asyncHandler(async (req, res, next) => {
  try {
    const event = new Event(req.body);
    if (event.startDate > event.endDate) {
      throw new AppError("Start date cannot be greater than end date", 400);
    }
    await event.save();

    // updating the firm
    await Firm.findByIdAndUpdate(event.firm, {
      $addToSet: { events: event._id },
    });

    // updating the member
    await Member.findByIdAndUpdate(event.member, {
      $addToSet: { events: event._id },
    });

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: event,
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Update a specific event
// @route   PUT /api/events/:id
// @access  Private
module.exports.updateEvent = asyncHandler(async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!event) {
      throw new AppError("Event not found", 404);
    }
    return res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: event,
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Delete a specific event
// @route   DELETE /api/events/:id
// @access  Private
module.exports.deleteEvent = asyncHandler(async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      throw new AppError("Event not found", 404);
    }

    // updating the firm
    await Firm.findByIdAndUpdate(event.firm, {
      $pull: { events: event._id },
    });

    // updating the member
    await Member.findByIdAndUpdate(event.member, {
      $pull: { events: event._id },
    });

    return res.status(200).json({
      success: true,
      message: "Event deleted successfully",
      data: event,
    });
  } catch (err) {
    next(err);
  }
});

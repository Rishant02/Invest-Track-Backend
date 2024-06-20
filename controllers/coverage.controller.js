const Coverage = require("../models/coverage.model");
const AppError = require("../middleware/AppError");
const { Broker } = require("../models/firm.model");
const asyncHandler = require("express-async-handler");
const File = require("../models/file.model");

// // @desc    Get coverages by brokers
// // @route   GET /api/coverages
// // @access  Private
// module.exports.getCoverages = asyncHandler(async (req, res, next) => {
//   try {
//     const { brokers } = req.query;
//     if (!brokers) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Brokers parameter is required" });
//     }
//     const brokerIds = brokers.split(",");

//     const coverages = await Coverage.find({ firm: { $in: brokerIds } })
//       .populate("firm", "name")
//       .populate("coverageFile", "-buffer")
//       .lean();

//     return res.status(200).json({ success: true, data: coverages });
//   } catch (error) {
//     next(error);
//   }
// });

// @desc    Get all coverages
// @route   GET /api/coverages/:brokerId
// @access  Private
module.exports.getCoveragesByBroker = asyncHandler(async (req, res, next) => {
  try {
    const { brokerId } = req.params;
    const coverages = await Coverage.find({ firm: brokerId })
      .populate("firm", "name")
      .populate("coverageFile", "-buffer")
      .lean();
    return res.status(200).json({ success: true, data: coverages });
  } catch (err) {
    next(err);
  }
});

// @desc    Create a new coverage
// @route   POST /api/coverages/:brokerId
// @access  Private
module.exports.createCoverage = asyncHandler(async (req, res, next) => {
  try {
    const { brokerId } = req.params;
    const broker = await Broker.findById(brokerId);
    if (!broker) {
      throw new AppError("Broker not found", 404);
    }
    const file = req.uploadedFile;
    const coverage = new Coverage({ ...req.body, firm: brokerId });
    if (file) {
      coverage.coverageFile = file._id;
      file.firmId = brokerId;
    }
    await coverage.save();
    await Broker.findByIdAndUpdate(brokerId, {
      $addToSet: { coverages: coverage._id },
    });
    await file?.save();
    return res.status(201).json({
      success: true,
      data: coverage,
      message: `Coverage for ${broker.name} has been created`,
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Update a coverage
// @route   PUT /api/coverages/:brokerId/:id
// @access  Private
module.exports.updateCoverage = asyncHandler(async (req, res, next) => {
  const { brokerId, id: coverageId } = req.params;
  const { uploadedFile } = req;

  try {
    // Fetch broker and coverage in parallel
    const [broker, coverage] = await Promise.all([
      Broker.findById(brokerId),
      Coverage.findById(coverageId),
    ]);

    // Check if broker or coverage does not exist
    if (!broker || !coverage) {
      const notFoundEntity = !broker ? "Broker" : "Coverage";
      throw new AppError(`${notFoundEntity} not found`, 404);
    }

    // Handle file upload if present
    if (uploadedFile) {
      await File.findByIdAndDelete(coverage.coverageFile);
      req.body.coverageFile = uploadedFile._id;
    }

    // Update coverage
    const newCoverage = await Coverage.findByIdAndUpdate(coverageId, req.body, {
      new: true,
      runValidators: true,
    });

    // Save the new file if it exists
    if (uploadedFile) {
      await uploadedFile.save();
    }

    // Send success response
    res.status(200).json({
      success: true,
      data: newCoverage,
      message: `Coverage for ${broker.name} has been updated`,
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Delete a coverage
// @route   DELETE /api/coverages/:brokerId/:id
// @access  Private
module.exports.deleteCoverage = asyncHandler(async (req, res, next) => {
  try {
    const { brokerId, id: coverageId } = req.params;
    const coverage = await Coverage.findByIdAndDelete(coverageId);
    if (!coverage) {
      throw new AppError("Coverage not found", 404);
    }
    const broker = await Broker.findByIdAndUpdate(
      brokerId,
      {
        $pull: { coverages: coverageId },
      },
      { new: true }
    );
    if (!broker) {
      throw new AppError("Broker not found", 404);
    }
    await File.findByIdAndDelete(coverage?.coverageFile);
    res.status(200).json({
      success: true,
      message: `Coverage for ${broker.name} has been deleted`,
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Get a single coverage
// @route   GET /api/coverages/:brokerId/:id
// @access  Private
module.exports.getCoverage = asyncHandler(async (req, res, next) => {
  try {
    const { id: coverageId } = req.params;
    const coverage = await Coverage.findById(coverageId)
      .populate("firm", "name")
      .populate("coverageFile")
      .lean();
    if (!coverage) {
      throw new AppError("Coverage not found", 404);
    }
    return res.status(200).json({ success: true, data: coverage });
  } catch (err) {
    next(err);
  }
});

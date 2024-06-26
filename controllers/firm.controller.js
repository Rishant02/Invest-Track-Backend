const asyncHandler = require("express-async-handler");
const { Broker, Investor, Firm } = require("../models/firm.model");
const Coverage = require("../models/coverage.model");
const User = require("../models/user.model");
const AppError = require("../middleware/AppError");
const File = require("../models/file.model");

// @desc    Get all firms by firmType
// @route   GET /api/firms
// @access  Private
module.exports.getFirms = asyncHandler(async (req, res, next) => {
  try {
    const {
      firmType,
      perPage,
      page,
      name,
      locationType,
      sectors,
      regionalSectors,
      regionalFocus,
      localities,
      isActive,
    } = req.query;

    let query = Firm.find();

    const hasQueryParams =
      firmType ||
      perPage ||
      page ||
      name ||
      locationType ||
      sectors ||
      regionalSectors ||
      regionalFocus ||
      localities ||
      isActive !== undefined;

    if (hasQueryParams) {
      if (firmType) query = query.find({ firmType });
      if (name) query = query.find({ name: { $regex: name, $options: "i" } });
      if (locationType) query = query.find({ locationType });
      if (sectors) query = query.find({ sectors: { $in: sectors.split(",") } });
      if (localities)
        query = query.find({
          "address.locality": { $in: localities.split(",") },
        });
      if (regionalSectors)
        query = query.find({
          regionalSectors: { $in: regionalSectors.split(",") },
        });
      if (regionalFocus)
        query = query.find({
          regionalFocus: { $in: regionalFocus.split(",") },
        });
      if (isActive !== undefined) query = query.find({ isActive });
      if (page && perPage) {
        const currentPage = parseInt(page);
        const pageSize = parseInt(perPage);
        const skip = (currentPage - 1) * pageSize;
        query = query.skip(skip).limit(pageSize);
      }
    }
    const firms = await query.sort({ firmType: 1 }).exec();

    return res.status(200).json({
      success: true,
      data: firms,
      totalCount: firms.length,
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Get a firm
// @route   GET /api/firms/:id
// @access  Private
module.exports.getFirm = asyncHandler(async (req, res, next) => {
  try {
    const firm = await Firm.findById(req.params.id)
      .populate(
        "members",
        "name,email,designation,comment,mobileNumber,officeNumber"
      )
      .populate("coverages", "-buffer")
      .populate("fundFactsheets.file", "-buffer")
      .lean();
    if (!firm) {
      throw new AppError("Firm not found", 404);
    }
    res.status(200).json({ success: true, data: firm });
  } catch (err) {
    next(err);
  }
});

// @desc    Create a new firm
// @route   POST /api/firms
// @access  Private
module.exports.createFirm = asyncHandler(async (req, res, next) => {
  try {
    const { type, ...rest } = req.body;
    let firm;
    switch (type) {
      case "broker":
        firm = new Broker({ createdBy: req.user._id, ...rest });
        break;
      case "investor":
        firm = new Investor({ createdBy: req.user._id, ...rest });
        break;
      default:
        throw new AppError("Invalid firm type", 400);
    }
    await firm.save();
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { firms: firm._id },
    });
    res.status(201).json({
      success: true,
      data: firm,
      message: `${firm.name} has been created`,
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Update a firm
// @route   PUT /api/firms/:id
// @access  Private
module.exports.updateFirm = asyncHandler(async (req, res, next) => {
  try {
    const { type } = req.body;
    let firm;
    switch (type) {
      case "broker":
        firm = await Broker.findByIdAndUpdate(req.params.id, req.body, {
          new: true,
          runValidators: true,
        });
        break;
      case "investor":
        firm = await Investor.findByIdAndUpdate(req.params.id, req.body, {
          new: true,
          runValidators: true,
        });
        break;
      default:
        throw new AppError("Invalid firm type", 400);
    }
    res.status(200).json({
      success: true,
      data: firm,
      message: `${firm.name} has been updated`,
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Delete a firm
// @route   DELETE /api/firms/:id
// @access  Private
module.exports.deleteFirm = asyncHandler(async (req, res, next) => {
  try {
    // const firm = await Firm.findByIdAndDelete(req.params.id);
    const firm = await Firm.findByIdAndUpdate(
      req.params.id,
      {
        isActive: false,
      },
      { new: true }
    );
    if (!firm) {
      throw new AppError("Firm not found", 404);
    }
    // await User.findByIdAndUpdate(req.user._id, {
    //   $pull: { firms: firm._id },
    // });
    // await Coverage.deleteMany({ firm: firm._id });
    // await File.deleteMany({ firmId: firm._id });
    // await Member.deleteMany({ firm: firm._id });
    // await Interaction.deleteMany({ firm: firm._id }); // TODO: to be discussed
    res
      .status(200)
      .json({ success: true, message: `${firm.name} has been deactivated` });
  } catch (err) {
    next(err);
  }
});

// @desc  Get all fundsheets of Investor
// @route GET /api/firms/:id/sheet
// @access Private
module.exports.getFundSheets = asyncHandler(async (req, res, next) => {
  try {
    const { id: firmId } = req.params;
    const fundFactsheets = await Investor.findById(firmId)
      ?.select("fundFactsheets -_id")
      ?.populate("fundFactsheets.file", "-buffer")
      ?.lean();
    if (!fundFactsheets) {
      throw new AppError("Firm not found", 404);
    }
    res.status(200).json({
      success: true,
      data: fundFactsheets,
    });
  } catch (err) {
    next(err);
  }
});

// @desc  Upload fundsheet of Investor
// @route POST /api/firms/:id/sheet
// @access Private
module.exports.uploadFundSheet = asyncHandler(async (req, res, next) => {
  try {
    const { id: firmId } = req.params;
    const investor = await Investor.findById(firmId);
    if (!investor) {
      throw new AppError("Firm not found", 404);
    }
    const { documentDate } = req.body;
    const file = req.uploadedFile;
    await Investor.findByIdAndUpdate(firmId, {
      $addToSet: { fundFactsheets: { documentDate, file: file._id } },
    });
    await file.save();
    res.status(201).json({
      success: true,
      message: `${file.originalName} has been uploaded`,
    });
  } catch (err) {
    next(err);
  }
});

// @desc  Delete fundsheet of Investor
// @route DELETE /api/firms/:id/sheet/:sheetId
// @access Private
module.exports.deleteFundSheet = asyncHandler(async (req, res, next) => {
  try {
    const { id: firmId, sheetId } = req.params;
    const investor = await Investor.findById(firmId);
    if (!investor) {
      throw new AppError("Firm not found", 404);
    }
    const file = await File.findById(sheetId);
    if (!file) {
      throw new AppError("File not found", 404);
    }
    await File.findByIdAndDelete(sheetId);
    await Investor.findByIdAndUpdate(firmId, {
      $pull: { fundFactsheets: { file: file._id } },
    });
    res.status(200).json({
      success: true,
      message: `${file.originalName} has been deleted`,
    });
  } catch (err) {
    next(err);
  }
});
// @desc  Upload coverages of Broker
// @route POST /api/firms/:id/coverage
// @access Private
module.exports.uploadCoverage = asyncHandler(async (req, res, next) => {
  try {
    const { id: firmId } = req.params;
    const broker = await Broker.findById(firmId);
    if (!broker) {
      throw new AppError("Firm not found", 404);
    }
    if (!req.file) {
      throw new AppError("File not attached", 404);
    }
    const coverage = new Coverage({
      firmId,
      ...req.body,
    });
    const { originalname: originalName, mimetype: mimeType, buffer } = req.file;
    const file = new File({
      firmId,
      originalName,
      mimeType,
      buffer,
    });
    coverage.firm = firmId;
    coverage.coverageFile = file._id;
    await coverage.save();
    await Broker.findByIdAndUpdate(firmId, {
      $addToSet: { coverages: coverage._id },
    });
    await file.save();
    res.status(201).json({
      success: true,
      message: `${originalName} has been uploaded`,
    });
  } catch (err) {
    next(err);
  }
});

// @desc  Add remark to the firm
// @route POST /api/firms/:id/remark
// @access Private
module.exports.addRemark = asyncHandler(async (req, res, next) => {
  try {
    const { id: firmId } = req.params;
    const firm = await Firm.findByIdAndUpdate(
      firmId,
      {
        $set: { remark: req.body.remark },
      },
      { new: true, runValidators: true }
    );
    if (!firm) {
      throw new AppError("Firm not found", 404);
    }
    res.status(200).json({
      success: true,
      message: "Remark added successfully",
      data: firm,
    });
  } catch (err) {
    next(err);
  }
});

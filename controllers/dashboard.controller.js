const asyncHandler = require("express-async-handler");
const Coverage = require("../models/coverage.model");
const { Firm, Broker, Investor } = require("../models/firm.model");
const { Member, InvestorMember } = require("../models/member.model");
const Interaction = require("../models/interaction.model");

// @desc  Get Stats for dashboard
// @route GET /api/dashboard
// @access Private
module.exports.getDashboard = asyncHandler(async (req, res, next) => {
  try {
    const [
      totalFirms,
      totalBrokers,
      totalInvestors,
      totalMembers,
      totalAnalysts,
      totalFundManagers,
      totalInteractions,
      byBrokerLocType,
      byInvestorLocType,
      byInvestorMemberCountry,
      byInvestorMemberRegionalFocus,
      byFirmIndianExposure,
      byMemberIndianExposure,
    ] = await Promise.all([
      Firm.estimatedDocumentCount(),
      Broker.countDocuments(),
      Investor.countDocuments(),
      Member.estimatedDocumentCount(),
      Member.countDocuments({ designation: "Analyst" }),
      Member.countDocuments({ designation: "Fund Manager" }),
      Interaction.estimatedDocumentCount(),
      Broker.aggregate([
        { $unwind: "$locationType" },
        { $group: { _id: "$locationType", count: { $sum: 1 } } },
        { $limit: 2 },
        { $project: { _id: 0, locationType: "$_id", count: 1 } },
      ]),
      Investor.aggregate([
        { $unwind: "$locationType" },
        { $group: { _id: "$locationType", count: { $sum: 1 } } },
        { $limit: 2 },
        { $project: { _id: 0, locationType: "$_id", count: 1 } },
      ]),
      InvestorMember.aggregate([
        { $unwind: "$address.country" },
        { $group: { _id: "$address.country", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, country: "$_id", count: 1 } },
      ]),
      InvestorMember.aggregate([
        { $unwind: "$regionalFocus" },
        { $group: { _id: "$regionalFocus", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, regionalFocus: "$_id", count: 1 } },
      ]),
      Investor.aggregate([
        { $match: { "fundSize.indianExposure": { $ne: null } } },
        { $sort: { "fundSize.indianExposure": -1 } },
        { $limit: 10 },
        { $project: { _id: 0, name: 1, count: "$fundSize.indianExposure" } },
      ]),
      InvestorMember.aggregate([
        { $match: { "fundSize.indianExposure": { $ne: null } } },
        { $sort: { "fundSize.indianExposure": -1 } },
        { $limit: 10 },
        { $project: { _id: 0, name: 1, count: "$fundSize.indianExposure" } },
      ]),
    ]);
    const byBrokerCoverage = await Coverage.aggregate([
      {
        $lookup: {
          from: "firms",
          localField: "firm",
          foreignField: "_id",
          as: "firm",
        },
      },
      { $unwind: "$firm" },
      {
        $sort: {
          fiscalYear: 1,
          quarter: 1,
          tp: -1,
        },
      },
      {
        $group: {
          _id: {
            firm: "$firm.name",
            fiscalYear: "$fiscalYear",
            quarter: "$quarter",
          },
          topFirms: {
            $push: {
              tp: "$tp",
              recommendation: "$recommendation",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          fiscalYear: "$_id.fiscalYear",
          quarter: "$_id.quarter",
          firm: "$_id.firm",
          topFirms: { $arrayElemAt: ["$topFirms", 0] }, // Take the first element only
        },
      },
      {
        $group: {
          _id: { fiscalYear: "$fiscalYear", quarter: "$quarter" },
          firms: {
            $push: {
              firm: "$firm",
              tp: "$topFirms.tp",
              recommendation: "$topFirms.recommendation",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          fiscalYear: "$_id.fiscalYear",
          quarter: "$_id.quarter",
          topFirms: { $slice: ["$firms", 10] }, // Limit to top 10 firms
        },
      },
      {
        $sort: {
          fiscalYear: 1,
          quarter: -1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totals: {
          totalFirms,
          totalBrokers,
          totalInvestors,
          totalMembers,
          totalAnalysts,
          totalFundManagers,
          totalInteractions,
        },
        firmStats: {
          broker: {
            byBrokerLocType,
            byBrokerCoverage,
          },
          investor: {
            byInvestorLocType,
            byFirmIndianExposure,
          },
        },
        memberStats: {
          broker: {},
          investor: {
            byInvestorMemberCountry,
            byInvestorMemberRegionalFocus,
            byMemberIndianExposure,
          },
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

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
          _id: { firm: "$firm.name", fiscalYear: "$fiscalYear" },
          Q1: {
            $push: {
              $cond: [
                { $eq: ["$quarter", 1] },
                { tp: "$tp", recommendation: "$recommendation" },
                null,
              ],
            },
          },
          Q2: {
            $push: {
              $cond: [
                { $eq: ["$quarter", 2] },
                { tp: "$tp", recommendation: "$recommendation" },
                null,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          firm: "$_id.firm",
          fiscalYear: "$_id.fiscalYear",
          Q1: {
            $arrayElemAt: [
              { $filter: { input: "$Q1", cond: { $ne: ["$$this", null] } } },
              0,
            ],
          },
          Q2: {
            $arrayElemAt: [
              { $filter: { input: "$Q2", cond: { $ne: ["$$this", null] } } },
              0,
            ],
          },
        },
      },
      {
        $group: {
          _id: "$fiscalYear",
          topFirms: { $push: { firm: "$firm", Q1: "$Q1", Q2: "$Q2" } },
        },
      },
      {
        $project: {
          _id: 0,
          fiscalYear: "$_id",
          topFirms: { $slice: ["$topFirms", 10] },
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

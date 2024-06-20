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
      byBrokerCoverage,
      byInvestorMemberCountry,
      byInvestorMemberRegionalFocus,
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
      Coverage.aggregate([
        {
          $lookup: {
            from: "firms",
            localField: "firm",
            foreignField: "_id",
            as: "firmDetails",
          },
        },
        { $unwind: "$firmDetails" },
        { $match: { quarter: { $in: [1, 2] } } },
        {
          $project: {
            _id: 0,
            name: "$firmDetails.name",
            quarter: "$quarter",
            fiscalYear: "$fiscalYear",
            tp: "$tp",
            recommendation: "$recommendation",
          },
        },
        { $sort: { tp: -1 } },
        { $limit: 10 },
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
          },
        },
        memberStats: {
          broker: {},
          investor: {
            byInvestorMemberCountry,
            byInvestorMemberRegionalFocus,
          },
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

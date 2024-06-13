const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const { Firm, Broker, Investor } = require("../models/firm.model");
const {
  Member,
  BrokerMember,
  InvestorMember,
} = require("../models/member.model");
const Interaction = require("../models/interaction.model");

module.exports.getDashboard = asyncHandler(async (req, res, next) => {
  try {
    const [
      totalFirms,
      totalBrokers,
      totalInvestors,
      totalMembers,
      totalBrokerMembers,
      totalInvestorMembers,
      totalInteractions,
    ] = await Promise.all([
      Firm.estimatedDocumentCount(),
      Broker.countDocuments(),
      Investor.countDocuments(),
      Member.estimatedDocumentCount(),
      BrokerMember.countDocuments(),
      InvestorMember.countDocuments(),
      Interaction.estimatedDocumentCount(),
    ]);

    const getMemberStats = async (Model, type) => {
      const bySectors = await Model.aggregate([
        { $unwind: "$sectors" },
        { $group: { _id: "$sectors", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, sector: "$_id", count: 1 } },
      ]);

      const byLocality = await Model.aggregate([
        { $unwind: "$address.locality" },
        { $group: { _id: "$address.locality", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, locality: "$_id", count: 1 } },
      ]);

      const byDesignation = await Model.aggregate([
        { $unwind: "$designation" },
        { $group: { _id: "$designation", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, designation: "$_id", count: 1 } },
      ]);

      return { bySectors, byLocality, byDesignation, type };
    };

    const brokerMemberStats = await getMemberStats(BrokerMember, "broker");
    const investorMemberStats = await getMemberStats(
      InvestorMember,
      "investor"
    );

    return res.status(200).json({
      success: true,
      data: {
        totals: {
          totalFirms,
          totalBrokers,
          totalInvestors,
          totalMembers,
          totalBrokerMembers,
          totalInvestorMembers,
          totalInteractions,
        },
        brokerMemberStats,
        investorMemberStats,
      },
    });
  } catch (err) {
    next(err);
  }
});

const router = require("express").Router();
const {
  createInteraction,
  deleteInteraction,
  getAllInteraction,
  getInteraction,
  updateInteraction,
} = require("../controllers/interaction.controller");
const isAuthenticated = require("../middleware/isAuthenticated");
const isAdmin = require("../middleware/isAdmin");

router
  .get("/", isAuthenticated, isAdmin, getAllInteraction)
  .post("/", isAuthenticated, isAdmin, createInteraction)
  .get("/:id", isAuthenticated, isAdmin, getInteraction)
  .put("/:id", isAuthenticated, isAdmin, updateInteraction)
  .delete("/:id", isAuthenticated, isAdmin, deleteInteraction);

module.exports = router;

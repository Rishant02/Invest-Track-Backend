const router = require("express").Router();
const {
  createEvent,
  getAllEvents,
  getEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/event.controller");
const isAuthenticated = require("../middleware/isAuthenticated");
const isAdmin = require("../middleware/isAdmin");

router
  .get("/", isAuthenticated, isAdmin, getAllEvents)
  .post("/", isAuthenticated, isAdmin, createEvent)
  .get("/:id", isAuthenticated, isAdmin, getEvent)
  .put("/:id", isAuthenticated, isAdmin, updateEvent)
  .delete("/:id", isAuthenticated, isAdmin, deleteEvent);

module.exports = router;

const router = require("express").Router();
const isAuthenticated = require("../middleware/isAuthenticated");
const { getDashboard } = require("../controllers/dashboard.controller");

router.get("/", isAuthenticated, getDashboard);

module.exports = router;

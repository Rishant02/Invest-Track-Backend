const router = require("express").Router();
const { downloadFile, getFile } = require("../controllers/file.controller");
const isAdmin = require("../middleware/isAdmin");
const isAuthenticated = require("../middleware/isAuthenticated");

router.get("/:id", isAuthenticated, isAdmin, getFile);
router.get("/:id/download", downloadFile);

module.exports = router;

const router = require("express").Router();
const { downloadFile, getFile } = require("../controllers/file.controller");

router.get("/:id", getFile);
router.get("/:id/download", downloadFile);

module.exports = router;

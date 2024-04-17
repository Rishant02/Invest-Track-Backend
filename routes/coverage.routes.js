const router = require("express").Router();
const isAuthenticated = require("../middleware/isAuthenticated");
const isAdmin = require("../middleware/isAdmin");
const upload = require("../config/multerUpload");
const uploadFile = require("../middleware/uploadFile");
const {
  getAllCoverages,
  createCoverage,
  deleteCoverage,
  getCoverage,
  updateCoverage,
  getCoverages,
} = require("../controllers/coverage.controller");

router
  .get("/:brokerId", isAuthenticated, isAdmin, getAllCoverages)
  .post("/", isAuthenticated, isAdmin, getCoverages)
  .post(
    "/:brokerId",
    isAuthenticated,
    isAdmin,
    upload.single("coverage"),
    uploadFile(true),
    createCoverage
  )
  .get("/:brokerId/:id", isAuthenticated, isAdmin, getCoverage)
  .put(
    "/:brokerId/:id",
    isAuthenticated,
    isAdmin,
    upload.single("coverage"),
    uploadFile(false),
    updateCoverage
  )
  .delete("/:brokerId/:id", isAuthenticated, isAdmin, deleteCoverage);

module.exports = router;

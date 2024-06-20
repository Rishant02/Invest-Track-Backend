const router = require("express").Router();
const isAuthenticated = require("../middleware/isAuthenticated");
const isAdmin = require("../middleware/isAdmin");
const upload = require("../config/multerUpload");
const uploadFile = require("../middleware/uploadFile");
const {
  getCoveragesByBroker,
  createCoverage,
  deleteCoverage,
  getCoverage,
  updateCoverage,
} = require("../controllers/coverage.controller");

router
  .get("/:brokerId", isAuthenticated, isAdmin, getCoveragesByBroker)
  // .get("/", isAuthenticated, isAdmin, getCoverages)
  .post(
    "/:brokerId",
    isAuthenticated,
    isAdmin,
    upload.single("coverage"),
    uploadFile(false),
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

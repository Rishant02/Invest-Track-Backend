const router = require("express").Router();
const isAuthenticated = require("../middleware/isAuthenticated");
const isAdmin = require("../middleware/isAdmin");
const upload = require("../config/multerUpload");
const uploadFile = require("../middleware/uploadFile");

const {
  createFirm,
  getFirms,
  getFirm,
  updateFirm,
  deleteFirm,
  uploadFundSheet,
  deleteFundSheet,
  getFundSheets,
  addRemark,
} = require("../controllers/firm.controller");

router
  .get("/", isAuthenticated, getFirms)
  .get("/:id", isAuthenticated, getFirm)
  .post("/", isAuthenticated, isAdmin, createFirm)
  .put("/:id", isAuthenticated, isAdmin, updateFirm)
  .delete("/:id", isAuthenticated, isAdmin, deleteFirm)
  .get("/:id/sheet", isAuthenticated, isAdmin, getFundSheets)
  .post(
    "/:id/sheet",
    isAuthenticated,
    isAdmin,
    upload.single("sheet"),
    uploadFile(true),
    uploadFundSheet
  )
  .delete("/:id/sheet/:sheetId", isAuthenticated, isAdmin, deleteFundSheet)
  .post("/:id/remark", isAuthenticated, isAdmin, addRemark);

module.exports = router;

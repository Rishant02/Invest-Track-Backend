const router = require("express").Router();
const isAuthenticated = require("../middleware/isAuthenticated");
const isAdmin = require("../middleware/isAdmin");
const upload = require("../config/multerUpload");
const uploadFile = require("../middleware/uploadFile");

const {
  getAllMembers,
  createMember,
  deleteMember,
  moveMember,
  getMember,
  getMembersByFirm,
  updateMember,
} = require("../controllers/member.controller");

router
  .get("/", isAuthenticated, isAdmin, getAllMembers)
  .post(
    "/",
    isAuthenticated,
    isAdmin,
    upload.single("businessCard"),
    uploadFile(false),
    createMember
  )
  .get("/:id", isAuthenticated, isAdmin, getMember)
  .put(
    "/:id",
    isAuthenticated,
    isAdmin,
    upload.single("businessCard"),
    uploadFile(false),
    updateMember
  )
  .delete("/:id", isAuthenticated, isAdmin, deleteMember)
  .post("/:id/move", isAuthenticated, isAdmin, moveMember)
  .get("/firm/:firmId", isAuthenticated, isAdmin, getMembersByFirm);

module.exports = router;

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
  addRemark,
} = require("../controllers/member.controller");

router
  .get("/", isAuthenticated, isAdmin, getAllMembers)
  .post(
    "/",
    isAuthenticated,
    isAdmin,
    upload.fields([
      { name: "businessCardFront", maxCount: 1 },
      { name: "businessCardBack", maxCount: 1 },
    ]),
    createMember
  )
  .get("/:id", isAuthenticated, isAdmin, getMember)
  .put(
    "/:id",
    isAuthenticated,
    isAdmin,
    upload.fields([
      { name: "businessCardFront", maxCount: 1 },
      { name: "businessCardBack", maxCount: 1 },
    ]),
    updateMember
  )
  .delete("/:id", isAuthenticated, isAdmin, deleteMember)
  .put("/:id/move", isAuthenticated, isAdmin, moveMember)
  .post("/:id/remark", isAuthenticated, isAdmin, addRemark)
  .get("/firm/:firmId", isAuthenticated, isAdmin, getMembersByFirm);

module.exports = router;

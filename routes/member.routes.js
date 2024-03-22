const router = require("express").Router();
const isAuthenticated = require("../middleware/isAuthenticated");
const isAdmin = require("../middleware/isAdmin");
const upload = require("../config/multerUpload");
const uploadFile = require("../middleware/uploadFile");

const {
  getAllMembers,
  createMember,
  deleteMember,
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
  .get("/:id", isAuthenticated, isAdmin, (req, res) =>
    res.json({ message: "GET /api/members/:id" })
  )
  .put("/:id", isAuthenticated, isAdmin, (req, res) =>
    res.json({ message: "PUT /api/members/:id" })
  )
  .delete("/:id", isAuthenticated, isAdmin, deleteMember)
  .post("/:id/move", isAuthenticated, isAdmin, (req, res) =>
    res.json({ message: "POST /api/members/:id/move" })
  );

module.exports = router;

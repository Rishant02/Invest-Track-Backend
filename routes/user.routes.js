const router = require("express").Router();
const { getUser, updateUser } = require("../controllers/user.controller");
const isAuthenticated = require("../middleware/isAuthenticated");
const upload = require("../config/multerUpload");
const uploadFile = require("../middleware/uploadFile");

router
  .get("/", isAuthenticated, getUser)
  .put(
    "/",
    isAuthenticated,
    upload.single("avatar"),
    uploadFile(false),
    updateUser
  )
  .delete("/", (req, res) =>
    res.json({ message: "DELETE /api/users/:id is working" })
  );

module.exports = router;

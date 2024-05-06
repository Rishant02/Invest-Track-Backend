const router = require("express").Router();
const {
  registerUser,
  loginUser,
  logoutUser,
  changePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controller");
const isAuthenticated = require("../middleware/isAuthenticated");

router.post("/login", loginUser);
router.post("/register", registerUser);
router.get("/logout", isAuthenticated, logoutUser);
router.post("/change-password", isAuthenticated, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;

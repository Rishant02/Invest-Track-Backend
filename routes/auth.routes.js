const router = require("express").Router();
const {
  registerUser,
  loginUser,
  logoutUser,
} = require("../controllers/auth.controller");
const isAuthenticated = require("../middleware/isAuthenticated");

router.post("/login", loginUser);
router.post("/register", registerUser);
router.get("/logout", isAuthenticated, logoutUser);

module.exports = router;

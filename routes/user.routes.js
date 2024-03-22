const router = require("express").Router();
const { getUser, updateUser } = require("../controllers/user.controller");
const isAuhenticated = require("../middleware/isAuthenticated");

router
  .get("/", isAuhenticated, getUser)
  .put("/:id", isAuhenticated, updateUser)
  .delete("/:id", (req, res) =>
    res.json({ message: "DELETE /api/users/:id is working" })
  );

module.exports = router;

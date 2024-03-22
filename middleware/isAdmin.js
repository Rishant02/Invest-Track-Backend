const User = require("../models/user.model");

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (user.role !== "admin") {
      res.status(401);
      throw new Error("Not authorized");
    }
    delete req.userId;
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
module.exports = isAdmin;

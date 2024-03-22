const jwt = require("jsonwebtoken");
const AppError = require("../middleware/AppError");
const isAuhenticated = async (req, res, next) => {
  try {
    const bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader !== "undefined") {
      const token = bearerHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded.id) {
        throw new AppError("Token is invalid or expired", 401);
      }
      req.userId = decoded.id;
      next();
    } else {
      throw new AppError("Invalid token", 401);
    }
  } catch (err) {
    next(err);
  }
};

module.exports = isAuhenticated;

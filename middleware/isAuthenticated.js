const jwt = require("jsonwebtoken");
const { TokenExpiredError } = require("jsonwebtoken");
const AppError = require("../middleware/AppError");

const isAuthenticated = async (req, res, next) => {
  try {
    const bearerHeader = req.headers["authorization"];
    if (!bearerHeader || !bearerHeader.startsWith("Bearer ")) {
      throw new AppError("Invalid token format", 401);
    }
    const token = bearerHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id) {
      throw new AppError("Token is invalid", 401);
    }
    req.userId = decoded.id;
    next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return next(new AppError("Token is expired", 401));
    }
    next(err);
  }
};

module.exports = isAuthenticated;

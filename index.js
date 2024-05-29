require("dotenv").config({ path: ".env" });
const path = require("path");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const ErrorHandler = require("./middleware/ErrorHandler"); // Error Middleware
const port = process.env.PORT || 5000;

connectDB();
const app = express();

// required middlewares
app.use(helmet());
app.use(helmet.crossOriginEmbedderPolicy({ policy: "credentialless" }));
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    originAgentCluster: true,
  })
);
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "img-src": ["'self'", "https:", "data:", "blob:"],
    },
  })
);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("trust proxy", 1);
app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: "You have exceeded the 500 requests in 15 minutes limit!",
    keyGenerator: (req) => {
      return req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    },
  })
);

// API Routes
app.get("/api", (req, res) => {
  res.json({ message: "InvestTrack API is running" });
});
// Adding routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/firms", require("./routes/firm.routes"));
app.use("/api/coverages", require("./routes/coverage.routes"));
app.use("/api/members", require("./routes/member.routes"));
app.use("/api/interactions", require("./routes/interaction.routes"));
app.use("/api/files", require("./routes/file.routes"));
app.use(ErrorHandler);
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Listen to server
app.listen(port, () => {
  console.log(`InvestTrack server is running on ${port}`);
});

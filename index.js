require("dotenv").config({ path: ".env" });
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const helmet = require("helmet");
const ErrorHandler = require("./middleware/ErrorHandler"); // Error Middleware
const port = process.env.PORT || 5000;

connectDB();
const app = express();

// required middlewares
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true, credentials: true }));

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

// Listen to server
app.listen(port, () => {
  console.log(`InvestTrack server is running on ${port}`);
});

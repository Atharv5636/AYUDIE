const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const patientRoutes = require("./routes/patient.routes");
const planRoutes = require("./routes/plan.routes");
const progressRoutes = require("./routes/progress.routes");

const errorHandler = require("./middlewares/error.middleware");

const app = express();

app.use(express.json());
app.use(cors());

// routes
app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/patients", patientRoutes);
app.use("/plans", planRoutes);
app.use("/progress", progressRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// error middleware (always last)
app.use(errorHandler);

module.exports = app;

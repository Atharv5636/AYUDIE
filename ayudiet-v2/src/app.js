const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const patientRoutes = require("./routes/patient.routes");
const planRoutes = require("./routes/plan.routes");
const progressRoutes = require("./routes/progress.routes");

const errorHandler = require("./middlewares/error.middleware");

const app = express();
const isProduction = process.env.NODE_ENV === "production";

const debugLogsEnabled = process.env.DEBUG_LOGS === "true";
const allowedOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow server-to-server or curl requests with no Origin header.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // In local/dev we allow unknown origins to avoid blocking local tools.
    if (!isProduction && allowedOrigins.length === 0) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

app.set("trust proxy", 1);
app.use(express.json());
app.use(cors(corsOptions));

if (debugLogsEnabled) {
  app.use((req, res, next) => {
    const hasAuthHeader = Boolean(req.headers.authorization);
    console.log(`[REQ] ${req.method} ${req.originalUrl} | auth=${hasAuthHeader}`);
    next();
  });
}

app.get("/", (req, res) => {
  res.send("API is running");
});

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

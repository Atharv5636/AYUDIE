require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 3000;

const validateEnv = () => {
  const required = ["MONGO_URI", "JWT_SECRET"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (
    process.env.NODE_ENV === "production" &&
    !process.env.CORS_ORIGIN &&
    !process.env.FRONTEND_ORIGIN
  ) {
    throw new Error("Set CORS_ORIGIN (or FRONTEND_ORIGIN) in production");
  }

  if (process.env.JWT_SECRET === "change_this_to_a_secure_random_secret") {
    throw new Error("JWT_SECRET is using a placeholder value. Set a strong secret.");
  }
};

const startServer = async () => {
  try {
    console.log("Starting backend startup sequence...");
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`Port: ${PORT}`);
    validateEnv();
    console.log("Calling connectDB()...");
    await connectDB();
    console.log("Database connected. Starting Express server...");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message || error);
    process.exit(1);
  }
};

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

startServer();

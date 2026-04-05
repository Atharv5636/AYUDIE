const mongoose = require("mongoose");

let eventsRegistered = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("Missing MONGO_URI in environment");
  }

  if (
    !process.env.MONGO_URI.includes("mongodb+srv://") ||
    !process.env.MONGO_URI.includes(".mongodb.net")
  ) {
    throw new Error("Invalid MONGO_URI format: expected MongoDB Atlas SRV URI");
  }

  const maskedHost = process.env.MONGO_URI.split("@")[1] || "unknown-host";
  console.log("Using MongoDB host:", maskedHost);

  if (!eventsRegistered) {
    mongoose.connection.on("connected", () => {
      console.log("Mongoose connected");
    });

    mongoose.connection.on("error", (err) => {
      console.log("Mongoose error:", err.message || err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("Mongoose disconnected");
    });

    eventsRegistered = true;
  }

  const maxRetries = Number(process.env.DB_CONNECT_RETRIES || 5);
  const retryDelayMs = Number(process.env.DB_RETRY_DELAY_MS || 3000);

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      console.log(`Connecting to MongoDB... attempt ${attempt}/${maxRetries}`);
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log(
        `MongoDB Connected: ${conn.connection.host} | readyState=${mongoose.connection.readyState}`
      );
      return;
    } catch (error) {
      lastError = error;
      console.error(
        `MongoDB connection attempt ${attempt} failed:`,
        error.message || error
      );

      if (attempt < maxRetries) {
        await sleep(retryDelayMs);
      }
    }
  }

  throw lastError || new Error("MongoDB connection failed");
};

module.exports = connectDB;

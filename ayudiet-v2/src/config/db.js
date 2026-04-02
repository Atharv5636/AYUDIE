const mongoose = require("mongoose");

const MONGO_URI = "mongodb://127.0.0.1:27017/ayudiet";

let eventsRegistered = false;

const connectDB = async () => {
  try {
    if (!eventsRegistered) {
      mongoose.connection.on("connected", () => {
        console.log("MongoDB connected successfully");
      });

      mongoose.connection.on("error", (error) => {
        console.error("MongoDB connection error:", error.message);
      });

      eventsRegistered = true;
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
  } catch (error) {
    console.error("MongoDB connection failed", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

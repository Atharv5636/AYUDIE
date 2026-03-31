// Import the Express app instance
// app.js contains all middleware and routes
const app = require("./app");

// Import MongoDB connection function
// This function connects Node.js to MongoDB using Mongoose
const connectDB = require("./config/db");

// Load environment variables from .env file into process.env
// This MUST be done before accessing process.env.MONGO_URI
require("dotenv").config();

// Establish database connection BEFORE starting the server
// This is critical because the app should not run without DB access
connectDB(); // ⬅️ CRITICAL LINE

// Define the port on which the server will run
// This is where the backend listens for incoming requests
const PORT = 3000;

// Start the server and listen for incoming HTTP requests
// This runs only after MongoDB is connected successfully
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

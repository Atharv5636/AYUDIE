// This is a CENTRALIZED ERROR-HANDLING MIDDLEWARE
// Express identifies this as an error middleware
// because it has 4 parameters: (err, req, res, next)

const errorHandler = (err, req, res, next) => {
  // Log the error in the server console
  // This helps the developer debug the issue
  // (We do NOT show full error details to the client)
  console.error(err);

  // If the error has a statusCode (custom error like ApiError),
  // use it. Otherwise, default to 500 (Internal Server Error)
  const statusCode = err.statusCode || err.status || 500;

  // If the error has a message, use it.
  // Otherwise, send a safe generic message
  const message = err.message || "Internal Server Error";

  // Send a clean JSON response to the client
  // Frontend can easily handle this format
  res.status(statusCode).json({
    success: false,   // indicates API failure
    message,          // error message to show
  });
};

// Export the middleware so it can be used in app.js
module.exports = errorHandler;

// This is a CENTRALIZED ERROR-HANDLING MIDDLEWARE
// Express identifies this as an error middleware
// because it has 4 parameters: (err, req, res, next)

const errorHandler = (err, req, res, next) => {
  // Log full error server-side for diagnosis.
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`, err);

  // If the error has a statusCode (custom error like ApiError),
  // use it. Otherwise, default to 500 (Internal Server Error)
  const statusCode = err.statusCode || err.status || 500;

  const isProduction = process.env.NODE_ENV === "production";
  const isOperational = statusCode < 500;
  const message =
    isOperational || !isProduction
      ? err.message || "Internal Server Error"
      : "Internal Server Error";

  // Send a clean JSON response to the client
  // Frontend can easily handle this format
  res.status(statusCode).json({
    success: false,
    message,
  });
};

// Export the middleware so it can be used in app.js
module.exports = errorHandler;

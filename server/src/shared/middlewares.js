const { ZodError } = require("zod");

function notFoundHandler(_req, res) {
  res.status(404).json({ message: "Route not found." });
}

function errorHandler(error, _req, res, _next) {
  if (error instanceof ZodError) {
    return res.status(422).json({
      message: "Validation failed",
      issues: error.issues,
    });
  }

  if (error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return res.status(500).json({ message: "Internal server error." });
}

module.exports = { notFoundHandler, errorHandler };

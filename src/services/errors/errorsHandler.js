import CustomeError from "./customeError.js";

export default function errorHandler(err, req, res, next) {
  if (err instanceof CustomeError) {
    req.logger.info("Personalized error: ", err);
    res.status(Number.isInteger(err.code) ? err.code : 500).json({
      error: {
        code: err.code || 500,
        message: err.message || "Error",
        cause: err.cause || null,
      },
    });
  } else {
    req.logger.error("Error captured:", err);
    res.status(500).json({
      error: {
        code: 500,
        message: "Error",
        cause: err,
      },
    });
  }
}

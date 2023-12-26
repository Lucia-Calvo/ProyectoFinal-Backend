import EErrors from "./errorsEnum";

export default (error, req, res, next) => {
  req.logger.debug(`Error cause: ${error.cause}`);
  switch (error.code) {
    case EErrors.ROUTING_ERROR:
      res.render("Not authorized");
      break;
    case EErrors.INVALID_TYPE_ERROR:
      res
        .status(error.status)
        .send({
          status: "Error",
          error: error.name || "Invalid error",
          details: error.message,
          cause: error.cause ? error.cause : "No details",
        });
      break;
    case EErrors.DATABASE_ERROR:
      res
        .status(error.status)
        .send({
          status: "Error",
          error: error.name || "Data base error",
          details: error.message,
          cause: error.cause ? error.cause : "No details",
        });
      break;
    case EErrors.PASSWORD_RESTORATION_ERROR:
      res.render("Error updating required information");
      break;
    case EErrors.AUTHORIZATION_ERROR:
      res.render("No authorization");
      break;
    case EErrors.MISSING_DATA:
      res
        .status(error.status)
        .send({
          status: "Error",
          error: error.name || "Missing data",
          details: error.message,
          cause: error.cause ? error.cause : "No details",
        });
      break;
    case EErrors.RENDERING_ERROR:
      res.render("Error");
      break;
    default:
      req.logger.fatal(error);
      res.status(500).send({ status: "error", error: "Unhandled error" });
  }
};

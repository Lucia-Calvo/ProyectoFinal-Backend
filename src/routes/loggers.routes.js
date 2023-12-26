import { Router } from "express";

const logRouter = new Router();

logRouter.get("/", (req, res) => {
  req.logger.fatal("Error de tipo fatal");
  req.logger.error("Error");
  req.logger.warn("Error de tipo warning");
  req.logger.info(`Info`);
  req.logger.http("Http");
  req.logger.debug("Debug");
  res.send({ message: "Logger test" });
});

export default logRouter;

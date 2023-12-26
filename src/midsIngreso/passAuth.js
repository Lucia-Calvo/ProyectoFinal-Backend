import passport from "passport";

export const passportCall = (strategy) => {
  return async (req, res, next) => {
    req.logger.info("Autenticacion");

    passport.authenticate(strategy, function (error, user, info) {
      console.log("Autenticando");
      if (error) {
        return next(error);
      }
      if (!user) {
        req.logger.warn("Fallo la autenticacion");
        return res
          .status(401)
          .send({ error: info.messages ? info.messages : info.toString() });
      }
      req.user = user;
      req.logger.info("Autenticacion completada");
      next();
    })(req, res, next);
  };
};

export const authorization = (roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      req.logger.warn("Usuario no autenticado");
      return res
        .status(401)
        .send({ status: "error", message: "Sin autorizacion" });
    }
    if (!roles.includes(req.user.role)) {
      req.logger.warn("El usuario no tiene el rol requerido");
      return res
        .status(403)
        .send({ status: "error", message: "Sin permiso" });
    }
    next();
  };
};

import passport from "passport";
import local from "passport-local";
import { createHash, isValidPassword } from "../midsIngreso/bcrypt.js";
import jwt from "passport-jwt";

import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  PREMIUM_EMAIL,
  PREMIUM_PASSWORD,
} from "../config/config.js";

import { userModel } from "../dao/models/user.model.js";

import CartService from "../services/cart.service.js";
import UserService from "../services/user.service.js";

const userService = new UserService();
const cartService = new CartService();
const JWTStrategy = jwt.Strategy;
const ExtractJWT = jwt.ExtractJwt;
const LocalStrategy = local.Strategy;

const initializePassport = () => {
  passport.use(
    "register",
    new LocalStrategy(
      { passReqToCallback: true, usernameField: "email" },
      async (req, username, password, done) => {
        const { first_name, last_name, email, age } = req.body;
        try {
          let user = await userModel.findOne({ email: username });
          if (user) {
            req.logger.warn(
              "Usuario" + email + " ya se encuentra registrado"
            );
            return done(null, false);
          }
          user = {
            first_name,
            last_name,
            email,
            age,
            password: createHash(password),
            rol,
          };
          req.logger.info("Rol:", user.role);
          if (user.email == ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            req.logger.info("Admin rol");
            user.role = "admin";
          } else if (
            user.email == PREMIUM_EMAIL &&
            password === PREMIUM_PASSWORD
          ) {
            req.logger.info("Premium rol");
            user.role = "premium";
          } else {
            req.logger.info("User rol");
            user.role = "user";
          }
          req.logger.info("Nuevo usuario:", user.role);
          let result = await userModel.create(user);
          req.logger.info("Usuario guardado:", result);
          if (result) {
            return done(null, result);
          }
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.use(
    "login",
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (username, password, done) => {
        console.log("Autenticando el usuario:", username);
        try {
          let user = await userModel.findOne({ email: username });
          if (!user) {
            return done(null, false, { message: "Usuario equivocado" });
          }
          if (!isValidPassword(user, password)) {
            return done(null, false, { message: "Contraseña equivocada" });
          }
          if (!user.cart) {
            const cart = await cartService.createCart();
            user.cart = cart._id;
            await userService.updateUser(username, user);
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.use(
    "jwt",
    new JWTStrategy(
      {
        jwtFromRequest: ExtractJWT.fromExtractors([cookieExtractor]),
        secretOrKey: "S3CR3T0NTH3M0UNT41N",
      },
      async (jwt_payload, done) => {
        try {
          const user = await userModel.findOne({ email: jwt_payload.email });
          if (!user) {
            return done(null, false, {
              message: "Usuario no encontrado",
            });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
};

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  let user = await userModel.findById(id);
  done(null, user);
});

export default initializePassport;

const cookieExtractor = (req) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies["coderCookieToken"];
  }
  return token;
};

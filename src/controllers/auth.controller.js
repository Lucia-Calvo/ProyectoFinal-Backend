import AuthenticationService from "../services/auth.service.js";
import { authError } from "../services/errors/errorMessages/user.auth.error.js";
import CustomeError from "../services/errors/customeError.js";
import { createHash, isValidPassword } from "../midsIngreso/bcrypt.js";
import { userModel } from "../dao/models/user.model.js";
import sendResetPasswordEmail from "./resetPassword.controller.js";
import { generateAuthenticationErrorInfo } from "../services/errors/errorMessages/user-auth-error.js";

class AuthController {
  constructor() {
    this.authService = new AuthenticationService();
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const userData = await this.authService.login(email, password);
      req.logger.info("Recuperando la informacion del usuario:", userData);
      userData.user.last_connection = new Date();
      console.log("La ultima conexion fue en: ", userData.user.last_connection);
      await userData.user.save();
      if (!userData || !userData.user) {
        req.logger.error("Credenciales invalidas");
        const customeError = new CustomeError({
          name: "Auth Error",
          message: "Credenciales invalidas",
          code: 401,
          cause: generateAuthenticationErrorInfo(email),
        });
        return next(customeError);
      }
      if (userData && userData.user) {
        req.session.user = {
          id: userData.user.id || userData.user._id,
          email: userData.user.email,
          first_name: userData.user.first_name,
          last_name: userData.user.last_name,
          age: userData.user.age,
          role: userData.user.role,
          cart: userData.user.cart,
        };
      }
      req.logger.info("User data object:", userData.user);
      res.cookie("coderCookieToken", userData.token, {
        httpOnly: true,
        secure: false,
      });
      return res.status(200).json({
        status: "success",
        user: userData.user,
        redirect: "/products",
      });
    } catch (error) {
      req.logger.error("Error: ", error);
      return error;
    }
  }

  async githubCallback(req, res) {
    try {
      if (req.user) {
        req.session.user = req.user;
        req.session.loggedIn = true;
        return res.redirect("/products");
      } else {
        return res.redirect("/login");
      }
    } catch (error) {
      req.logger.error("Error", error);
      return res.redirect("/login");
    }
  }

  logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        return res.redirect("/profile");
      }
      return res.redirect("/login");
    });
  }

  async restorePassword(req, res) {
    const { email } = req.body;
    try {
      await sendResetPasswordEmail(email);
      res.send(
        "Revise su correo para restaurar la contraseña"
      );
    } catch (error) {
      console.error("Error en sendResetPasswordEmail:", error);
      res
        .status(500)
        .send(
          "Error restaurando la contraseña" +
            error.message
        );
    }
  }

  async resetPassword(req, res) {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
      return res.status(400).send("Las contraseñas deben coincidir");
    }
    try {
      const user = await userModel.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });
      if (!user) {
        return res.status(400).json({
          message:
            "El token para resetear la contraseña ya expiro o es invalido",
          tokenExpired: true,
        });
      }
      const isSamePassword = isValidPassword(user, password);
      if (isSamePassword) {
        return res
          .status(400)
          .send(
            "Debe crear una contraseña nueva"
          );
      }
      user.password = createHash(password);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      res.send("Su contraseña ha sido actualizada");
    } catch (error) {
      console.error("Error reseteando la contraseña", error);
      res
        .status(500)
        .send(
          "Hubo un error del servidor mientras se reseteaba la contraseña"
        );
    }
  }
}

export default AuthController;

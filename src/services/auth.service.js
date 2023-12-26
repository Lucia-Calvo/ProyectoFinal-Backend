import UserManager from "../dao/userManager.js";
import jwt from "jsonwebtoken";
import { userModel } from "../dao/models/user.model.js";
import { JWT_KEY } from "../config/config.js";

class AuthService {
  constructor() {
    this.userManager = new UserManager();
    this.secretKey = JWT_KEY;
  }
  async login(email, password) {
    const user = await this.userManager.login(email, password);
    if (!user) {
      return null;
    }
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      this.secretKey,
      { expiresIn: "24h" }
    );
    return { user, token };
  }

  async githubCallback(profile) {
    try {
      if (!profile || !profile._json) {
        throw new Error("La informacion del perfil esta incompleta.");
      }
      if (!profile._json.email) {
        console.warn("Email vacio.");
        profile._json.email = "no-email@example.com";
      }
      let user = await userModel.findOne({ email: profile._json.email });
      if (!user) {
        user = await userModel.create({
          first_name: profile._json.name || "Unknown",
          last_name: "",
          email: profile._json.email,
          age: 100,
          password: "",
          role: "user",
        });
      }
      return user;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }
}

export default AuthService;

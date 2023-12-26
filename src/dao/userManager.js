import { userModel } from "./models/user.model.js";
import { createHash, isValidPassword } from "../midsIngreso/bcrypt.js";
import GetUserDTO from "./dtos/getUser.dto.js";
import mongoose from "mongoose";

class UserManager {

  async addUser({
    first_name,
    last_name,
    email,
    age,
    password,
    role,
    cart,
    last_connection,
  }) {
    try {
      const existingUser = await userModel.findOne({ email });
      if (existingUser) {
        console.log("Usuario ya existe");
        return null;
      }
      const hashedPassword = createHash(password);
      const user = await userModel.create({
        _id: new mongoose.Types.ObjectId(),
        first_name,
        last_name,
        email,
        age,
        password: hashedPassword,
        role,
        cart,
        last_connection: new Date(),
      });
      console.log("Usuario agregado!", user);
      return user;
    } catch (error) {
      console.error("Error agregando el usuario:", error);
      throw error;
    }
  }

  async login(user, pass) {
    try {
      const userLogged = await userModel.findOne({ email: user });
      if (userLogged && isValidPassword(userLogged, pass)) {
        const role =
          userLogged.email === "adminCoder@coder.com" ? "admin" : "usuario";
        return userLogged;
      }
      return null;
    } catch (error) {
      console.error("Login error", error);
      throw error;
    }
  }

  async restorePassword(email, hashedPassword) {
    try {
      const user = await userModel.findOne({ email });
      if (!user) {
        console.log("Usuario no encontrado");
        return false;
      }
      user.password = hashedPassword;
      await user.save();
      console.log("Contrasena restaurada.");
      return true;
    } catch (error) {
      console.error("Error restaurando contrasena:", error);
      return false;
    }
  }

  async getUsers() {
    return await userModel.find().lean();
  }

  async findUser(user) {
    try {
      const buscadito = await userModel.findOne({ email: user });
      if (buscadito) {
        const role =
          buscadito.email === "adminCoder@coder.com" ? "admin" : "usuario";
        return buscadito;
      }
      return null;
    } catch (error) {
      console.error("Error de busqueda:", error);
      throw error;
    }
  }

  async deleteUser(uid) {
    try {
      const user = await userModel.findOne({ email: uid }).lean();
      console.log(email);
      console.log("UID");
      console.log(uid);
      console.log("user");
      console.log(user);
      await userModel.deleteOne({ email: uid });
      const userDTO = new GetUserDTO(user);
      return userDTO;
    } catch (error) {
      log.logger.console.warn();
      `Error eliminando el usuario: ${error}`;
    }
  }

  async searchLastConnection(days) {
    try {
      const usersLastConnection = await userModel.findOne({
        last_connection: {
          $lt: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
      });
      await userModel.deleteMany({
        last_connection: {
          $lt: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
      });
      const inactiveUsersDTO = usersLastConnection.map(
        (user) => new GetUserDTO(user)
      );
      return inactiveUsersDTO;
    } catch (error) {
      console.error("Error buscando la ultima conexion del usuario:", error);
      return false;
    }
  }

  async updateUser(userId, userToReplace) {
    const filter = { email: userId };
    const update = { $set: userToReplace };
    const result = await userModel.updateOne(filter, update);
    return result;
  }

  async getUserById(id) {
    try {
      return await userModel.findById(id).lean();
    } catch (error) {
      console.error("Error buscando el producto por id:", error);
      return null;
    }
  }

  async findOne(email) {
    const result = await userModel.findOne({ email }).lean();
    return result;
  }
}
export default UserManager;

//-------------------------------------------------\\
import UserService from "../services/user.service.js";
import UserResponse from "../dao/dtos/user.response.js";
import { generateUserError } from "../services/errors/errorMessages/user.creation.error.js";
import EErrors from "../services/errors/errorsEnum.js";
import CustomeError from "../services/errors/customeError.js";
import { createHash } from "../midsIngreso/bcrypt.js";
import { userModel } from "../dao/models/user.model.js";
import UserManager from "../dao/userManager.js";
import { ADMIN_EMAIL } from "../config/config.js";
import { transporter } from "./messages.controller.js";

class UserController {
  constructor() {
    this.userService = new UserService();
    this.userManager = new UserManager();
  }

  async register(req, res, next) {
    try {
      const { first_name, last_name, email, age, password, role } = req.body;
      if (!first_name || !email || !age || !password) {
        const customeError = new CustomeError({
          name: "Error creando el usuario",
          cause: generateUserError({
            first_name,
            last_name,
            age,
            email,
            password,
            role,
          }),
          message: "Error registrando el usuario",
          code: 400,
        });
        throw customeError;
      }
      const response = await this.userService.registerUser({
        first_name,
        last_name,
        email,
        age,
        password,
        role,
      });
      return res.status(200).json({
        status: response.status,
        data: response.user,
        redirect: response.redirect,
      });
    } catch (error) {
      if (error instanceof CustomeError) {
        return res.status(error.code).json({
          status: "error",
          message: error.message,
        });
      } else {
        console.log(error);
        return res.status(500).json({
          status: "error",
          message: "Error",
        });
      }
    }
  }

  async restorePassword(req, res, next) {
    try {
      const { user, pass } = req.query;
      const passwordRestored = await this.userService.restorePassword(
        user,
        createHash(pass)
      );
      if (passwordRestored) {
        return res.send({ status: "OK", message: "Contraseña actualizada" });
      } else {
        const customeError = new CustomeError({
          name: "Error restore",
          massage: "Error restaurando la contraseña",
          code: EErrors.PASSWORD_RESTORATION_ERROR,
        });
        return next(customeError);
      }
    } catch (error) {
      req.logger.error(error);
      return next(error);
    }
  }

  currentUser(req, res, next) {
    if (req.session.user) {
      return res.send({
        status: "OK",
        payload: new UserResponse(req.session.user),
      });
    } else {
      const customeError = new CustomeError({
        name: "Auth Error",
        massage: "Error de autenticacion",
        code: EErrors.AUTHORIZATION_ERROR,
      });
      return next(customeError);
    }
  }

  async uploadFiles(req, res) {
    try {
      const userId = req.params.uid;
      const files = req.files;
      const userUpdate = {};
      if (files.profiles) {
        userUpdate.profileImage = files.profiles[0].path;
      }
      if (files.products) {
        userUpdate.productImage = files.products[0].path;
      }
      if (files.document) {
        userUpdate.documents = files.document.map((doc) => ({
          name: doc.originalname,
          reference: doc.path,
          status: "Uploaded",
        }));
      }
      await userModel.findByIdAndUpdate(userId, userUpdate);
      res.status(200).send("Subido con exito");
    } catch (error) {
      res.status(500).send(error.message);
    }
  }

  async updateUserDocuments(req, res) {
    try {
      const userId = req.params.uid;
      const file = req.file;
      if (!file) {
        return res.status(400).send("Nada para subir");
      }
      const document = {
        name: file.originalname,
        string: file.path,
      };
      await userModel.findByIdAndUpdate(userId, {
        $push: { documents: document },
        $set: { last_connection: new Date() },
      });
      res.status(200).send("Documentos subidos");
    } catch (error) {
      res.status(500).send(error.message);
    }
  }

  async upgradeToPremium(req, res) {
    try {
      const userId = req.params.uid;
      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).send("Usuario no encontrado");
      }
      const requieredDocs = [
        "identificationDocument",
        "domicileProofDocument",
        "accountStatementDocument",
      ];
      const hasAllDocuments = requieredDocs.every((docName) =>
        user.documents.some(
          (doc) => doc.name === docName && doc.status === "Uploaded"
        )
      );
      if (hasAllDocuments) {
        user.isPremium = true;
        user.role = "premium";
        await user.save();
        res.status(200).send("Actualizado a premium");
      } else {
        res.status(400).send("Los documentos requeridos estan incompletos");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Error");
    }
  }

  async upgradeUserToPremium(req, res) {
    try {
      const userId = req.params.uid;
      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).send("Usuario no encontrado");
      }
      const requieredDocs = [
        "identificationDocument",
        "domicileProofDocument",
        "accountStatementDocument",
      ];
      const hasAllDocuments = requieredDocs.every((docName) =>
        user.documents.some(
          (doc) => doc.name === docName && doc.status === "Uploaded"
        )
      );
      if (hasAllDocuments) {
        user.isPremium = true;
        user.role = "premium";
        await user.save();
        res.status(200).send("Actualizado a premium");
      } else {
        res.status(400).send("Los documentos requeridos estan incompletos");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Error");
    }
  }

  async uploadPremiumDocuments(req, res) {
    try {
      const userId = req.params.uid;
      const files = req.files;
      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).send("Usuario no encontrado");
      }
      const updateOrAddDocs = (docName, file) => {
        const existingDocIndex = user.documents.findIndex(
          (doc) => doc.name === docName
        );
        const documentData = {
          name: docName,
          reference: file.path,
          status: "Uploaded",
        };
        if (existingDocIndex >= 0) {
          user.documents[existingDocIndex] = documentData;
        } else {
          user.documents.push(documentData);
        }
      };
      if (files.identificationDocument) {
        updateOrAddDocs(
          "identificationDocument",
          files.identificationDocument[0]
        );
      }
      if (files.domicileProofDocument) {
        updateOrAddDocs(
          "domicileProofDocument",
          files.domicileProofDocument[0]
        );
      }
      if (files.accountStatementDocument) {
        updateOrAddDocs(
          "accountStatementDocument",
          files.accountStatementDocument[0]
        );
      }
      await user.save();
      res.status(200).send("Documentacion premium actualizada");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error");
    }
  }

  async getUsers(req, res) {
    try {
      const users = await this.userService.getAll();
      res.send({ status: "success", data: users });
    } catch (error) {
      res.status(500).send({ status: "error", message: "Error buscando los usuarios" });
    }
  }

  async findOne(email) {
    const result = await userModel.findOne({ email }).lean();
    return result;
  }

  async updateUser(userId, userToReplace) {
    const filter = { email: userId };
    const update = { $set: userToReplace };
    const result = await userModel.updateOne(filter, update);
    return result;
  }

  async updateUserPremium(req, res) {
    try {
      const uid = req.params.uid;
      const premiumData = req.body;
      const user = await userModel.findOne({ email: uid });
      if (!user) {
        return res.status(404).send("Usuario no encontrado");
      }
      const requieredDocs = [
        "identificationDocument",
        "domicileProofDocument",
        "accountStatementDocument",
      ];
      const hasAllDocuments = requieredDocs.every((docName) =>
        user.documents.some(
          (doc) => doc.name === docName && doc.status === "Uploaded"
        )
      );
      if (hasAllDocuments) {
        user.isPremium = true;
        user.role = "premium";
        await userModel.updateOne({ email: uid }, premiumData);
        await user.save();
        res.status(200).send("Actualizado a premium");
      } else {
        res.status(400).send("Documentos requeridos estan incompletos");
      }
    } catch (error) {
      console.log(error);
    }
  }

  async swapUserRole(req, res, next) {
    try {
      const email = req.params.uid;
      let user = await userModel.findOne({ email }).lean();
      res.send({ status: "success", data: user });
      const requieredDocs = [
        "identificationDocument",
        "domicileProofDocument",
        "accountStatementDocument",
      ];
      const hasAllDocuments = requieredDocs.every((docName) =>
        user.documents.some(
          (doc) => doc.name === docName && doc.status === "Uploaded"
        )
      );
      if (hasAllDocuments) {
        user.isPremium = true;
        user.role = "premium";
        const changedRole = await userModel.findOneAndUpdate(email, user);
        return changedRole;
      } else {
        res.status(400).send("Los documentos requeridos estan incompletos");
      }
    } catch (error) {
      next(error);
    }
  }

  async getUserManagment(req, res) {
    let admin,
      premium,
      users = null;
    let user = await this.userService.findOne(req.user.email);
    admin = user.role === "admin" ? true : false;
    premium = user.role === "premium" ? true : false;
    users = await this.userService.getAll();
    res.render("userAdministration", {
      users,
      user,
      admin,
      premium,
      active: { userM: true },
    });
  }

  async deleteUser(req, res) {
    try {
      let { uid } = req.params;
      const user = await userModel.findOneAndDelete({ email: uid });
      console.log("UID");
      console.log(uid);
      console.log("user");
      console.log(user);
      res.send({ status: "success", data: user });
    } catch (err) {
      res
        .status(500)
        .send({ status: "error", message: "Error eliminado el usuario" });
    }
  }

  async deleteInactiveUsers(req, res) {
    try {
      const readyToGo = new Date(new Date().setDate(new Date().getDate() - 2));
      const currentTime = new Date();
      const usuariosInactivos = await userModel.find({
        last_connection: { $lt: readyToGo },
      });
      const inactiveUsers = usuariosInactivos.filter((user) => {
        if (parseInt(Date.now()) > user.last_connection) {
          if (user.email !== ADMIN_EMAIL) {
            return true;
          }
        }
      });
      for (const user of inactiveUsers) {
        const email = user.email;
        const result = transporter.sendMail({
          from: ADMIN_EMAIL,
          to: email,
          subject: "Cuenta eliminada por inactividad",
          html: `
            <div>
              <p>Su cuenta ha sido eliminada por inactividad</p>
            </div>
          `,
        });
        if (result.status === "rejected") {
          logger.error(`Email: ${email} rejected`);
        }
      }
      const inactiveUsersEmails = inactiveUsers.map((user) => user.email);
      await userModel.deleteMany({ email: { $in: inactiveUsersEmails } });
      return inactiveUsers;
    } catch (error) {
      res
        .status(500)
        .send({
          status: "error",
          message:
            "Error eliminando usuarios inactivos",
        });
    }
  }
}

export default UserController;

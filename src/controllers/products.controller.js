import ProductsServices from "../services/products.service.js";
import { socketServer } from "../../app.js";
import mongoose from "mongoose";
import CustomeError from "../services/errors/customeError.js";
import { productError } from "../services/errors/errorMessages/product.error.js";
import { transporter } from "./messages.controller.js";
import { userModel } from "../dao/models/user.model.js";

class ProductController {
  constructor() {
    this.productService = new ProductsServices();
  }

  async getProducts(req, res) {
    try {
      const products = await this.productService.getProducts(req.query);
      res.send(products);
    } catch (error) {
      const productErr = new CustomeError({
        name: "Error buscando los productos",
        message: "Error buscando los productos",
        code: 500,
        cause: error.message,
      });
      req.logger.error(productErr);
      res
        .status(productErr.code)
        .send({ status: "error", message: "Error buscando los productos" });
    }
  }

  async getProductById(req, res, next) {
    try {
      const pid = req.params.pid;
      req.logger.info("ID del producto:", pid);
      if (!mongoose.Types.ObjectId.isValid(pid)) {
        throw new CustomeError({
          name: "ID invalido",
          message: "ID invalido",
          code: 400,
          cause: productError(pid),
        });
      }
      const product = await this.productService.getProductById(pid);
      if (!product) {
        throw new CustomeError({
          name: "Producto no fue encontrado",
          message: "Producto no fue encontrado",
          code: 404,
        });
      }
      res.status(200).json({ status: "success", data: product });
      return;
    } catch (error) {
      next(error);
    }
  }

  async addProduct(req, res) {
    let {
      title,
      description,
      code,
      price,
      status,
      stock,
      category,
      thumbnail,
    } = req.body;
    const owner = req.user._id;
    if (!title) {
      res.status(400).send({
        status: "error",
        message: "Error, falta Title!",
      });
      return false;
    }
    if (!description) {
      res.status(400).send({
        status: "error",
        message: "Error, falta Description!",
      });
      return false;
    }
    if (!code) {
      res.status(400).send({
        status: "error",
        message: "Error, falta Code!!",
      });
      return false;
    }
    if (!price) {
      res.status(400).send({
        status: "error",
        message: "Error, falta Price!!",
      });
      return false;
    }
    status = !status && true;
    if (!stock) {
      res.status(400).send({
        status: "error",
        message: "Error, falta Stock!!",
      });
      return false;
    }
    if (!category) {
      res.status(400).send({
        status: "error",
        message: "Error, falta Category!!",
      });
      return false;
    }
    if (!thumbnail) {
      res.status(400).send({
        status: "error",
        message: "Error, falta Thumbnail!!",
      });
      return false;
    }
    try {
      const wasAdded = await this.productService.addProduct({
        title,
        description,
        code,
        price,
        status,
        stock,
        category,
        thumbnail,
        owner,
      });
      if (wasAdded && wasAdded._id) {
        req.logger.info("Producto agregado:", wasAdded);
        res.send({
          status: "ok",
          message: "Producto agregado",
          productId: wasAdded._id,
        });
        socketServer.emit("product_created", {
          _id: wasAdded._id,
          title,
          description,
          code,
          price,
          status,
          stock,
          category,
          thumbnail,
          owner,
        });
        return;
      } else {
        req.logger.error("Error agregando el producto, wasAdded:", wasAdded);
        res.status(500).send({
          status: "error",
          message: "Error agregando el producto!",
        });
        return;
      }
    } catch (error) {
      req.logger.error("Error addProduct:", error, "Stack:", error.stack);
      res
        .status(500)
        .send({ status: "error", message: "Error del servidor." });
      return;
    }
  }

  async updateProduct(req, res) {
    try {
      const {
        title,
        description,
        code,
        price,
        status,
        stock,
        category,
        thumbnail,
      } = req.body;
      const pid = req.params.pid;
      const wasUpdated = await this.productService.updateProduct(pid, {
        title,
        description,
        code,
        price,
        status,
        stock,
        category,
        thumbnail,
      });
      if (wasUpdated) {
        res.send({
          status: "ok",
          message: "Producto agregado",
        });
        socketServer.emit("product_updated");
      } else {
        res.status(500).send({
          status: "error",
          message: "Error actualizando el producto",
        });
      }
    } catch (error) {
      req.logger.error(error);
      res.status(500).send({ status: "error", message: "Error del servidor." });
    }
  }

  async deleteProduct(req, res) {
    try {
      const pid = req.params.pid;
      if (!mongoose.Types.ObjectId.isValid(pid)) {
        req.logger.error("ID no valido");
        res.status(400).send({
          status: "error",
          message: "ID no valido",
        });
        return;
      }
      const product = await this.productService.getProductById(pid);
      if (!product) {
        console.log("Producto no encontrado");
        res.status(404).send({
          status: "error",
          message: "Producto no encontrado",
        });
        return;
      }
      if (
        !req.user ||
        (req.user.role !== "admin" &&
          (!product.owner ||
            req.user._id.toString() !== product.owner.toString()))
      ) {
        req.logger.error(
          "User sin derecho a borrar el producto o este no tiene dueño"
        );
        res.status(403).send({
          status: "error",
          message:
            "User sin derecho a borrar el producto o este no tiene dueño",
        });
        return;
      }
      const wasDeleted = await this.productService.deleteProduct(pid);
      if (wasDeleted) {
        console.log("Producto eliminado");
        res.send({
          status: "ok",
          message: "Producto eliminado",
        });
        socketServer.emit("product_deleted", { _id: pid });
      } else {
        console.log("Error eliminando el producto");
        res.status(500).send({
          status: "error",
          message: "Error eliminando el producto",
        });
      }
    } catch (error) {
      req.logger.error("Error en deleteProduct:", error);
      res
        .status(500)
        .send({ status: "error", message: "Error de servidor" });
    }
  }
}
export default new ProductController();

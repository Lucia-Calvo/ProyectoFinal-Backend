import { cartModel } from "./models/cart.model.js";
import mongoose from "mongoose";
import ProductManager from "./ProductManager.js";

class CartManager {
  constructor() {
    this.productManager = new ProductManager();
  }

  async newCart() {
    let cart = await cartModel.create({ products: [] });
    console.log("Carrito creado:", cart);
    return {
      status: "ok",
      message: "Carrito creado",
      id: cart._id,
    };
  }

  async getCart(id) {
    console.log('Buscando carrito:', id);  
    if (this.validateId(id)) {
      const cart = await cartModel.findOne({ _id: id }).lean();
      console.log("Carrito: ", cart);
      return cart || null;
    } else {
      console.log("Carrito no encontrado!");
      return null;
    }
  }

  async getCarts() {
    return await cartModel.find().lean();
  }

  async addProductToCart(cid, pid, quantity) {
    try {
      console.log(`Agregando ${pid} al carrito ${cid}`);
      if (
        mongoose.Types.ObjectId.isValid(cid) &&
        mongoose.Types.ObjectId.isValid(pid)
      ) {
        const product = await this.productManager.getProductById(pid);
        console.log("Stock antes de agregar al carrito", product.stock);
        if (!product) {
          console.log("Producto no encontrado");
          return {
            status: "error",
            message: "Producto no encontrado",
          };
        }
        if (product.stock < quantity) { 
          return { status: "error", message: "Stock insuficiente" };
      }
        const updateResult = await cartModel.updateOne(
          { _id: cid, "products.product": pid },
          { $inc: { "products.$.quantity": 1 } }
        );
        console.log("Resultado de actualizacion:", updateResult);
        if (updateResult.matchedCount === 0) {
          const pushResult = await cartModel.updateOne(
            { _id: cid },
            { $push: { products: { product: pid, quantity: 1 } } }
          );
          console.log("Resultado:", pushResult);
        }
        return {
          status: "ok",
          message: "Producto agregado",
        };
      } else {
        return {
          status: "error",
          message: "Id invalido",
        };
      }
    } catch (error) {
      console.error(error);
      return {
        status: "error",
        message: "Error agregando el producto al carrito",
      };
    }
  }

  async updateQuantityProductFromCart(cid, pid, quantity) {
    try {
      if (this.validateId(cid)) {
        const cart = await this.getCart(cid);
        if (!cart) {
          console.log("Carrito no encontrado!");
          return false;
        }
        console.log("PID:", pid);
        console.log(
          "Productos del carrito:",
          cart.products.map((item) =>
            item.product._id
              ? item.product._id.toString()
              : item.product.toString()
          )
        );
        const product = cart.products.find(
          (item) =>
            (item.product._id
              ? item.product._id.toString()
              : item.product.toString()) === pid.toString()
        );
        if (product) {
          product.quantity = quantity;
          await cartModel.updateOne({ _id: cid }, { products: cart.products });
          console.log("Producto actualizado!");
          return true;
        } else {
          console.log("Producto no encontrado");
          return false;
        }
      } else {
        console.log("Id del carrito invalido!");
        return false;
      }
    } catch (error) {
      console.error("Error mientras se actualizaba el carrito:", error);
      return false;
    }
  }

  async updateProducts(cid, products) {
    try {
      await cartModel.updateOne(
        { _id: cid },
        { products: products },
        { new: true, upsert: true }
      );
      console.log("Producto actualizado!");
      return true;
    } catch (error) {
      console.log("Producto no encontrado!");
      return false;
    }
  }

  async deleteProductFromCart(cid, pid) {
    try {
      if (mongoose.Types.ObjectId.isValid(cid)) {
        const updateResult = await cartModel.updateOne(
          { _id: cid },
          { $pull: { products: { product: pid } } }
        );
        if (updateResult.matchedCount > 0) {
          console.log("Producto eliminado!");
          return true;
        }
      } else {
        console.log("ID del carrito invalido");
        return false;
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async deleteProductsFromCart(cid) {
    try {
      if (this.validateId(cid)) {
        const cart = await this.getCart(cid);
        await cartModel.updateOne({ _id: cid }, { products: [] });
        console.log("Productos eliminados!");
        return true;
      } else {
        console.log("No se encontro!");
        return false;
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  validateId(id) {
    return mongoose.Types.ObjectId.isValid(id);
  }
}

export default CartManager;

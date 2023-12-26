import CartManager from "../dao/cartManager.js";

class CartService {
  constructor() {
    this.cartManager = new CartManager();
  }

  async createCart() {
    return await this.cartManager.newCart();
  }

  async getCart(id) {
    return await this.cartManager.getCart(id);
  }

  async addProductToCart(cid, pid) {
    const result = await this.cartManager.addProductToCart(cid, pid);
    if (result) {
      return { status: "ok", message: "Producto agregado" };
    } else {
      throw new Error("Error agregando el producto al carrito");
    }
  }

  async updateQuantityProductFromCart(cartId, productId, quantity) {
    const result = await this.cartManager.updateQuantityProductFromCart(
      cartId,
      productId,
      quantity
    );
    if (result) {
      return {
        status: "ok",
        message: "Producto actualizado",
      };
    } else {
      throw new Error("Error actualizando el producto del carrito");
    }
  }

  async deleteProductFromCart(cartId, productId) {
    const result = await this.cartManager.deleteProductFromCart(
      cartId,
      productId
    );
    if (result) {
      return { status: "ok", message: "Producto eliminado" };
    } else {
      throw new Error("Error eliminando el producto del carrito");
    }
  }

  async deleteCart(cartId) {
    const result = await this.cartManager.deleteProductFromCart(cid, pid);
    if (result) {
      res.send({
        status: "ok",
        message: "Producto eliminado",
      });
    } else {
      res.status(400).send({
        status: "error",
        message: "Error eliminando el producto del carrito",
      });
    }
    return await this.cartManager.deleteProductFromCart(cid, pid);
  }

  async updateCart(cartId, products) {
    const result = await this.cartManager.updateProducts(cartId, products);
    if (result) {
      return { status: "ok", message: "Carrito actualizado" };
    } else {
      throw new Error("Error actualizando el carrito");
    }
  }

  async deleteProductsFromCart(cartId) {
    const result = await this.cartManager.deleteProductsFromCart(cartId);
    if (result) {
      return { status: "ok", message: "Carrito vaciado" };
    } else {
      throw new Error("Error vaciando el carrito");
    }
  }
}

export default CartService;

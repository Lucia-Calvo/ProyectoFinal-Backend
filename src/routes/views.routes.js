import express from "express";
import ProductManager from "../dao/ProductManager.js";
import CartManager from "../dao/cartManager.js";
import cartController from "../controllers/cart.controller.js";
import { userModel } from "../dao/models/user.model.js";
import { passportCall, authorization } from "../midsIngreso/passAuth.js";
import UserController from "../controllers/user.controller.js";
import TicketController from "../controllers/ticket.controller.js";

const checkSession = (req, res, next) => {
  req.logger.info("Checkeando la session:", req.session);
  if (req.session && req.session.user) {
    req.logger.info("La session existe:", req.session.user);
    next();
  } else {
    req.logger.warn("No se encontro una session /login");
    res.redirect("/login");
  }
};
const checkAlreadyLoggedIn = (req, res, next) => {
  if (req.session && req.session.user) {
    req.logger.info("Usuario autenticado");
    res.redirect("/profile");
  } else {
    req.logger.error("Usuario sin autenticar");
    next();
  }
};

const viewsRouter = express.Router();
const PM = new ProductManager();
const CM = new CartManager();
const userController = new UserController();
const ticketController = new TicketController();

async function loadUserCart(req, res, next) {
  if (req.session && req.session.user) {
    const cartId = req.session.user.cart;
    req.logger.info("Cart ID:", cartId);
    const cartManager = new CartManager();
    const cart = await cartManager.getCart(cartId);
    req.logger.info("Cart:", cart);
    req.cart = cart;
  }
  next();
}

viewsRouter.get("/", checkSession, async (req, res) => {
  const products = await PM.getProducts(req.query);
  res.render("home", { products });
});

viewsRouter.get("/products", checkSession, async (req, res) => {
  const products = await PM.getProducts(req.query);
  const user = req.session.user;

  req.logger.info(user);
  res.render("products", { products, user });
});

viewsRouter.get("/products/:pid", async (req, res) => {
  const pid = req.params.pid;
  const product = await PM.getProductById(pid);
  if (product) {
    res.render("productDetail", { product });
  } else {
    res.status(404).send({ status: "error", message: "No se encontro el producto." });
  }
});

viewsRouter.get("/carts", loadUserCart, async (req, res) => {
  const cart = req.cart;
  if (cart) {
    req.logger.info(JSON.stringify(cart, null, 4));
    res.render("cart", { products: cart.products });
  } else {
    res.status(400).send({
      status: "error",
      message: "Error, sin cart ID",
    });
  }
});

viewsRouter.post("/carts/:cid/purchase", async (req, res) => {
  const cid = req.params.cid;
  cartController.getPurchase(req, res, cid);
});

viewsRouter.get("/tickets/:code", async (req, res) => {
  const code = req.params.code;
  cartController.getPurchase(req, res, code);
});

viewsRouter.get("/realtimeproducts", (req, res) => {
  res.render("realTimeProducts");
});

viewsRouter.get("/chat", (req, res) => {
  res.render("chat");
});

viewsRouter.get("/login", checkAlreadyLoggedIn, (req, res) => {
  res.render("login");
});

viewsRouter.get("/register", checkAlreadyLoggedIn, (req, res) => {
  res.render("register");
});

viewsRouter.get("/profile", checkSession, (req, res) => {
  console.log("Inside /profile route");

  const userData = req.session.user;
  req.logger.info("User data:", userData);
  res.render("profile", { user: userData, userId: userData.id });
});

viewsRouter.get("/restore", async (req, res) => {
  res.render("restore");
});

viewsRouter.get("/upload/:uid", (req, res) => {
  const userId = req.params.uid;
  console.log("ID de usuario: ", userId);
  res.render("uploads", { userId });
});

viewsRouter.get("/premium/:uid", (req, res) => {
  const userId = req.params.uid;
  console.log("ID de usuario: ", userId);
  res.render("premium", { userId });
});

viewsRouter.get("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const user = await userModel.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.redirect("/restore");
  }
  res.render("reset-password", { token });
});

viewsRouter.get("/faillogin", (req, res) => {
  res.status(401).json({
    status: "error",
    message: "El login fallo por username o password incorrecto.",
  });
});

viewsRouter.get("/failregister", async (req, res) => {
  res.send({
    status: "Error",
    message: "Error, no se pudo registrar el usuario",
  });
});

viewsRouter.get(
  "/usermanagment",
  passportCall("jwt"),
  authorization(["admin"]),
  userController.getUserManagment.bind(userController)
);

viewsRouter.get(
  "/tickets/:code",
  passportCall("jwt"),
  ticketController.getTicketDetail.bind(ticketController)
);
viewsRouter.get(
  "/tickets/:code",
  passportCall("jwt"),
  ticketController.getTicketDetail.bind(ticketController)
);
export default viewsRouter;

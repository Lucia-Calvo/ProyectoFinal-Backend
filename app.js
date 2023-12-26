import express from "express";
import Handlebars from "handlebars";
import expressHandlebars from "express-handlebars";
import __dirname from "./utils.js";
import { Server } from "socket.io";
import { allowInsecurePrototypeAccess } from "@handlebars/allow-prototype-access";
import session from "express-session";
import MongoStore from "connect-mongo";
import morgan from "morgan";
import passport from "passport";
import cookieParser from "cookie-parser";
import cors from "cors";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUIExpress from "swagger-ui-express";
import initializePassport from "./src/midsIngreso/passport.js";
import initializeGitHubPassport from "./src/midsIngreso/github.js";
import { MONGODB_CNX_STR, PORT, SECRET_SESSIONS } from "./src/config/config.js";
import "./src/dao/dbConfig.js";
import { addLogger, devLogger } from "./src/config/logger.js";
import cartsRouter from "./src/routes/carts.routes.js";
import productsRouter from "./src/routes/products.routes.js";
import serviceRouter from "./src/routes/sessions.routes.js";
import viewsRouter from "./src/routes/views.routes.js";
import emailRouter from "./src/routes/email.routes.js";
import mockingRouter from "./src/moking/mock.router.js";
import logRouter from "./src/routes/loggers.routes.js";
import userRouter from "./src/routes/users.routes.js";

const app = express();

const swaggerOptions = {
  definition: {
    openapi: "3.0.1",
    info: {
      title: "Documentacion de Swagger",
      description: "Swagger apidocs",
    },
  },
  apis: [`./src/docs/**/*.yaml`],
};

const specs = swaggerJSDoc(swaggerOptions);

const httpServer = app.listen(PORT, () => {
  devLogger.info(`conectado a ${PORT}`);
});
export const socketServer = new Server(httpServer);

app.set("socketServer", socketServer);

app.engine(
  "handlebars",
  expressHandlebars.engine({
    handlebars: allowInsecurePrototypeAccess(Handlebars),
  })
);
app.set("views", __dirname + "/views");
app.set("view engine", "handlebars");
app.use(express.static(__dirname));
app.use(
  cors({
    credentials: true,
    method: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use(cookieParser());
app.use("/apidocs", swaggerUIExpress.serve, swaggerUIExpress.setup(specs));
app.use(
  session({
    store: new MongoStore({
      mongoUrl: MONGODB_CNX_STR,
      collectionName: "sessions",
    }),
    secret: SECRET_SESSIONS,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

initializeGitHubPassport();
initializePassport();
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + "/src/public"));
app.use("/images", express.static(__dirname + "/src/public/images"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(addLogger);
app.use(morgan("dev"));
app.use("/api/products/", productsRouter);
app.use("/api/carts/", cartsRouter);
app.use("/api/sessions/", serviceRouter);
app.use("/api/email", emailRouter);
app.use("/api/users", userRouter);
app.use("/mockingproducts", mockingRouter);
app.use("/", viewsRouter);
app.use("/loggerTest", logRouter);

import ProductManager from "./src/dao/ProductManager.js";
const PM = new ProductManager();
import MessagesManager from "./src/dao/messagesmanager.js";
const MM = new MessagesManager();
import CartManager from "./src/dao/cartManager.js";
const CM = new CartManager();

socketServer.on("conexion", async (socket) => {
  console.log("Cliente conectado");
  const allProducts = await PM.getProducts();
  socket.emit("initial_products", allProducts.payload);
  socket.on("addProduct", async (obj) => {
    await PM.addProduct(obj);
    const listadeproductos = await PM.getProductsViews();
    socketServer.emit("envioDeProductos", listadeproductos);
  });
  socket.on("deleteProduct", async (id) => {
    console.log(id);
    const listadeproductos = await PM.getProductsViews();
    await PM.deleteProduct(id);
    socketServer.emit("envioDeProducts", listadeproductos);
  });
  socket.on("eliminarProducto", (data) => {
    PM.deleteProduct(parseInt(data));
    const listadeproductos = PM.getProducts();
    socketServer.emit("envioDeProducts", listadeproductos);
  });
  socket.on("nuevoUsuario", (usuario) => {
    console.log("usuario", usuario);
    socket.broadcast.emit("broadcast", usuario);
  });
  socket.on("disconnect", () => {
    console.log("Usuario desconectado");
  });
  socket.on("mensaje", async (info) => {
    console.log(info);
    await MM.createMessage(info);
    socketServer.emit("chat", await MM.getMessages());
  });
});

import { Router } from "express";
import {sendEmail, sendEmailWithAttachments} from '../controllers/messages.controller.js';
import { sendEmailDelete } from "../controllers/email.controller.js";

const emailRouter = Router();

emailRouter.get("/", sendEmail);
emailRouter.get("/", sendEmailDelete);
emailRouter.get("/attachments", sendEmailWithAttachments);

export default emailRouter;


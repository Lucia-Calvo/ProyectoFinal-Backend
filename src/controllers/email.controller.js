import { GMAIL_USER } from '../config/config.js';
import EmailService from '../services/email.service.js';

const emailService = new EmailService();

export const sendEmailDelete = (req, res) => {
    try {
        const { email } = req.user;
        const { message, title } = req.body;
        emailService.sendEmail(email, message, title, (error, info) => {
            if (error) {
                res.status(400).send({ message: "Error", payload: error });
            }
            req.logger.console.info(`Message sent: %s ${info.messageId}`);
            res.send({ message: "Success!", payload: info });
        });
    } catch (error) {
        req.logger.console.warn(`Ocurrio un error mientras se enviaba el mail:  ${error} `);
        res.status(500).send({ error: error, message: "No se pudo enviar el mail desde:" + GMAIL_USER });
    }
};
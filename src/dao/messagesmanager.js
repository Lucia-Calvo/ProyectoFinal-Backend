import messageModel from "./models/message.model.js";

export default class MessagesManager {
  getMessages = async () => {
    try {
      return await messageModel.find().lean().exec();
    } catch (error) {
      return error;
    }
  };

  createMessage = async (message) => {
    if (message.user.trim() === "" || message.message.trim() === "") {
      return null;
    }
    try {
      return await messageModel.create(message);
    } catch (error) {
      return error;
    }
  };

  deleteAllMessages = async () => {
    try {
      console.log("Eliminando todos los mensajes");
      const result = await messageModel.deleteMany({});
      console.log("Mensajes eliminados" + result);
      return result;
    } catch (error) {
      return error;
    }
  };
}

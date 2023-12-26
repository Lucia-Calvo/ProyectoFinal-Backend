import { PERSISTENCE, MONGODB_CNX_STR } from "../config/configs";
import mongoose from "mongoose";
import ContactsMemo from "../memory/contactMemo.js";

let Contacts;

switch(PERSISTENCE){
    case "MONGO":
        const connection = mongoose.connect(MONGODB_CNX_STR)
        const {default:ContactsMDB} = await import ("../mongo/contact.js");
        Contacts = ContactsMDB;
        break;
    case "MEMORY":
        const {default:ContactsMemo} = await import("../memory/contactMemo.js");
        Contacts = ContactsMemo;
        break;
}

export default Contacts;
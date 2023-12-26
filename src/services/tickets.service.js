import { ticketModel } from "../dao/models/ticket.model.js";
import TicketManager from "../dao/ticketManager.js";

class TicketService {
  constructor() {
    this.ticketManager = new TicketManager();
  }
  async createTicket(data) {
    console.log("Ticket data:", data);
    if (
      !data.code ||
      !data.purchase_datetime ||
      !data.amount ||
      !data.purchaser
    ) {
      console.error("Falta informacion:", data);
      throw new Error("Falta informacion para crear el ticket.");
    }
    const ticket = new ticketModel(data);
    await ticket.save();
    console.log("Ticket creado:", ticket);

    return ticket;
  }

  async getTicketByOnlyCode(code) {
    if (!code) {
      throw new Error("Se requiere el id del ticket");
    }
    const tickets = await this.ticketManager.getTicketByCode(code);
    return tickets;
  }

  async createTickets(data) {
    const { total, purchaser } = data;
    return this.ticketManager.createTicket({
      amount: total,
      purchaser: purchaser,
    });
  }

  async getTicketById(tid) {
    if (!tid) throw new Error("Se requiere el id del ticket.");
    const tickets = await this.ticketManager.getTicketById(tid);
    return tickets;
  }
}

export default TicketService;

import { getUser, checkVatNumber, updatePhone } from "../services/clientService.js";
import { WhatsAppMessageService } from "../services/whatsappMessageService.js";
import { logStream } from "../server.js";
import { handleUserInteraction } from "../services/userInteractionService.js";

// ...existing code...
export async function handleWebhook(req, res) {
  logStream.write(`Incoming webhook message: ${JSON.stringify(req.body)} + "\n"`);
  const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];

  if (!message || message.type !== "text") {
    return res.sendStatus(200);
  }

  const userPhone = message.from;
  const userMessage = message.text.body.trim().toLowerCase();

  handleUserInteraction(userPhone, userMessage, "whatsapp");

  res.sendStatus(200);
}
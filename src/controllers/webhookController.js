import { logWithUI } from "../utils/logger.js";
import { handleUserInteraction } from "../services/userInteractionService.js";

export async function handleWebhook(req, res) {
  logWithUI(`Incoming webhook message: ${JSON.stringify(req.body)}\n`);

  // Check if this is a WhatsApp Business API format
  const entry = req.body.entry?.[0];

  if (!entry) {
    logWithUI("No entry found in webhook, ignoring\n");
    return res.sendStatus(200);
  }

  // Handle message webhooks (WhatsApp Business API format)
  if (entry.changes) {
    const message = entry.changes[0]?.value?.messages?.[0];

    if (!message || message.type !== "text") {
      return res.sendStatus(200);
    }

    const userPhone = message.from;
    const userMessage = message.text.body.trim().toLowerCase();

    handleUserInteraction(userPhone, userMessage, "whatsapp");
  } else if (entry.changed_fields) {
    // Handle other webhook types (user profile updates, etc.)
    logWithUI(
      `Received webhook with changed_fields: ${entry.changed_fields.join(", ")}\n`,
    );
    // For now, just log these and ignore them
  } else {
    logWithUI("Unknown webhook format, ignoring\n");
  }

  res.sendStatus(200);
}

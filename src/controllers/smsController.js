import { logWithUI } from "../utils/logger.js";
import { handleUserInteraction } from "../services/userInteractionService.js";

// controllers/smsController.js
export async function handleSMS(req, res) {
  try {
    const providedSecret = req.headers["x-verify-key"] || req.query.verify_key;

    if (providedSecret !== process.env.SMS_VERIFY_TOKEN) {
      return res.status(403).send("Invalid verify key");
    }

    const { from, text, sentStamp } = req.body;

    logWithUI(
      `Received SMS from: ${from} at ${sentStamp} with message: ${text}\n`,
    );

    handleUserInteraction(String(from).replace("+", ""), text, "sms");

    res.status(200).send("Webhook received successfully");
  } catch (error) {
    logWithUI(`Error handling SMS: ${error}\n`);
    res.status(500).send("Internal Server Error");
  }
}

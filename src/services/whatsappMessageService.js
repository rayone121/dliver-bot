// services/whatsappService.js
import apiClient from "../utils/axiosInstance.js";
import { MessageServiceInterface } from "./messageServiceInterface.js";
import { log } from "../utils/logger.js";

export class WhatsAppMessageService extends MessageServiceInterface {
  constructor() {
    super();
    this.baseURL = `/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  }

  async sendMessage(recipient, text) {
    try {
      const response = await apiClient.post(this.baseURL, {
        messaging_product: "whatsapp",
        to: recipient,
        text: { body: text },
      });
      return response.data; // Good practice to return response
    } catch (error) {
      log(`WhatsApp API Error: ${error.response?.data || error.message}`);
      throw error; // Maintain error propagation
    }
  }
}

// Export as singleton instance
export const whatsappService = new WhatsAppMessageService();

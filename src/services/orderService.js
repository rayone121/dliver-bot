// services/orderService.js
import { pb } from "../pocketbase.js";
import { logWithUI } from "../utils/logger.js";

/**
 * Create a new order
 * @param {string} orderText - The order text
 * @param {string} clientId - The client ID
 * @param {string} platform - The platform (whatsapp or sms)
 * @param {Object} additionalData - Additional order data (AI processing results, etc.)
 * @returns {Promise<Object>} - The created order
 */
export async function createOrder(
  orderText,
  clientId,
  platform,
  additionalData = {},
) {
  try {
    logWithUI(
      `Creating order: ${orderText} for client ${clientId} via ${platform}`,
    );

    const orderData = {
      orderText: orderText,
      client: clientId,
      platform: platform,
      status: "pending",
    };

    // If AI processed, include items and calculate total
    if (additionalData.aiProcessed && additionalData.processedItems) {
      orderData.items = additionalData.processedItems;

      // Calculate total price
      orderData.total = additionalData.processedItems.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
        0,
      );
    }

    const order = await pb.collection("orders").create(orderData);

    logWithUI(`Order created with ID: ${order.id}`);
    return order;
  } catch (error) {
    logWithUI(`PocketBase error in createOrder: ${error.message}`);
    throw error;
  }
}

/**
 * Update order status
 * @param {string} orderId - The order ID
 * @param {string} status - The new status
 * @returns {Promise<Object>} - The updated order
 */
export async function updateOrderStatus(orderId, status) {
  try {
    logWithUI(`Updating order ${orderId} status to ${status}`);

    const order = await pb.collection("orders").update(orderId, {
      status: status,
    });

    logWithUI(`Order ${orderId} updated to status: ${status}`);
    return order;
  } catch (error) {
    logWithUI(`PocketBase error in updateOrderStatus: ${error.message}`);
    throw error;
  }
}

// services/userInteractionService.js
import {
  getUser,
  checkVatNumber,
  updatePhone,
  getClientName,
} from "./clientService.js";
import { logWithUI } from "../utils/logger.js";
import { whatsappService } from "./whatsappMessageService.js";
import { adbSmsService } from "./smsMessageService.js";
import {
  getOrCreateSession,
  updateSessionState,
  endSession,
  getSession,
  checkSessionTimeouts,
} from "./sessionService.js";
import { createOrder, updateOrderStatus } from "./orderService.js";
import { pb } from "../pocketbase.js";
import { processOrderWithAI, validateOrderItems } from "./aiOrderService.js";
import { getAllProducts } from "./productService.js";

/**
 * Safe wrapper for sending messages that handles failures gracefully
 * @param {Object} messageService - The message service to use
 * @param {string} phoneNumber - The recipient phone number
 * @param {string} message - The message to send
 * @returns {Promise<boolean>} - True if sent successfully, false otherwise
 */
async function safeSendMessage(messageService, phoneNumber, message) {
  try {
    const result = await messageService.sendMessage(phoneNumber, message);
    // For ADB SMS service, result will be false if it failed
    if (result === false) {
      logWithUI(`SMS sending failed for ${phoneNumber}, but continuing...`);
      return false;
    }
    return true;
  } catch (error) {
    logWithUI(`Error sending message to ${phoneNumber}: ${error.message}`);
    return false;
  }
}

/**
 * Handle user interaction with the bot
 * @param {string} userPhone - The user's phone number
 * @param {string} userMessage - The user's message
 * @param {string} platform - The platform (whatsapp or sms)
 */
export async function handleUserInteraction(userPhone, userMessage, platform) {
  let messageService;

  if (platform === "whatsapp") {
    messageService = whatsappService;
  } else if (platform === "sms") {
    messageService = adbSmsService;
  } else {
    throw new Error("Invalid platform");
  }

  // Combine phone and platform for unique session key
  const userKey = `${userPhone}-${platform}`;

  try {
    // Get or create a session for this user
    const session = await getOrCreateSession(userKey, userPhone, platform);
    const userState = session.state;

    switch (userState) {
      case "start":
        if (userMessage.toLowerCase() === "/start") {
          await updateSessionState(userKey, "initial");
          await safeSendMessage(
            messageService,
            userPhone,
            "Bine ati venit! Va rugam asteptati pana la verificarea numarului de telefon.",
          );

          const user = await getUser(userPhone);
          if (!user) {
            await updateSessionState(userKey, "awaitingVat");
            await safeSendMessage(
              messageService,
              userPhone,
              "Numarul de telefon nu a fost identificat in baza noastra de date. Va rugam sa introduceti codul fiscal. (Exemplu: ROXXXXXXX sau XXXXXXX).",
            );
          } else {
            await updateSessionState(userKey, "verified", { client: user.id });
            await safeSendMessage(
              messageService,
              userPhone,
              `Bun venit, ${user.name}! Numarul dumneavoastra de telefon a fost verificat. Va rugam sa trimiteti comanda.`,
            );
          }
        } else {
          await safeSendMessage(
            messageService,
            userPhone,
            "Va rugam sa trimiteti /start pentru a incepe.",
          );
        }
        break;

      case "awaitingVat":
        const vatUser = await checkVatNumber(userMessage);
        if (Object.keys(vatUser).length === 0) {
          await safeSendMessage(
            messageService,
            userPhone,
            "Codul fiscal nu a fost gasit in baza noastra de date. Va rugam sa introduceti un cod fiscal valid.",
          );
          break;
        }
        const clientName = await getClientName(vatUser.vat);
        await updatePhone(userPhone, vatUser.vat);
        await updateSessionState(userKey, "verified", { client: vatUser.id });
        await safeSendMessage(
          messageService,
          userPhone,
          `Bun venit, ${clientName}! Numarul dumneavoastra de telefon a fost verificat. Va rugam sa trimiteti comanda.`,
        );
        break;

      case "verified":
        // Get the current session to access client info
        const currentSession = await getSession(userKey);

        if (!currentSession?.client) {
          logWithUI(`No client associated with session ${userKey}`);
          await safeSendMessage(
            messageService,
            userPhone,
            "Eroare: Nu există un client asociat cu această sesiune. Vă rugăm să începeți din nou cu /start.",
          );
          await endSession(userKey);
          break;
        }

        // Process order with AI
        try {
          // Get available products for AI processing
          const availableProducts = await getAllProducts();

          // Process the order with AI
          const aiResult = await processOrderWithAI(
            userMessage,
            availableProducts,
          );

          if (aiResult.needsClarification) {
            // AI needs clarification - stay in verified state
            await safeSendMessage(
              messageService,
              userPhone,
              aiResult.clarificationMessage || aiResult.orderSummary,
            );
            break;
          }

          if (aiResult.items && aiResult.items.length > 0) {
            // Validate the processed items
            const validation = await validateOrderItems(
              aiResult.items,
              availableProducts,
            );

            if (!validation.isValid) {
              await safeSendMessage(
                messageService,
                userPhone,
                `Problemă cu comanda: ${validation.errors.join(", ")}. Vă rugăm să încercați din nou.`,
              );
              break;
            }

            // Save processed order and update state using the order field as JSON
            const orderData = {
              originalOrder: userMessage,
              processedOrder: aiResult,
              validatedItems: validation.validatedItems,
            };
            logWithUI(`Saving session data: ${JSON.stringify(orderData)}`);
            await updateSessionState(userKey, "awaitingConfirmation", {
              order: JSON.stringify(orderData),
            });
            logWithUI(
              `Session state updated to awaitingConfirmation for ${userKey}`,
            );

            // Send AI order summary (already includes confirmation request)
            await safeSendMessage(
              messageService,
              userPhone,
              aiResult.orderSummary,
            );
          } else {
            // AI couldn't process the order or fallback mode
            await updateSessionState(userKey, "awaitingConfirmation", {
              originalOrder: userMessage,
              processedOrder: aiResult,
              fallbackMode: true,
            });

            await safeSendMessage(
              messageService,
              userPhone,
              aiResult.orderSummary,
            );
          }
        } catch (error) {
          logWithUI(
            `Error processing order with AI for ${userKey}: ${error.message}`,
          );

          // Fallback to simple order processing
          await updateSessionState(userKey, "awaitingConfirmation", {
            originalOrder: userMessage,
            fallbackMode: true,
          });
          await messageService.sendMessage(
            userPhone,
            `Comanda dumneavoastră: ${userMessage}\n\nConfirmați comanda? (da/nu)`,
          );
        }
        break;

      case "awaitingConfirmation":
        const confirmSession = await getSession(userKey);
        logWithUI(
          `Confirmation session data: ${JSON.stringify(confirmSession)}`,
        );

        if (userMessage.toLowerCase() === "da") {
          // Parse order data from session
          let sessionOrderData = null;
          if (confirmSession?.order) {
            try {
              sessionOrderData = JSON.parse(confirmSession.order);
            } catch (e) {
              logWithUI(`Failed to parse session order data: ${e.message}`);
            }
          }

          // Create the order in PocketBase
          if (confirmSession?.client && sessionOrderData) {
            let orderData = {
              aiProcessed: true,
              processedItems: sessionOrderData.validatedItems,
              aiSummary: sessionOrderData.processedOrder.orderSummary,
            };

            logWithUI(
              `Creating AI-processed order with ${orderData.processedItems?.length} items`,
            );

            await createOrder(
              sessionOrderData.originalOrder,
              confirmSession.client,
              platform,
              orderData,
            );

            let confirmationMessage =
              "Comanda dumneavoastra a fost confirmata si va fi procesata. Va multumim!";

            if (orderData.processedItems?.length > 0) {
              const totalItems = orderData.processedItems.reduce(
                (sum, item) => sum + item.quantity,
                0,
              );
              const totalPrice = orderData.processedItems.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0,
              );
              confirmationMessage += `\n\nRezumat: ${totalItems} articole, Total: ${totalPrice.toFixed(2)} RON`;
            }

            await safeSendMessage(
              messageService,
              userPhone,
              confirmationMessage,
            );
            await endSession(userKey);
          } else {
            logWithUI(`Missing client or order data for session ${userKey}`);
            logWithUI(`Session client: ${confirmSession?.client}`);
            logWithUI(`Session order: ${confirmSession?.order}`);
            logWithUI(`Parsed order data: ${JSON.stringify(sessionOrderData)}`);
            await safeSendMessage(
              messageService,
              userPhone,
              "Eroare: Date lipsă pentru comandă. Vă rugăm să începeți din nou cu /start.",
            );
            await endSession(userKey);
          }
        } else if (userMessage.toLowerCase() === "nu") {
          await updateSessionState(userKey, "verified");
          await safeSendMessage(
            messageService,
            userPhone,
            "Comanda dumneavoastra a fost anulata. Va rugam sa trimiteti o noua comanda.",
          );
        } else {
          await safeSendMessage(
            messageService,
            userPhone,
            "Va rugam sa raspundeti cu 'da' sau 'nu'.",
          );
        }
        break;

      default:
        // Reset state if something unexpected happened
        await updateSessionState(userKey, "start");
        await messageService.sendMessage(
          userPhone,
          "A apărut o eroare. Vă rugăm să începeți din nou cu /start.",
        );
    }
  } catch (error) {
    logWithUI(
      `Error handling user interaction for ${userKey}: ${error.message}`,
    );
    await safeSendMessage(
      messageService,
      userPhone,
      "A apărut o eroare în procesarea solicitării dumneavoastră. Vă rugăm să încercați din nou mai târziu.",
    );

    // Try to end the session in case of error
    try {
      await endSession(userKey);
    } catch (sessionError) {
      logWithUI(`Error ending session for ${userKey}: ${sessionError.message}`);
    }
  }
}

/**
 * Schedule regular checks for session timeouts
 * @param {number} interval - Check interval in milliseconds (default: 5 minutes)
 */
export function scheduleSessionChecks(interval = 5 * 60 * 1000) {
  setInterval(async () => {
    try {
      // Check WhatsApp sessions
      await checkSessionTimeouts(whatsappService);

      // Check SMS sessions
      await checkSessionTimeouts(adbSmsService);

      logWithUI(
        `Completed scheduled session timeout check at ${new Date().toISOString()}`,
      );
    } catch (error) {
      logWithUI(`Error during scheduled session check: ${error.message}`);
    }
  }, interval);

  logWithUI(
    `Session timeout checks scheduled to run every ${interval / 1000 / 60} minutes`,
  );
}

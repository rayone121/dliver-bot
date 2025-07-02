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
          await messageService.sendMessage(
            userPhone,
            "Bine ati venit! Va rugam asteptati pana la verificarea numarului de telefon.",
          );

          const user = await getUser(userPhone);
          if (!user) {
            await updateSessionState(userKey, "awaitingVat");
            await messageService.sendMessage(
              userPhone,
              "Numarul de telefon nu a fost identificat in baza noastra de date. Va rugam sa introduceti codul fiscal. (Exemplu: ROXXXXXXX sau XXXXXXX).",
            );
          } else {
            await updateSessionState(userKey, "verified", { client: user.id });
            await messageService.sendMessage(
              userPhone,
              `Bun venit, ${user.name}! Numarul dumneavoastra de telefon a fost verificat. Va rugam sa trimiteti comanda.`,
            );
          }
        } else {
          await messageService.sendMessage(
            userPhone,
            "Va rugam sa trimiteti /start pentru a incepe.",
          );
        }
        break;

      case "awaitingVat":
        const vatUser = await checkVatNumber(userMessage);
        if (Object.keys(vatUser).length === 0) {
          await messageService.sendMessage(
            userPhone,
            "Codul fiscal nu a fost gasit in baza noastra de date. Va rugam sa introduceti un cod fiscal valid.",
          );
          break;
        }
        const clientName = await getClientName(vatUser.vat);
        await updatePhone(userPhone, vatUser.vat);
        await updateSessionState(userKey, "verified", { client: vatUser.id });
        await messageService.sendMessage(
          userPhone,
          `Bun venit, ${clientName}! Numarul dumneavoastra de telefon a fost verificat. Va rugam sa trimiteti comanda.`,
        );
        break;

      case "verified":
        // Get the current session to access client info
        const currentSession = await getSession(userKey);

        if (!currentSession?.client) {
          await endSession(userKey);
          throw new Error("No client associated with session");
        }

        // Get available products for AI processing
        const availableProducts = await getAllProducts();

        // Process the order with AI
        const aiResult = await processOrderWithAI(
          userMessage,
          availableProducts,
        );

        // Handle AI error responses first
        if (aiResult.error) {
          // Check if this is a partial order (has both valid items and errors)
          if (
            aiResult.partialOrder &&
            aiResult.items &&
            aiResult.items.length > 0
          ) {
            // Validate the valid items from the partial order
            const validation = await validateOrderItems(
              aiResult.items,
              availableProducts,
            );

            if (validation.isValid) {
              // Process the valid items and inform about invalid ones
              const orderData = {
                originalOrder: userMessage,
                processedOrder: aiResult,
                validatedItems: validation.validatedItems,
                isPartialOrder: true,
              };

              await updateSessionState(userKey, "awaitingConfirmation", {
                order: JSON.stringify(orderData),
              });

              let message = aiResult.orderSummary;
              message +=
                "\n\nConfirmati comanda pentru produsele disponibile? (da/nu)";

              await messageService.sendMessage(userPhone, message);
            } else {
              // Even the "valid" items failed validation
              let errorMessage =
                aiResult.orderSummary || "Eroare la procesarea comenzii";
              if (aiResult.error) {
                errorMessage += `\n\n${aiResult.error}`;
              }
              throw new Error(errorMessage);
            }
          } else {
            // Pure error case - no valid items
            let errorMessage =
              aiResult.orderSummary || "Eroare la procesarea comenzii";
            if (aiResult.error && aiResult.error !== aiResult.orderSummary) {
              errorMessage += `\n\nDetalii: ${aiResult.error}`;
            }
            throw new Error(errorMessage);
          }
          break;
        }

        if (aiResult.needsClarification) {
          // AI needs clarification - stay in verified state
          await messageService.sendMessage(
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
            throw new Error(
              `Problemă cu comanda: ${validation.errors.join(", ")}. Vă rugăm să încercați din nou.`,
            );
          }

          // Save processed order and update state using the order field as JSON
          const orderData = {
            originalOrder: userMessage,
            processedOrder: aiResult,
            validatedItems: validation.validatedItems,
          };
          await updateSessionState(userKey, "awaitingConfirmation", {
            order: JSON.stringify(orderData),
          });

          // Send AI order summary (already includes confirmation request)
          await messageService.sendMessage(
            userPhone,
            aiResult.orderSummary,
          );
        } else {
          // AI processed but returned no items - likely an error case
          throw new Error(
            aiResult.orderSummary ||
              "Nu am putut procesa comanda. Va rugam sa incercati din nou cu produse disponibile.",
          );
        }
        break;

      case "awaitingConfirmation":
        const confirmSession = await getSession(userKey);

        if (userMessage.toLowerCase() === "da") {
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

            await createOrder(
              sessionOrderData.originalOrder,
              confirmSession.client,
              platform,
              orderData,
            );

            let confirmationMessage = sessionOrderData.isPartialOrder
              ? "Comanda partiala confirmata si va fi procesata. Va multumim!"
              : "Comanda dumneavoastra a fost confirmata si va fi procesata. Va multumim!";

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

              if (sessionOrderData.isPartialOrder) {
                confirmationMessage +=
                  "\n\nNota: Produsele indisponibile nu au fost incluse in comanda.";
              }
            }

            await messageService.sendMessage(
              userPhone,
              confirmationMessage,
            );
            await endSession(userKey);
          } else {
            await endSession(userKey);
            throw new Error("Missing client or order data for session");
          }
        } else if (userMessage.toLowerCase() === "nu") {
          await updateSessionState(userKey, "verified");
          await messageService.sendMessage(
            userPhone,
            "Comanda dumneavoastra a fost anulata. Va rugam sa trimiteti o noua comanda.",
          );
        } else {
          await messageService.sendMessage(
            userPhone,
            "Va rugam sa raspundeti cu 'da' sau 'nu'.",
          );
        }
        break;

      default:
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
    await messageService.sendMessage(
      userPhone,
      "A apărut o eroare în procesarea solicitării dumneavoastră. Vă rugăm să încercați din nou mai târziu.",
    );
    await endSession(userKey);
    throw error;
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

// services/clientService.js
import { pb } from "../pocketbase.js";
import { logWithUI } from "../utils/logger.js";

/**
 * Check if a phone number exists in the database
 * @param {string} phone - The phone number to check
 * @returns {Promise<boolean>} - Whether the phone number exists
 */
export async function getUser(phone) {
  try {
    const cleanPhone = cleanPhoneNumber(phone);
    logWithUI(`Checking if user exists with phone: ${cleanPhone}`);

    const records = await pb.collection("clients").getList(1, 1, {
      filter: `phone ~ "${cleanPhone}"`,
    });

    return records.items.length > 0 ? records.items[0] : null;
  } catch (error) {
    logWithUI(`PocketBase error in getUser: ${error.message}`);
    throw error;
  }
}

/**
 * Check if a VAT number exists in the database
 * @param {string} vatNumber - The VAT number to check
 * @returns {Promise<Object>} - The client with the VAT number
 */
export async function checkVatNumber(vatNumber) {
  try {
    logWithUI(`Checking VAT number: ${vatNumber}`);

    const records = await pb.collection("clients").getList(1, 1, {
      filter: `vat ~ "${vatNumber}"`,
    });

    return records.items.length > 0 ? records.items[0] : {};
  } catch (error) {
    logWithUI(`PocketBase error in checkVatNumber: ${error.message}`);
    throw error;
  }
}

/**
 * Get a client's name by VAT number
 * @param {string} vatNumber - The VAT number
 * @returns {Promise<string>} - The client's name
 */
export async function getClientName(vatNumber) {
  try {
    logWithUI(`Getting client name for VAT: ${vatNumber}`);

    const records = await pb.collection("clients").getList(1, 1, {
      filter: `vat ~ "${vatNumber}"`,
    });

    return records.items.length > 0 ? records.items[0].name : null;
  } catch (error) {
    logWithUI(`PocketBase error in getClientName: ${error.message}`);
    throw error;
  }
}

/**
 * Update a client's phone number
 * @param {string} phone - The phone number
 * @param {string} vat - The VAT number
 * @returns {Promise<void>}
 */
export async function updatePhone(phone, vat) {
  try {
    const cleanPhone = cleanPhoneNumber(phone);
    logWithUI(`Updating phone number: ${cleanPhone} for VAT: ${vat}`);

    // First, find the client record
    const records = await pb.collection("clients").getList(1, 1, {
      filter: `vat ~ "${vat}"`,
    });

    if (records.items.length > 0) {
      const client = records.items[0];

      // Update the client's phone number
      await pb.collection("clients").update(client.id, {
        phone: cleanPhone,
      });

      logWithUI(`Phone number updated successfully for VAT: ${vat}`);
    } else {
      logWithUI(`No client found with VAT: ${vat}`);
    }
  } catch (error) {
    logWithUI(`PocketBase error in updatePhone: ${error.message}`);
    throw error;
  }
}

/**
 * Clean a phone number to ensure consistent format
 * @param {string} phone - Phone number to clean
 * @returns {string} - Cleaned phone number
 */
function cleanPhoneNumber(phone) {
  // Remove any non-digit characters
  return phone.replace(/\D/g, "");
}

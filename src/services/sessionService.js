// services/sessionService.js
import { pb } from "../pocketbase.js";
import { logWithUI } from "../utils/logger.js";

// Constants for session management
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour
const REMINDER_TIMEOUT = 30 * 60 * 1000; // 30 minutes

/**
 * Get or create a user session
 * @param {string} userKey - The user key (phone-platform)
 * @param {string} phone - The user's phone number
 * @param {string} platform - The platform (whatsapp or sms)
 * @returns {Promise<Object>} - The user session
 */
export async function getOrCreateSession(userKey, phone, platform) {
  try {
    logWithUI(`Getting or creating session for user: ${userKey}`);

    // Try to find existing session
    const existingSessions = await pb.collection("userSessions").getList(1, 1, {
      filter: `userKey = "${userKey}"`,
    });

    if (existingSessions.items.length > 0) {
      // Update only last activity timestamp, preserve all other data
      const session = existingSessions.items[0];
      const updatedSession = await pb
        .collection("userSessions")
        .update(session.id, {
          lastActivity: new Date().toISOString(),
        });

      logWithUI(`Updated existing session for ${userKey}`);
      return updatedSession;
    }

    // Create new session
    const newSession = await pb.collection("userSessions").create({
      userKey: userKey,
      phone: phone,
      platform: platform,
      state: "start",
      lastActivity: new Date().toISOString(),
      reminderSent: false,
    });

    logWithUI(`Created new session for ${userKey}`);
    return newSession;
  } catch (error) {
    logWithUI(`PocketBase error in getOrCreateSession: ${error.message}`);
    throw error;
  }
}

/**
 * Update a user's session state
 * @param {string} userKey - The user key (phone-platform)
 * @param {string} state - The new state
 * @param {Object} additionalData - Additional data to update
 * @returns {Promise<Object>} - The updated session
 */
export async function updateSessionState(userKey, state, additionalData = {}) {
  try {
    logWithUI(`Updating session state for user: ${userKey} to ${state}`);

    // Find the session
    const sessions = await pb.collection("userSessions").getList(1, 1, {
      filter: `userKey = "${userKey}"`,
    });

    if (sessions.items.length === 0) {
      logWithUI(`No session found for ${userKey}`);
      throw new Error(`Session not found for ${userKey}`);
    }

    // Update the session
    const sessionId = sessions.items[0].id;
    const updateData = {
      state: state,
      lastActivity: new Date().toISOString(),
      ...additionalData,
    };

    const updatedSession = await pb
      .collection("userSessions")
      .update(sessionId, updateData);
    logWithUI(`Session state updated for ${userKey}`);

    return updatedSession;
  } catch (error) {
    logWithUI(`PocketBase error in updateSessionState: ${error.message}`);
    throw error;
  }
}

/**
 * End a user session
 * @param {string} userKey - The user key (phone-platform)
 * @returns {Promise<void>}
 */
export async function endSession(userKey) {
  try {
    logWithUI(`Ending session for ${userKey}`);

    // Find the session
    const sessions = await pb.collection("userSessions").getList(1, 1, {
      filter: `userKey = "${userKey}"`,
    });

    if (sessions.items.length > 0) {
      // Delete the session
      await pb.collection("userSessions").delete(sessions.items[0].id);
      logWithUI(`Session deleted for ${userKey}`);
    } else {
      logWithUI(`No session found to delete for ${userKey}`);
    }
  } catch (error) {
    logWithUI(`PocketBase error in endSession: ${error.message}`);
    throw error;
  }
}

/**
 * Get a user's session
 * @param {string} userKey - The user key (phone-platform)
 * @returns {Promise<Object>} - The user session or null if not found
 */
export async function getSession(userKey) {
  try {
    const sessions = await pb.collection("userSessions").getList(1, 1, {
      filter: `userKey = "${userKey}"`,
    });

    return sessions.items.length > 0 ? sessions.items[0] : null;
  } catch (error) {
    logWithUI(`PocketBase error in getSession: ${error.message}`);
    throw error;
  }
}

/**
 * Check for expired sessions and send reminders
 * @param {Function} messageService - The message service to use for notifications
 * @returns {Promise<void>}
 */
export async function checkSessionTimeouts(messageService) {
  try {
    const now = new Date();
    const reminderTime = new Date(now.getTime() - REMINDER_TIMEOUT);
    const expirationTime = new Date(now.getTime() - SESSION_TIMEOUT);

    logWithUI(`Checking for session timeouts at ${now.toISOString()}`);

    // Find sessions needing reminders
    const reminderSessions = await pb
      .collection("userSessions")
      .getList(100, 1, {
        filter: `lastActivity < "${reminderTime.toISOString()}" && reminderSent = false`,
      });

    // Send reminders
    for (const session of reminderSessions.items) {
      await messageService.sendMessage(
        session.phone,
        "Your session will expire in 30 minutes. Please complete your interaction.",
      );

      await pb.collection("userSessions").update(session.id, {
        reminderSent: true,
      });

      logWithUI(`Reminder sent to ${session.userKey}`);
    }

    // Find expired sessions
    const expiredSessions = await pb
      .collection("userSessions")
      .getList(100, 1, {
        filter: `lastActivity < "${expirationTime.toISOString()}"`,
      });

    // End expired sessions
    for (const session of expiredSessions.items) {
      await messageService.sendMessage(
        session.phone,
        "Your session has expired due to inactivity.",
      );

      await pb.collection("userSessions").delete(session.id);
      logWithUI(`Session expired and deleted for ${session.userKey}`);
    }

    logWithUI(
      `Session timeout check complete. Processed ${reminderSessions.items.length} reminders and ${expiredSessions.items.length} expirations`,
    );
  } catch (error) {
    logWithUI(`Error in checkSessionTimeouts: ${error.message}`);
  }
}

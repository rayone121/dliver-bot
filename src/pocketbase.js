// src/pocketbase.js
import PocketBase from "pocketbase";
import { log } from "./utils/logger.js";

// Get PocketBase URL from environment variables or use default
const POCKETBASE_URL = process.env.POCKETBASE_URL || "http://127.0.0.1:8090";

// Create PocketBase client instance
const pb = new PocketBase(POCKETBASE_URL);

// Authenticate admin if credentials are provided
async function initPocketBase() {
  try {
    // Admin authentication if credentials are provided
    if (
      process.env.POCKETBASE_ADMIN_EMAIL &&
      process.env.POCKETBASE_ADMIN_PASSWORD
    ) {
      await pb
        .collection("_superusers")
        .authWithPassword(
          process.env.POCKETBASE_ADMIN_EMAIL,
          process.env.POCKETBASE_ADMIN_PASSWORD,
        );
      log("PocketBase admin authentication successful");
    } else {
      log("No admin credentials provided, running in unauthenticated mode");
    }

    log(`PocketBase connected to ${POCKETBASE_URL}`);
    return true;
  } catch (error) {
    log(`PocketBase initialization error: ${error.message}`);
    return false;
  }
}

export { pb, initPocketBase };

// utils/backupPocketBase.js
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { log } from "./logger.js";

dotenv.config();

// Get the directory name from the URL
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PocketBase settings
const POCKETBASE_URL = process.env.POCKETBASE_URL || "http://localhost:8090";
const POCKETBASE_ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const POCKETBASE_ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

/**
 * Authenticate with PocketBase to get admin token
 * @returns {Promise<string|null>} Admin token or null if failed
 */
async function authenticateAdmin() {
  try {
    log("Authenticating with PocketBase admin...");

    const response = await axios.post(
      `${POCKETBASE_URL}/api/collections/_superusers/auth-with-password`,
      {
        identity: POCKETBASE_ADMIN_EMAIL,
        password: POCKETBASE_ADMIN_PASSWORD,
      },
    );

    log("Authentication successful");
    return response.data.token;
  } catch (error) {
    log(`Authentication failed: ${error.response?.data || error.message}`);
    return null;
  }
}

/**
 * Create a backup of PocketBase data
 * @param {string} token - Admin authentication token
 * @returns {Promise<string|null>} Path to the backup file or null if failed
 */
async function createBackup(token) {
  try {
    log("Creating PocketBase backup...");

    // Create backups directory if it doesn't exist
    const backupsDir = path.join(__dirname, "..", "..", "backups");
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    // Create a backup with timestamp in the filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(backupsDir, `pb_backup_${timestamp}.zip`);

    // Request a backup from PocketBase
    const response = await axios({
      method: "post",
      url: `${POCKETBASE_URL}/api/_backups`,
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      responseType: "stream",
    });

    // Save the backup file
    const writer = fs.createWriteStream(backupPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        console.log(`Backup created successfully at: ${backupPath}`);
        resolve(backupPath);
      });
      writer.on("error", (error) => {
        log(`Error saving backup: ${error.message}`);
        reject(error);
      });
    });
  } catch (error) {
    log(`Failed to create backup: ${error.response?.data || error.message}`);
    return null;
  }
}

/**
 * Run the backup process
 */
async function runBackup() {
  try {
    log(`Creating backup of PocketBase at: ${POCKETBASE_URL}`);

    // 1. Authenticate with PocketBase
    const token = await authenticateAdmin();
    if (!token) {
      log(
        "Failed to authenticate. Please check your PocketBase admin credentials.",
      );
      process.exit(1);
    }

    // 2. Create a backup
    const backupPath = await createBackup(token);

    if (backupPath) {
      log(`Backup created successfully at: ${backupPath}`);
      log("You can now proceed with applying migrations safely");
      process.exit(0);
    } else {
      log("Backup failed");
      process.exit(1);
    }
  } catch (error) {
    log(`Error in backup process: ${error}`);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runBackup();
}

export { runBackup };

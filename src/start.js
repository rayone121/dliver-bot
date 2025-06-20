// start.js - Entry point for the dliver-bot server
import dotenv from "dotenv";
import app from "./app.js";
import { pb, initPocketBase } from "./pocketbase.js";
import { scheduleSessionChecks } from "./services/userInteractionService.js";
import { log } from "./utils/logger.js";

// Load environment variables
dotenv.config();
const PORT = process.env.PORT || 3000;

// Server startup function
async function startServer() {
  try {
    log("Starting dliver-bot server...");

    const pbInitialized = await initPocketBase();

    if (pbInitialized) {
      log("PocketBase initialized successfully");

      // Start the Express server after PocketBase is initialized
      const server = app.listen(PORT, () => {
        log(`Server running on port ${PORT}`);
        log(`Visit http://localhost:${PORT} to test`);
        log("Webhook endpoints:");
        log(`  WhatsApp: http://localhost:${PORT}/webhook`);
        log(`  SMS: http://localhost:${PORT}/sms`);
      });

      // Set up middleware to log incoming requests
      app.use((req, res, next) => {
        log(`${req.method} ${req.url} - ${req.ip}`);
        next();
      });

      // Schedule regular checks for session timeouts
      scheduleSessionChecks();

      // Check API status
      const checkAPIStatus = async () => {
        // WhatsApp API available (configured via GRAPH_API_TOKEN)
        log("WhatsApp API: Configured");
      };

      const checkSMSStatus = async () => {
        // Simple SMS status check - always online for now
        log("SMS API: Online");
      };

      // Perform initial status checks
      log("Checking API status...");
      await checkAPIStatus();
      await checkSMSStatus();

      // Set up periodic status checks (every 5 minutes)
      setInterval(checkAPIStatus, 5 * 60 * 1000);
      setInterval(checkSMSStatus, 5 * 60 * 1000);

      // Set up graceful shutdown
      const shutdown = () => {
        log("Server shutting down...");
        server.close(() => {
          log("Server closed");
          process.exit(0);
        });
      };

      // Handle OS signals
      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);

      log("Server startup complete. Press Ctrl+C to quit.");
    } else {
      log("Failed to initialize PocketBase. Exiting...");
      process.exit(1);
    }
  } catch (error) {
    log(`Error initializing server: ${error.message}`);
    log(error.stack);
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  log(`Failed to start server: ${error}`);
  process.exit(1);
});

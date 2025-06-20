import fs from "fs";

// Create a write stream for logging
export const logStream = fs.createWriteStream("server.log", { flags: "a" });

// Simple console and file logger
export function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;

  // Log to console
  console.log(logMessage);

  // Log to file
  logStream.write(logMessage + "\n");
}

// For backward compatibility with existing code
export function logWithUI(message) {
  log(message.replace(/\n$/, "")); // Remove trailing newline if present
}

// utils/exportTrainingData.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exportProductsForAITraining } from "../services/productService.js";
import { initPocketBase } from "../pocketbase.js";
import { logWithUI } from "./logger.js";

// Get the directory name from the URL
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Export product data
 */
async function exportTrainingData() {
  try {
    console.log("Initializing PocketBase connection...");
    const pbInitialized = await initPocketBase();

    if (!pbInitialized) {
      console.error("Failed to initialize PocketBase. Exiting...");
      process.exit(1);
    }

    console.log("Exporting products...");
    const products = await exportProductsForAITraining();

    // Create directory if it doesn't exist
    const exportDir = path.join(__dirname, "..", "..", "training");
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Save the products data as JSON
    const filePath = path.join(exportDir, "products.json");
    fs.writeFileSync(filePath, JSON.stringify(products, null, 2), "utf8");

    console.log(`Products exported to ${filePath}`);
    console.log(`\nExported ${products.length} products`);

    process.exit(0);
  } catch (error) {
    console.error("Error exporting training data:", error);
    logWithUI(`Error exporting products: ${error.message}\n`);
    process.exit(1);
  }
}

// Run the export function
exportTrainingData();

// services/productService.js
import { pb } from "../pocketbase.js";
import { logWithUI } from "../utils/logger.js";

/**
 * Export products data for AI training
 * @returns {Promise<Array>} - List of products for training
 */
/**
 * Get all products from the database
 * @returns {Promise<Array>} - List of all products
 */
export async function getAllProducts() {
  try {
    logWithUI("Getting all products");

    const allProducts = [];
    let page = 1;
    const perPage = 100;
    let hasMore = true;

    while (hasMore) {
      const records = await pb.collection("products").getList(page, perPage);

      const products = records.items.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        unit: product.unit,
        price: product.price,
        description: product.description,
        keywords: product.keywords || [],
      }));

      allProducts.push(...products);

      hasMore = records.page < records.totalPages;
      page++;
    }

    logWithUI(`Retrieved ${allProducts.length} products`);
    return allProducts;
  } catch (error) {
    logWithUI(`Error getting all products: ${error.message}`);
    throw error;
  }
}

export async function exportProductsForAITraining() {
  try {
    logWithUI("Exporting products for AI training");

    const allProducts = [];
    let page = 1;
    const perPage = 100;
    let hasMore = true;

    while (hasMore) {
      const records = await pb.collection("products").getList(page, perPage);

      const simplifiedProducts = records.items.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        unit: product.unit,
        price: product.price,
        description: product.description,
        keywords: product.keywords || [],
      }));

      allProducts.push(...simplifiedProducts);

      hasMore = records.page < records.totalPages;
      page++;
    }

    logWithUI(`Exported ${allProducts.length} products for AI training`);
    return allProducts;
  } catch (error) {
    logWithUI(`Error exporting products for AI training: ${error.message}`);
    throw error;
  }
}

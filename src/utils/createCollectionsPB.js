// utils/createCollectionsPB.js
import PocketBase from "pocketbase";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// Check for command line arguments
const FORCE_RECREATE = process.argv.includes("--force");
const SKIP_PRODUCTS = process.argv.includes("--skip-products");

// Get the directory name from URL
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PocketBase settings
const POCKETBASE_URL = process.env.POCKETBASE_URL || "http://127.0.0.1:8090";
const POCKETBASE_ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const POCKETBASE_ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

// Sample product data from our migration
const sampleProducts = [
  // Băuturi
  {
    name: "Coca-Cola",
    sku: "BEV-001",
    category: "Băuturi Răcoritoare",
    price: 5.99,
    unit: "sticla",
    description: "Sticlă de plastic 0.5L Coca-Cola",
    keywords: ["suc", "răcoritoare", "cola", "coke"],
  },
  {
    name: "Pepsi",
    sku: "BEV-002",
    category: "Băuturi Răcoritoare",
    price: 5.49,
    unit: "sticla",
    description: "Sticlă de plastic 0.5L Pepsi",
    keywords: ["suc", "răcoritoare", "pepsi"],
  },
  {
    name: "Fanta Portocale",
    sku: "BEV-003",
    category: "Băuturi Răcoritoare",
    price: 4.99,
    unit: "sticla",
    description: "Sticlă de plastic 0.5L Fanta Portocale",
    keywords: ["suc", "răcoritoare", "portocale", "fanta"],
  },
  {
    name: "Sprite",
    sku: "BEV-004",
    category: "Băuturi Răcoritoare",
    price: 4.99,
    unit: "sticla",
    description: "Sticlă de plastic 0.5L Sprite",
    keywords: ["suc", "răcoritoare", "lămâie", "sprite"],
  },
  {
    name: "Apă Plată Dorna",
    sku: "BEV-005",
    category: "Apă",
    price: 3.49,
    unit: "sticla",
    description: "Sticlă de plastic 0.5L apă plată Dorna",
    keywords: ["apă", "apă plată", "dorna"],
  },
  {
    name: "Apă Minerală Dorna",
    sku: "BEV-006",
    category: "Apă",
    price: 3.99,
    unit: "sticla",
    description: "Sticlă de plastic 0.5L apă minerală Dorna",
    keywords: ["apă", "apă minerală", "dorna"],
  },
  {
    name: "Coca-Cola Doză",
    sku: "BEV-007",
    category: "Băuturi Răcoritoare",
    price: 4.49,
    unit: "doză",
    description: "Doză 330ml Coca-Cola",
    keywords: ["suc", "răcoritoare", "cola", "coke", "doză"],
  },
  {
    name: "Bere Heineken",
    sku: "BEV-008",
    category: "Băuturi Alcoolice",
    price: 6.99,
    unit: "sticlă",
    description: "Sticlă 330ml bere Heineken",
    keywords: ["bere", "alcool", "heineken"],
  },
  {
    name: "Bere Ursus",
    sku: "BEV-009",
    category: "Băuturi Alcoolice",
    price: 5.49,
    unit: "sticlă",
    description: "Sticlă 330ml bere Ursus",
    keywords: ["bere", "alcool", "ursus"],
  },
  {
    name: "Suc de Portocale",
    sku: "BEV-010",
    category: "Sucuri",
    price: 7.99,
    unit: "sticlă",
    description: "Sticlă 1L suc proaspăt de portocale",
    keywords: ["suc", "suc de portocale", "proaspăt"],
  },

  // Lactate
  {
    name: "Lapte Zuzu 1.5%",
    sku: "LAC-001",
    category: "Lactate",
    price: 8.9,
    unit: "cutie",
    description: "Cutie 1L lapte Zuzu 1.5% grăsime",
    keywords: ["lapte", "zuzu", "degresat"],
  },
  {
    name: "Brânză Telemea Hochland",
    sku: "LAC-002",
    category: "Lactate",
    price: 15.99,
    unit: "pachet",
    description: "Pachet 350g brânză telemea Hochland",
    keywords: ["brânză", "telemea", "hochland"],
  },
  {
    name: "Iaurt Activia",
    sku: "LAC-003",
    category: "Lactate",
    price: 2.49,
    unit: "bucată",
    description: "Iaurt Activia cu fructe 125g",
    keywords: ["iaurt", "activia", "fructe", "danone"],
  },

  // Pâine și Patiserie
  {
    name: "Pâine Albă Feliată",
    sku: "BRD-001",
    category: "Pâine și Patiserie",
    price: 6.9,
    unit: "pachet",
    description: "Pâine albă feliată 500g",
    keywords: ["pâine", "feliată", "albă"],
  },
  {
    name: "Covrigi cu Sare",
    sku: "BRD-002",
    category: "Pâine și Patiserie",
    price: 4.5,
    unit: "pachet",
    description: "Pachet covrigi cu sare 200g",
    keywords: ["covrigi", "sare", "patiserie"],
  },

  // Carne și Mezeluri
  {
    name: "Piept de Pui Dezosat",
    sku: "MEAT-001",
    category: "Carne și Mezeluri",
    price: 29.99,
    unit: "kg",
    description: "Piept de pui dezosat refrigerat",
    keywords: ["carne", "pui", "piept", "dezosat"],
  },
  {
    name: "Cârnați Oltenești",
    sku: "MEAT-002",
    category: "Carne și Mezeluri",
    price: 34.99,
    unit: "kg",
    description: "Cârnați oltenești afumați",
    keywords: ["cârnați", "oltenești", "afumați", "mezeluri"],
  },

  // Dulciuri și Snacks
  {
    name: "Ciocolată Rom Autentic",
    sku: "CHOC-001",
    category: "Dulciuri și Snacks",
    price: 3.99,
    unit: "bucată",
    description: "Ciocolată Rom Autentic 30g",
    keywords: ["ciocolată", "rom", "dulciuri"],
  },
  {
    name: "Eugenia Original",
    sku: "SNCK-001",
    category: "Dulciuri și Snacks",
    price: 2.49,
    unit: "pachet",
    description: "Biscuiți Eugenia Original 36g",
    keywords: ["biscuiți", "eugenia", "dulciuri"],
  },

  // Legume și Fructe
  {
    name: "Mere Gala",
    sku: "FRUT-001",
    category: "Legume și Fructe",
    price: 7.99,
    unit: "kg",
    description: "Mere Gala românești",
    keywords: ["mere", "gala", "fructe"],
  },
  {
    name: "Cartofi Noi",
    sku: "VEG-001",
    category: "Legume și Fructe",
    price: 5.99,
    unit: "kg",
    description: "Cartofi noi românești",
    keywords: ["cartofi", "noi", "legume"],
  },
];

const sampleClients = [
  {
    name: "S.C. MEGA IMAGE S.R.L.",
    vat: "RO12345678",
    phone: "0721123456",
    email: "comenzi@megaimage.ro",
  },
  {
    name: "S.C. CARREFOUR ROMANIA S.A.",
    vat: "RO23456789",
    phone: "0722234567",
    email: "orders@carrefour.ro",
  },
  {
    name: "S.C. AUCHAN ROMANIA S.A.",
    vat: "RO34567890",
    phone: "0723345678",
    email: "comenzi@auchan.ro",
  },
  {
    name: "S.C. KAUFLAND ROMANIA S.C.S.",
    vat: "RO45678901",
    phone: "0724456789",
    email: "orders@kaufland.ro",
  },
  {
    name: "S.C. LIDL DISCOUNT S.R.L.",
    vat: "RO56789012",
    phone: "0725567890",
    email: "comenzi@lidl.ro",
  },
  {
    name: "Restaurant Crama Domneasca",
    vat: "RO67890123",
    phone: "0726678901",
    email: "contact@cramadomneasca.ro",
  },
  {
    name: "Hotel Continental Bucuresti",
    vat: "RO78901234",
    phone: "0727789012",
    email: "procurement@continental.ro",
  },
  {
    name: "S.C. METRO CASH & CARRY ROMANIA S.R.L.",
    vat: "RO89012345",
    phone: "0728890123",
    email: "orders@metro.ro",
  },
  {
    name: "Pensiunea Casa Veche",
    vat: "RO90123456",
    phone: "0729901234",
    email: "rezervari@casaveche.ro",
  },
  {
    name: "S.C. SELGROS CASH & CARRY S.R.L.",
    vat: "RO01234567",
    phone: "0730012345",
    email: "comenzi@selgros.ro",
  },
];

/**
 * Setup collections using PocketBase SDK
 */
async function setup() {
  console.log(
    `Setting up DLiver-Bot collections in PocketBase at: ${POCKETBASE_URL}`,
  );

  try {
    // Create PocketBase client
    const pb = new PocketBase(POCKETBASE_URL);

    // Authenticate admin
    console.log("Authenticating admin...");
    if (!POCKETBASE_ADMIN_EMAIL || !POCKETBASE_ADMIN_PASSWORD) {
      console.error("❌ Admin credentials missing in .env file!");
      process.exit(1);
    }

    try {
      await pb
        .collection("_superusers")
        .authWithPassword(POCKETBASE_ADMIN_EMAIL, POCKETBASE_ADMIN_PASSWORD);
    } catch (error) {
      console.error("❌ Admin authentication failed:", error);
      process.exit(1);
    }
    console.log("✅ Authentication successful!");

    // Get existing collections for checking
    const collections = await pb.collections.getFullList();
    const collectionNames = collections.map((c) => c.name);
    console.log("Existing collections:", collectionNames.join(", "));

    // Create clients collection if not exists or force recreate
    if (FORCE_RECREATE || !collectionNames.includes("clients")) {
      try {
        if (collectionNames.includes("clients") && FORCE_RECREATE) {
          console.log("Deleting existing clients collection...");
          const clientsCollection = collections.find(
            (c) => c.name === "clients",
          );
          if (clientsCollection) {
            await pb.collections.delete(clientsCollection.id);
          }
        }

        console.log("Creating clients collection...");
        await pb.collections.create({
          name: "clients",
          type: "base",
          fields: [
            {
              name: "name",
              type: "text",
              required: true,
            },
            {
              name: "vat",
              type: "text",
              required: true,
              unique: true,
            },
            {
              name: "phone",
              type: "text",
              required: false,
              unique: true,
            },
            {
              name: "email",
              type: "email",
              required: false,
            },
          ],
        });
        console.log("✅ Clients collection created!");
      } catch (error) {
        console.error("❌ Failed to create clients collection:", error);
        if (error.response?.data) {
          console.error(
            "Error details:",
            JSON.stringify(error.response.data, null, 2),
          );
        }
      }
    }

    // Create products collection if not exists or force recreate
    if (FORCE_RECREATE || !collectionNames.includes("products")) {
      try {
        if (collectionNames.includes("products") && FORCE_RECREATE) {
          console.log("Deleting existing products collection...");
          const productsCollection = collections.find(
            (c) => c.name === "products",
          );
          if (productsCollection) {
            await pb.collections.delete(productsCollection.id);
          }
        }

        console.log("Creating products collection...");
        await pb.collections.create({
          name: "products",
          type: "base",
          fields: [
            {
              name: "name",
              type: "text",
              required: true,
            },
            {
              name: "sku",
              type: "text",
              required: true,
              unique: true,
            },
            {
              name: "category",
              type: "text",
              required: false,
            },
            {
              name: "price",
              type: "number",
              required: true,
              min: 0,
            },
            {
              name: "unit",
              type: "text",
              required: false,
            },
            {
              name: "description",
              type: "text",
              required: false,
            },
            {
              name: "keywords",
              type: "json",
              required: false,
            },
          ],
        });
        console.log("✅ Products collection created!");
      } catch (error) {
        console.error("❌ Failed to create products collection:", error);
        if (error.response?.data) {
          console.error(
            "Error details:",
            JSON.stringify(error.response.data, null, 2),
          );
        }
      }
    }

    // Get updated collections list for relation fields
    let updatedCollections = await pb.collections.getFullList();
    const updatedCollectionNames = updatedCollections.map((c) => c.name);
    let clientsCollection = updatedCollections.find(
      (c) => c.name === "clients",
    );

    if (!clientsCollection) {
      console.error(
        "❌ Clients collection not found but required for relations!",
      );
      process.exit(1);
    }

    console.log(`Found clients collection with ID: ${clientsCollection.id}`);

    // Create userSessions collection if not exists or force recreate
    if (FORCE_RECREATE || !updatedCollectionNames.includes("userSessions")) {
      try {
        if (updatedCollectionNames.includes("userSessions") && FORCE_RECREATE) {
          console.log("Deleting existing userSessions collection...");
          const userSessionsCollection = updatedCollections.find(
            (c) => c.name === "userSessions",
          );
          if (userSessionsCollection) {
            await pb.collections.delete(userSessionsCollection.id);
          }
        }

        console.log("Creating userSessions collection...");
        const userSessionsCollection = await pb.collections.create({
          name: "userSessions",
          type: "base",
          fields: [
            {
              name: "userKey",
              type: "text",
              required: true,
              unique: true,
            },
            {
              name: "phone",
              type: "text",
              required: true,
            },
            {
              name: "platform",
              type: "text",
              required: true,
            },
            {
              name: "state",
              type: "text",
              required: true,
            },
            {
              name: "order",
              type: "text",
              required: false,
            },
            {
              name: "lastActivity",
              type: "date",
              required: true,
            },
            {
              name: "reminderSent",
              type: "bool",
              required: false,
            },
            {
              name: "client",
              type: "relation",
              required: false,
              collectionId: clientsCollection.id,
              cascadeDelete: false,
              maxSelect: 1,
              displayFields: ["name", "vat"],
            },
          ],
        });
        console.log("✅ UserSessions collection created!");
        console.log(`UserSessions collection ID: ${userSessionsCollection.id}`);
      } catch (error) {
        console.error("❌ Failed to create userSessions collection:", error);
        if (error.response?.data) {
          console.error(
            "Error details:",
            JSON.stringify(error.response.data, null, 2),
          );
        }
      }
    }

    // Refresh collections list before creating orders
    updatedCollections = await pb.collections.getFullList();
    clientsCollection = updatedCollections.find((c) => c.name === "clients");

    if (!clientsCollection) {
      console.error("❌ Clients collection not found for orders relation!");
      process.exit(1);
    }

    // Create orders collection if not exists or force recreate
    const finalUpdatedCollectionNames = updatedCollections.map((c) => c.name);
    if (FORCE_RECREATE || !finalUpdatedCollectionNames.includes("orders")) {
      try {
        if (finalUpdatedCollectionNames.includes("orders") && FORCE_RECREATE) {
          console.log("Deleting existing orders collection...");
          const ordersCollection = updatedCollections.find(
            (c) => c.name === "orders",
          );
          if (ordersCollection) {
            await pb.collections.delete(ordersCollection.id);
          }
        }

        console.log("Creating orders collection...");
        console.log(`Using clients collection ID: ${clientsCollection.id}`);
        const ordersCollection = await pb.collections.create({
          name: "orders",
          type: "base",
          fields: [
            {
              name: "orderText",
              type: "text",
              required: true,
            },
            {
              name: "client",
              type: "relation",
              required: true,
              collectionId: clientsCollection.id,
              cascadeDelete: false,
              maxSelect: 1,
              displayFields: ["name", "vat"],
            },
            {
              name: "platform",
              type: "text",
              required: true,
            },
            {
              name: "status",
              type: "select",
              required: true,
              maxSelect: 1,
              values: [
                "pending",
                "confirmed",
                "processing",
                "completed",
                "cancelled",
              ],
            },
            {
              name: "items",
              type: "json",
              required: false,
            },
            {
              name: "total",
              type: "number",
              required: false,
              min: 0,
            },
          ],
        });
        console.log("✅ Orders collection created!");
        console.log(`Orders collection ID: ${ordersCollection.id}`);
      } catch (error) {
        console.error("❌ Failed to create orders collection:", error);
        if (error.response?.data) {
          console.error(
            "Error details:",
            JSON.stringify(error.response.data, null, 2),
          );
        }
      }
    }

    // Add sample products if not skipped
    if (!SKIP_PRODUCTS) {
      console.log("\nAdding sample products data...");

      // Get the products collection
      const productsCollection =
        updatedCollections.find((c) => c.name === "products") ||
        (await pb.collections.getFullList()).find((c) => c.name === "products");

      if (!productsCollection) {
        console.error(
          "❌ Products collection not found - cannot add sample data!",
        );
      } else {
        let createdCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const product of sampleProducts) {
          try {
            // Check if product with same SKU already exists
            const existing = await pb.collection("products").getList(1, 1, {
              filter: `sku = "${product.sku}"`,
            });

            if (existing.items.length > 0) {
              console.log(
                `ℹ️ Product with SKU ${product.sku} already exists, skipping`,
              );
              skipCount++;
            } else {
              await pb.collection("products").create(product);
              console.log(
                `✅ Created product: ${product.name} (${product.sku})`,
              );
              createdCount++;
            }
          } catch (error) {
            console.error(
              `❌ Failed to create product ${product.name}:`,
              error,
            );
            errorCount++;
          }
        }

        console.log(`\nProduct creation summary:`);
        console.log(`- Created: ${createdCount}`);
        console.log(`- Skipped (already exist): ${skipCount}`);
        console.log(`- Failed: ${errorCount}`);
      }
    } else {
      console.log("Skipping product creation (--skip-products flag detected)");
    }

    // Add sample clients
    console.log("\nAdding sample clients data...");

    // Get the clients collection
    const clientsCollectionForData =
      updatedCollections.find((c) => c.name === "clients") ||
      (await pb.collections.getFullList()).find((c) => c.name === "clients");

    if (!clientsCollectionForData) {
      console.error(
        "❌ Clients collection not found - cannot add sample data!",
      );
    } else {
      let createdClientCount = 0;
      let skipClientCount = 0;
      let errorClientCount = 0;

      for (const client of sampleClients) {
        try {
          // Check if client with same VAT already exists
          const existing = await pb.collection("clients").getList(1, 1, {
            filter: `vat = "${client.vat}"`,
          });

          if (existing.items.length > 0) {
            console.log(
              `ℹ️ Client with VAT ${client.vat} already exists, skipping`,
            );
            skipClientCount++;
          } else {
            await pb.collection("clients").create(client);
            console.log(`✅ Created client: ${client.name} (${client.vat})`);
            createdClientCount++;
          }
        } catch (error) {
          console.error(`❌ Failed to create client ${client.name}:`, error);
          errorClientCount++;
        }
      }

      console.log(`\nClient creation summary:`);
      console.log(`- Created: ${createdClientCount}`);
      console.log(`- Skipped (already exist): ${skipClientCount}`);
      console.log(`- Failed: ${errorClientCount}`);
    }

    console.log("\n✅ Setup complete! Your DLiver-Bot collections are ready.");
    console.log(
      "Now you can run 'npm run export-training' to prepare data for the AI model.",
    );
  } catch (error) {
    console.error("❌ Setup failed with error:", error);
    process.exit(1);
  }
}

// Run the setup
setup();

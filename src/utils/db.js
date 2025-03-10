import mariadb from "mariadb";
import dotenv from "dotenv";
import { logStream } from "../server.js";
dotenv.config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;


if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  logStream.write("Missing required environment variables for database connection.\n");
  process.exit(1);
}

const dbPromise = mariadb.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  connectionLimit: 5,
});

dbPromise.on("error", (err) => {
  logStream.write(`Database pool error: ${err}\n`);
  process.exit(1);
});

export default dbPromise;
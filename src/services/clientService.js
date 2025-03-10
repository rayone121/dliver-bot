// services/clientService.js
import dbPromise from "../utils/db.js";
import { logStream } from "../server.js";

export async function getUser(phone) {
    const conn = await dbPromise.getConnection();
    try {
      const response = await conn.query(
        "SELECT vat FROM clients WHERE phone LIKE ?", [`%${phone}%`]
      );
      return response[0] !== undefined;
    } catch (error) {
      logStream.write(`Database error: ${error}\n`);
      throw error;
    } finally {
        if (conn) conn.release();
    }
  }


export async function checkVatNumber(vatNumber) {
  const conn = await dbPromise.getConnection();
  try {
    logStream.write(`Checking VAT number: ${vatNumber}\n`);
    const [response] = await conn.query("SELECT * FROM clients WHERE vat LIKE ?", [`%${vatNumber}%`]);
    return Object.keys(response).length > 0 ? response : {};
  } catch (error) {
    logStream.write(`Database error: ${error}\n`);
    throw error;
  } finally {
    if (conn) conn.release();
  }
}

export async function updatePhone(phone, vat) {
  const conn = await dbPromise.getConnection();
  try {
    logStream.write(`Updating phone number: ${phone} for VAT: ${vat}\n`);
    await conn.query("UPDATE clients SET phone = ? WHERE vat LIKE ?", [phone, `%${vat}%`]);
  } catch (error) {
    logStream.write(`Database error: ${error}\n`);
    throw error;
  } finally {
    if (conn) conn.release();
  }
}

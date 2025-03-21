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
    return response ? response : {};
  } catch (error) {
    logStream.write(`Database error: ${error}\n`);
    throw error;
  } finally {
    if (conn) conn.release();
  }
}

export async function getClientName(vatNumber) {
  const conn = await dbPromise.getConnection();
  try {
    logStream.write(`Getting client name for VAT: ${vatNumber}\n`);
    const [response] = await conn.query("SELECT name FROM clients WHERE vat LIKE ?", [`%${vatNumber}%`]);
    return response.name;
  }
  catch (error) {
    logStream.write(`Database error: ${error}\n`);
    throw error;
  } finally {
    if (conn) conn.release();
  }
}

export async function getClientNameByPhone(phone) {
  const conn = await dbPromise.getConnection();
  try {
    logStream.write(`Getting client name for phone: ${phone}\n`);
    const [response] = await conn.query("SELECT name FROM clients WHERE phone LIKE ?", [`%${phone}%`]);
    return response.name;
  }
  catch (error) {
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

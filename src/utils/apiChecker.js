// utils/apiChecker.js
import apiClient from './axiosInstance.js';
import { logStream } from '../server.js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export async function checkWAPPConn() {
  try {
    const response = await apiClient.get('/me');
    logStream.write(`Response from WhatsApp API Status code : ${JSON.stringify(response.status)}\n`);
    return response;
  } catch (error) {
    logStream.write(`Error from WhatsApp API: ${JSON.stringify(error)}\n`);
    return error;
  }
}

/*
export async function checkSMSConn() {
  try {
    const response = await axios.post('http://localhost:3000/sms', {
      from: '40774463442',
      text: 'Test message',
      sentStamp: new Date().toISOString()
    }, {
      headers: {
        'x-verify-key': process.env.SMS_VERIFY_TOKEN
      }
    });

    return response;
  } catch (error) {
    logStream.write(`Error from SMS API: ${JSON.stringify(error)}\n`);
    return error;
  }
}
*/
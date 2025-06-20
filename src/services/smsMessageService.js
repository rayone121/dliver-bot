// services/adbSmsService.js
import { MessageServiceInterface } from "./messageServiceInterface.js";
import { exec } from "child_process";
import util from "util";
import { logWithUI } from "../utils/logger.js";

const execPromise = util.promisify(exec);

export class AdbSmsService extends MessageServiceInterface {
  constructor() {
    super();
    this.deviceIp = process.env.ADB_DEVICE_IP; // e.g., 192.168.1.100:5555
  }

  async sendMessage(phoneNumber, message) {
    try {
      await this.verifyDeviceConnection();

      const formattedPhone = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+${phoneNumber}`;
      const escapedMessage = message
        .replace(/\\/g, "\\\\")
        .replace(/ /g, "\\ ")
        .replace(/"/g, '\\"')
        .replace(/'/g, "\\'")
        .replace(/&/g, "\\&")
        .replace(/\$/g, "\\$")
        .replace(/`/g, "\\`")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)")
        .replace(/\n/g, "\\ ")
        .replace(/\r/g, "");

      const command = `adb shell am startservice --user 0 -n com.android.shellms/.sendSMS -e contact "${formattedPhone}" -e msg "${escapedMessage}"`;
      logWithUI(`Executing command: ${command}`);

      const { stdout, stderr } = await execPromise(command);
      if (stderr) logWithUI(`Error: ${stderr}`);
      return stdout;
    } catch (error) {
      logWithUI(`Error sending SMS via ADB: ${error}\n`);
      throw new Error("Failed to send SMS via ADB");
    }
  }

  async verifyDeviceConnection() {
    try {
      const { stdout } = await execPromise(`adb devices`);
      const match = stdout.match(
        /([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+:\d+)\s+device/,
      );

      this.deviceIp = this.deviceIp || (match && match[1]);
      if (!this.deviceIp || !stdout.includes(this.deviceIp)) {
        throw new Error(`Device ${this.deviceIp || "unknown"} not connected`);
      }
    } catch (error) {
      throw new Error("ADB device verification failed");
    }
  }
}

export const adbSmsService = new AdbSmsService();

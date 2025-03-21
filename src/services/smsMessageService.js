// services/adbSmsService.js
import { MessageServiceInterface} from './messageServiceInterface.js';
import { exec } from 'child_process';
import util from 'util';
import { logStream } from '../server.js';


const execPromise = util.promisify(exec);

export class AdbSmsService extends MessageServiceInterface {
  constructor() {
    super();
    this.deviceIp = process.env.ADB_DEVICE_IP; // e.g., 192.168.1.100:5555
  }

  async sendMessage(phoneNumber, message) {
    try {
      logStream.write('Verifying device connection...\n');
      await this.verifyDeviceConnection();
      logStream.write('Device connection verified\n');  
  
      const formattedMessage = message.replace(/"/g, '\\"');
      logStream.write(`formatted message: ${formattedMessage}\n`);
      const { stdout, stderr } = await execPromise(`
       adb shell service call isms 7 i32 0 s16 "com.android.mms.service" s16 "${phoneNumber}" s16 null s16 '"${formattedMessage}"' s16 null s16 null
    `);
  
      if (stderr) {
        logStream.write(`Error sending SMS via ADB: ${stderr}\n`);
        throw new Error(stderr);
      }
      logStream.write(`SMS sent via ADB: ${stdout}\n`);
      return stdout;
    } catch (error) {
      logStream.write(`Error sending SMS via ADB: ${error}\n`);
      throw new Error('Failed to send SMS via ADB');
    }
  }

  async verifyDeviceConnection() {
    try {
      const { stdout } = await execPromise(`adb -s ${this.deviceIp} devices`);
      if (!stdout.includes(this.deviceIp)) {
        throw new Error('Device not connected');
      }
    } catch (error) {
      throw new Error('ADB device verification failed');
    }
  }
}

export const adbSmsService = new AdbSmsService();
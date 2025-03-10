import dotenv from 'dotenv';
import app from './app.js';
import fs from 'fs';
import { checkWAPPConn} from './utils/apiChecker.js';
import { screen, statusBar, uptimeBox, requestBox, logBox, whatsappStatus, smsStatus } from './ui.js';


dotenv.config();
const PORT = process.env.PORT || 3000;

// Middleware to log incoming requests
app.use((req, res, next) => {
  const logMessage = `${new Date().toISOString()} - ${req.method} ${req.url}`;
  requestBox.log(logMessage);
  screen.render();
  next();
});

// Server setup
const server = app.listen(PORT, () => {
  statusBar.setContent(`Status: Server running on port ${PORT}`);
  statusBar.style.bg = 'green';
  screen.render();
});

// Uptime counter
let uptime = 0;
setInterval(() => {
  uptime++;
  uptimeBox.setContent(`Uptime: ${uptime}s`);
  screen.render();
}, 1000);

export const logStream = fs.createWriteStream('server.log', { flags: 'a' });

const originalWrite = logStream.write;

logStream.write = function (chunk, encoding, callback) {
  logBox.log(chunk.toString());
  screen.render();
  return originalWrite.call(logStream, chunk, encoding, callback);
};

const checkAPIStatus = async () => {
  const status = await checkWAPPConn();
  if (status.status === 200) {
    whatsappStatus.setContent('WApp API Webhook: Online');
    whatsappStatus.style.bg = 'green'; 
  } else if (status.status) {
    whatsappStatus.setContent('WApp API Webhook: Offline');
    whatsappStatus.style.bg = 'red';
  }
  screen.render();
};

const checkSMSStatus = async () => {
  //const status = await checkSMSConn(); // Call the correct function here
  if (true) {
    smsStatus.setContent('SMS API Webhook: Online');
    smsStatus.style.bg = 'green';
  } else {
    smsStatus.setContent('SMS API Webhook: Offline');
    smsStatus.style.bg = 'red';
  }
  screen.render();
};

checkAPIStatus(); // Initial check
checkSMSStatus(); // Initial check

// Graceful shutdown
const shutdown = () => {
  server.close(() => {
    process.exit(0);
  });
};

screen.key(['escape', 'q'], () => shutdown());
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start rendering
screen.render();
import blessed from 'blessed';

const screen = blessed.screen({
  smartCSR: true,
  title: 'Server Dashboard',
  dockBorders: true,
});

const statusBar = blessed.box({
  bottom: 0,
  left: 0,
  width: '100%',
  height: 1,
  content: 'Status: Starting...',
  style: { fg: 'white', bg: 'blue' },
});

const uptimeBox = blessed.box({
  top: 1,
  left: 0,
  width: '30%',
  height: 3,
  content: 'Uptime: 0s',
  border: { type: 'line' },
  style: { fg: 'green' },
});

const requestBox = blessed.log({
  top: 1,
  left: '30%+1',
  width: '70%-1',
  height: 10,
  border: { type: 'line' },
  scrollable: true,
  label: 'Incoming Requests',
});

const logBox = blessed.log({
  top: 12,
  left: 0,
  width: '100%',
  height: '50%',
  border: { type: 'line' },
  scrollable: true,
  label: `Log File: ${process.cwd()}/server.log`,
});

const whatsappStatus = blessed.box({
  top: 4,
  left: 0,
  width: '30%',
  height: 3,
  content: 'WhatsApp API Webhook: Checking...',
  border: { type: 'line' },
  style: { fg: 'yellow' },
});

const smsStatus = blessed.box({
  top: 7,
  left: 0,
  width: '30%',
  height: 3,
  content: 'SMS API Webhook: Checking...',
  border: { type: 'line' },
  style: { fg: 'yellow' },
})

// Append elements to screen
screen.append(statusBar);
screen.append(uptimeBox);
screen.append(requestBox);
screen.append(logBox);
screen.append(whatsappStatus);
screen.append(smsStatus);

export { screen, statusBar, uptimeBox, requestBox, logBox, whatsappStatus, smsStatus };
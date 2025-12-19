import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { SignalingClient } from './signaling';
import { InputController } from './input';
import { OSCSender } from './osc';
import { generateQRCode } from './qr';

let mainWindow: BrowserWindow | null = null;
let signalingClient: SignalingClient | null = null;
let inputController: InputController | null = null;
let oscSender: OSCSender | null = null;

const SIGNALING_URL = process.env.SIGNALING_URL || 'http://localhost:3001';
const WEB_REMOTE_URL = process.env.WEB_REMOTE_URL || 'http://localhost:5173';

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    minWidth: 350,
    minHeight: 500,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#1a1a2e',
  });

  // Load the renderer
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5200');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function initializeServices() {
  // Initialize input controller
  try {
    inputController = new InputController();
  } catch (err) {
    console.error('Failed to initialize input controller:', err);
  }

  // Initialize OSC sender
  try {
    oscSender = new OSCSender('127.0.0.1', 9000);
  } catch (err) {
    console.error('Failed to initialize OSC sender:', err);
  }

  // Initialize signaling client
  signalingClient = new SignalingClient(SIGNALING_URL);

  // Wait for connection
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Create a room
  try {
    const roomCode = await signalingClient.createRoom();
    console.log('Room created:', roomCode);

    // Generate QR code
    const remoteUrl = `${WEB_REMOTE_URL}/${roomCode}`;
    const qrDataUrl = await generateQRCode(remoteUrl);

    // Store room data
    currentRoomData = { roomCode, qrDataUrl, remoteUrl };

    // Send to renderer
    mainWindow?.webContents.send('room-created', currentRoomData);

    // Listen for messages relayed through signaling server
    signalingClient.onMessage((message: any) => {
      handleRemoteMessage(message);
    });

    // Handle connection state changes
    signalingClient.onClientJoined(() => {
      console.log('Client connected!');
      mainWindow?.webContents.send('connection-state', 'connected');
    });

  } catch (err) {
    console.error('Failed to create room:', err);
  }
}

function handleRemoteMessage(message: any) {
  if (!inputController) return;

  try {
    switch (message.type) {
      case 'mouse_move':
        inputController.moveMouse(message.dx, message.dy);
        break;

      case 'click':
        inputController.click(message.button);
        break;

      case 'mouse_down':
        inputController.mouseDown(message.button);
        break;

      case 'mouse_up':
        inputController.mouseUp(message.button);
        break;

      case 'scroll':
        inputController.scroll(message.dx, message.dy);
        break;

      case 'gyro':
        inputController.moveMouse(message.dx, message.dy);
        break;

      case 'key':
        inputController.pressKey(message.key);
        break;

      case 'text':
        inputController.typeText(message.text);
        break;

      case 'navigate':
        inputController.navigate(message.direction);
        break;

      case 'media':
        oscSender?.sendMedia(message.action);
        break;

      case 'osc':
        oscSender?.sendTrigger(message.trigger);
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  } catch (err) {
    console.error('Error handling message:', err);
  }
}

// Store current room data
let currentRoomData: { roomCode: string; qrDataUrl: string; remoteUrl: string } | null = null;

// IPC handlers
ipcMain.handle('get-room-data', () => {
  return currentRoomData;
});

ipcMain.handle('get-settings', () => {
  return {
    oscHost: oscSender?.host || '127.0.0.1',
    oscPort: oscSender?.port || 9000,
  };
});

ipcMain.handle('update-osc-settings', (_: any, settings: { host: string; port: number }) => {
  if (oscSender) {
    oscSender.updateSettings(settings.host, settings.port);
  }
  return true;
});

ipcMain.handle('regenerate-room', async () => {
  if (signalingClient) {
    const roomCode = await signalingClient.createRoom();
    const remoteUrl = `${WEB_REMOTE_URL}/${roomCode}`;
    const qrDataUrl = await generateQRCode(remoteUrl);

    currentRoomData = { roomCode, qrDataUrl, remoteUrl };
    return currentRoomData;
  }
  return null;
});

// App lifecycle
app.whenReady().then(async () => {
  await createWindow();
  await initializeServices();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  signalingClient?.disconnect();
});

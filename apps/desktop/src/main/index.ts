import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { EmbeddedSignalingServer } from './embedded-server';
import { TunnelManager } from './tunnel';
import { InputController } from './input';
import { OSCSender } from './osc';
import { generateQRCode } from './qr';

// Safe logging to prevent EPIPE errors when stdout is closed
function safeLog(...args: any[]) {
  try {
    console.log(...args);
  } catch {
    // Ignore write errors to closed pipes
  }
}

function safeError(...args: any[]) {
  try {
    console.error(...args);
  } catch {
    // Ignore write errors to closed pipes
  }
}

let mainWindow: BrowserWindow | null = null;
let embeddedServer: EmbeddedSignalingServer | null = null;
let tunnelManager: TunnelManager | null = null;
let inputController: InputController | null = null;
let oscSender: OSCSender | null = null;

const WEB_REMOTE_URL = process.env.WEB_REMOTE_URL || 'https://experience-remote.vercel.app';
const LOCAL_PORT = 3001;

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
  // In development, use the Vite dev server; in production, use the built files
  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5200');
    mainWindow.webContents.openDevTools();
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
    safeError('Failed to initialize input controller:', err);
  }

  // Initialize OSC sender
  try {
    oscSender = new OSCSender('127.0.0.1', 9000);
  } catch (err) {
    safeError('Failed to initialize OSC sender:', err);
  }

  // Initialize embedded signaling server
  embeddedServer = new EmbeddedSignalingServer(LOCAL_PORT);

  try {
    await embeddedServer.start();
    safeLog('Embedded signaling server started');
  } catch (err) {
    safeError('Failed to start embedded server:', err);
    return;
  }

  // Initialize tunnel
  tunnelManager = new TunnelManager();

  try {
    const tunnelUrl = await tunnelManager.connect(LOCAL_PORT);
    safeLog('Tunnel connected:', tunnelUrl);

    // Create room and generate QR code
    await createRoomAndQR(tunnelUrl);

    // Handle tunnel URL changes (reconnection)
    tunnelManager.onUrlChanged(async (newUrl) => {
      safeLog('Tunnel URL changed:', newUrl);
      await createRoomAndQR(newUrl);
    });

  } catch (err) {
    safeError('Failed to create tunnel:', err);
    // Fall back to local-only mode
    safeLog('Running in local-only mode');
    await createRoomAndQR(`http://localhost:${LOCAL_PORT}`);
  }

  // Listen for messages from connected clients
  embeddedServer.onMessage((message: any) => {
    handleRemoteMessage(message);
  });

  // Handle connection state changes
  embeddedServer.onClientJoined(() => {
    safeLog('Client connected!');
    mainWindow?.webContents.send('connection-state', 'connected');
  });

  embeddedServer.onClientDisconnected(() => {
    safeLog('Client disconnected');
    mainWindow?.webContents.send('connection-state', 'disconnected');
  });
}

async function createRoomAndQR(serverUrl: string) {
  if (!embeddedServer) return;

  const roomCode = embeddedServer.createRoom();
  safeLog('Room created:', roomCode);

  // Generate QR code with server URL and room code as query params
  const remoteUrl = `${WEB_REMOTE_URL}?server=${encodeURIComponent(serverUrl)}&room=${roomCode}`;
  const qrDataUrl = await generateQRCode(remoteUrl);

  // Store room data
  currentRoomData = { roomCode, qrDataUrl, remoteUrl, serverUrl };

  // Send to renderer
  mainWindow?.webContents.send('room-created', currentRoomData);
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
        safeLog('Unknown message type:', message.type);
    }
  } catch (err) {
    safeError('Error handling message:', err);
  }
}

// Store current room data
let currentRoomData: { roomCode: string; qrDataUrl: string; remoteUrl: string; serverUrl: string } | null = null;

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
  if (embeddedServer && tunnelManager) {
    const serverUrl = tunnelManager.getUrl() || `http://localhost:${LOCAL_PORT}`;
    await createRoomAndQR(serverUrl);
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
  tunnelManager?.disconnect();
  embeddedServer?.stop();
});

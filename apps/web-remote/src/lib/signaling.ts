import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let currentServerUrl: string | null = null;

function getSignalingUrl(): string {
  // Check query parameters first
  const params = new URLSearchParams(window.location.search);
  const serverUrl = params.get('server');
  if (serverUrl) {
    return serverUrl;
  }
  // Fall back to environment variable or localhost
  return import.meta.env.VITE_SIGNALING_URL || 'http://localhost:3001';
}

export function getSocket(serverUrl?: string): Socket {
  const url = serverUrl || getSignalingUrl();

  // If URL changed or socket doesn't exist, create new socket
  if (!socket || currentServerUrl !== url) {
    if (socket) {
      socket.disconnect();
    }
    currentServerUrl = url;
    socket = io(url, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectSocket(): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = getSocket();

    if (s.connected) {
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      reject(new Error('Connection timeout'));
    }, 10000);

    s.once('connect', () => {
      clearTimeout(timeout);
      resolve();
    });

    s.once('connect_error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    s.connect();
  });
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentServerUrl = null;
  }
}

export function getRoomCodeFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const roomFromQuery = params.get('room');
  if (roomFromQuery) {
    return roomFromQuery;
  }
  // Fall back to path-based room code
  const path = window.location.pathname;
  const match = path.match(/^\/([A-Z0-9]{6})$/i);
  return match ? match[1].toUpperCase() : null;
}

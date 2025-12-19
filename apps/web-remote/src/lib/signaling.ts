import { io, Socket } from 'socket.io-client';

const SIGNALING_SERVER_URL =
  import.meta.env.VITE_SIGNALING_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SIGNALING_SERVER_URL, {
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
  }
}

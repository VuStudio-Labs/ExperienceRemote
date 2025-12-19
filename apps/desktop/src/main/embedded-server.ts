import express from 'express';
import { createServer, Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

interface Room {
  code: string;
  hostSocketId: string;
  clientSocketId: string | null;
  createdAt: number;
}

// Generate a 6-character room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export class EmbeddedSignalingServer {
  private app: express.Application;
  private server: HttpServer;
  private io: Server;
  private port: number;
  private room: Room | null = null;
  private clientJoinedCallback: (() => void) | null = null;
  private messageCallback: ((message: any) => void) | null = null;
  private clientDisconnectedCallback: (() => void) | null = null;

  constructor(port: number = 3001) {
    this.port = port;
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.setupRoutes();
    this.setupSocketHandlers();
  }

  private setupRoutes(): void {
    this.app.use(express.json());

    // Health check
    this.app.get('/', (_req, res) => {
      res.json({ status: 'ok', service: 'experience-remote-embedded' });
    });

    this.app.get('/health', (_req, res) => {
      res.json({ status: 'healthy' });
    });
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Phone app joins the room
      socket.on('join-room', (roomCode: string, callback: (result: { success: boolean; error?: string; roomCode?: string }) => void) => {
        if (!this.room) {
          callback({ success: false, error: 'No room available' });
          return;
        }

        if (roomCode.toUpperCase() !== this.room.code) {
          callback({ success: false, error: 'Room not found' });
          return;
        }

        if (this.room.clientSocketId) {
          callback({ success: false, error: 'Room already has a client' });
          return;
        }

        this.room.clientSocketId = socket.id;
        socket.join(this.room.code);
        callback({ success: true, roomCode: this.room.code });

        console.log(`Client ${socket.id} joined room ${this.room.code}`);
        this.clientJoinedCallback?.();
      });

      // Message relay from phone to desktop
      socket.on('remote-message', (message: any) => {
        if (!this.room) return;
        if (socket.id === this.room.clientSocketId) {
          this.messageCallback?.(message);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        if (this.room && socket.id === this.room.clientSocketId) {
          this.room.clientSocketId = null;
          this.clientDisconnectedCallback?.();
        }
      });
    });
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server.listen(this.port, () => {
          console.log(`Embedded signaling server running on port ${this.port}`);
          resolve();
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  stop(): void {
    this.io.close();
    this.server.close();
  }

  createRoom(): string {
    const code = generateRoomCode();
    this.room = {
      code,
      hostSocketId: 'embedded-host',
      clientSocketId: null,
      createdAt: Date.now(),
    };
    console.log(`Room created: ${code}`);
    return code;
  }

  getRoomCode(): string | null {
    return this.room?.code || null;
  }

  onClientJoined(callback: () => void): void {
    this.clientJoinedCallback = callback;
  }

  onMessage(callback: (message: any) => void): void {
    this.messageCallback = callback;
  }

  onClientDisconnected(callback: () => void): void {
    this.clientDisconnectedCallback = callback;
  }

  getPort(): number {
    return this.port;
  }
}

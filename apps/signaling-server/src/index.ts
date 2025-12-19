import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
  createRoom,
  joinRoom,
  getRoom,
  getRoomBySocketId,
  removeSocketFromRoom,
} from './rooms.js';

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'experience-remote-signaling' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Desktop app creates a room
  socket.on('create-room', (callback) => {
    const room = createRoom(socket.id);
    socket.join(room.code);
    callback({ success: true, roomCode: room.code });
  });

  // Phone app joins a room
  socket.on('join-room', (roomCode: string, callback) => {
    const room = joinRoom(roomCode, socket.id);

    if (!room) {
      callback({ success: false, error: 'Room not found or expired' });
      return;
    }

    socket.join(room.code);
    callback({ success: true, roomCode: room.code });

    // Notify the host that a client joined
    socket.to(room.hostSocketId).emit('client-joined', { socketId: socket.id });
  });

  // WebRTC signaling: offer
  socket.on('offer', (data: { sdp: string }) => {
    const room = getRoomBySocketId(socket.id);
    if (!room) return;

    // Forward offer to the other peer
    const targetId =
      room.hostSocketId === socket.id
        ? room.clientSocketId
        : room.hostSocketId;

    if (targetId) {
      io.to(targetId).emit('offer', { sdp: data.sdp, from: socket.id });
    }
  });

  // WebRTC signaling: answer
  socket.on('answer', (data: { sdp: string }) => {
    const room = getRoomBySocketId(socket.id);
    if (!room) return;

    const targetId =
      room.hostSocketId === socket.id
        ? room.clientSocketId
        : room.hostSocketId;

    if (targetId) {
      io.to(targetId).emit('answer', { sdp: data.sdp, from: socket.id });
    }
  });

  // WebRTC signaling: ICE candidate
  socket.on(
    'ice-candidate',
    (data: {
      candidate: string;
      sdpMid: string | null;
      sdpMLineIndex: number | null;
    }) => {
      const room = getRoomBySocketId(socket.id);
      if (!room) return;

      const targetId =
        room.hostSocketId === socket.id
          ? room.clientSocketId
          : room.hostSocketId;

      if (targetId) {
        io.to(targetId).emit('ice-candidate', {
          candidate: data.candidate,
          sdpMid: data.sdpMid,
          sdpMLineIndex: data.sdpMLineIndex,
          from: socket.id,
        });
      }
    }
  );

  // Message relay (for WebSocket-only mode)
  socket.on('remote-message', (message: any) => {
    const room = getRoomBySocketId(socket.id);
    if (!room) return;

    // Only allow messages from client to host
    if (socket.id === room.clientSocketId && room.hostSocketId) {
      io.to(room.hostSocketId).emit('remote-message', message);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    const room = removeSocketFromRoom(socket.id);

    if (room) {
      // Notify the other peer
      const targetId =
        room.hostSocketId === socket.id
          ? room.clientSocketId
          : room.hostSocketId;

      if (targetId) {
        io.to(targetId).emit('peer-disconnected');
      }
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});

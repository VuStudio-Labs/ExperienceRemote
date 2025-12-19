import { nanoid } from 'nanoid';

interface Room {
  code: string;
  hostSocketId: string;
  clientSocketId: string | null;
  createdAt: number;
  expiresAt: number;
}

const ROOM_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const rooms = new Map<string, Room>();

// Generate a 6-character room code
function generateRoomCode(): string {
  // Use uppercase letters and numbers, avoiding confusing characters
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function createRoom(hostSocketId: string): Room {
  // Clean up expired rooms first
  cleanupExpiredRooms();

  let code = generateRoomCode();
  // Ensure unique code
  while (rooms.has(code)) {
    code = generateRoomCode();
  }

  const now = Date.now();
  const room: Room = {
    code,
    hostSocketId,
    clientSocketId: null,
    createdAt: now,
    expiresAt: now + ROOM_EXPIRY_MS,
  };

  rooms.set(code, room);
  console.log(`Room created: ${code} by host ${hostSocketId}`);
  return room;
}

export function joinRoom(code: string, clientSocketId: string): Room | null {
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    console.log(`Room not found: ${code}`);
    return null;
  }

  if (Date.now() > room.expiresAt) {
    rooms.delete(code);
    console.log(`Room expired: ${code}`);
    return null;
  }

  if (room.clientSocketId) {
    console.log(`Room already has a client: ${code}`);
    return null;
  }

  room.clientSocketId = clientSocketId;
  // Extend expiry once connected
  room.expiresAt = Date.now() + ROOM_EXPIRY_MS * 2;
  console.log(`Client ${clientSocketId} joined room ${code}`);
  return room;
}

export function getRoom(code: string): Room | null {
  return rooms.get(code.toUpperCase()) || null;
}

export function getRoomBySocketId(socketId: string): Room | null {
  for (const room of rooms.values()) {
    if (room.hostSocketId === socketId || room.clientSocketId === socketId) {
      return room;
    }
  }
  return null;
}

export function removeRoom(code: string): void {
  rooms.delete(code.toUpperCase());
  console.log(`Room removed: ${code}`);
}

export function removeSocketFromRoom(socketId: string): Room | null {
  const room = getRoomBySocketId(socketId);
  if (!room) return null;

  if (room.hostSocketId === socketId) {
    // Host left, destroy room
    rooms.delete(room.code);
    console.log(`Host left, room destroyed: ${room.code}`);
  } else if (room.clientSocketId === socketId) {
    // Client left, allow new client to join
    room.clientSocketId = null;
    console.log(`Client left room: ${room.code}`);
  }

  return room;
}

function cleanupExpiredRooms(): void {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (now > room.expiresAt) {
      rooms.delete(code);
      console.log(`Cleaned up expired room: ${code}`);
    }
  }
}

// Run cleanup every minute
setInterval(cleanupExpiredRooms, 60 * 1000);

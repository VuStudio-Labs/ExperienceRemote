// Connection states
export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

// Room information
export interface RoomInfo {
  roomCode: string;
  createdAt: number;
  expiresAt: number;
}

// Signaling messages
export interface SignalingOffer {
  type: 'offer';
  sdp: string;
}

export interface SignalingAnswer {
  type: 'answer';
  sdp: string;
}

export interface SignalingCandidate {
  type: 'candidate';
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
}

export type SignalingMessage =
  | SignalingOffer
  | SignalingAnswer
  | SignalingCandidate;

// Settings
export interface RemoteSettings {
  gyroSensitivity: number;
  trackpadSensitivity: number;
  oscPort: number;
  oscHost: string;
}

export const DEFAULT_SETTINGS: RemoteSettings = {
  gyroSensitivity: 1.0,
  trackpadSensitivity: 1.0,
  oscPort: 9000,
  oscHost: '127.0.0.1',
};

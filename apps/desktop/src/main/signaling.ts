import { io, Socket } from 'socket.io-client';

export class SignalingClient {
  private socket: Socket;
  private roomCode: string | null = null;
  private clientJoinedCallback: (() => void) | null = null;
  private messageCallback: ((message: any) => void) | null = null;

  constructor(serverUrl: string) {
    this.socket = io(serverUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to signaling server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from signaling server');
    });

    this.socket.on('client-joined', () => {
      console.log('Client joined the room');
      this.clientJoinedCallback?.();
    });

    // Listen for relayed messages from web remote
    this.socket.on('remote-message', (message: any) => {
      this.messageCallback?.(message);
    });
  }

  async createRoom(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.socket.emit('create-room', (response: { success: boolean; roomCode?: string; error?: string }) => {
        if (response.success && response.roomCode) {
          this.roomCode = response.roomCode;
          resolve(response.roomCode);
        } else {
          reject(new Error(response.error || 'Failed to create room'));
        }
      });
    });
  }

  onClientJoined(callback: () => void): void {
    this.clientJoinedCallback = callback;
  }

  onMessage(callback: (message: any) => void): void {
    this.messageCallback = callback;
  }

  onOffer(callback: (data: { sdp: string; from: string }) => void): void {
    this.socket.on('offer', callback);
  }

  onAnswer(callback: (data: { sdp: string; from: string }) => void): void {
    this.socket.on('answer', callback);
  }

  onIceCandidate(
    callback: (data: {
      candidate: string;
      sdpMid: string | null;
      sdpMLineIndex: number | null;
      from: string;
    }) => void
  ): void {
    this.socket.on('ice-candidate', callback);
  }

  sendOffer(sdp: string): void {
    this.socket.emit('offer', { sdp });
  }

  sendAnswer(sdp: string): void {
    this.socket.emit('answer', { sdp });
  }

  sendIceCandidate(candidate: RTCIceCandidate): void {
    this.socket.emit('ice-candidate', {
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex,
    });
  }

  disconnect(): void {
    this.socket.disconnect();
  }

  get connected(): boolean {
    return this.socket.connected;
  }
}

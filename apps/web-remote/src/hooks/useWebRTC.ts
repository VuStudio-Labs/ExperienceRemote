import { useState, useCallback, useEffect, useRef } from 'react';
import { getSocket, disconnectSocket } from '../lib/signaling';
import { Socket } from 'socket.io-client';

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

interface UseWebRTCReturn {
  connectionState: ConnectionState;
  connect: (roomCode: string) => Promise<void>;
  disconnect: () => void;
  send: (data: object) => void;
}

export function useWebRTC(): UseWebRTCReturn {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('disconnected');
  const socketRef = useRef<Socket | null>(null);
  const connectedRef = useRef(false);

  const send = useCallback((data: object) => {
    if (socketRef.current && connectedRef.current) {
      socketRef.current.emit('remote-message', data);
    }
  }, []);

  const disconnect = useCallback(() => {
    connectedRef.current = false;
    disconnectSocket();
    socketRef.current = null;
    setConnectionState('disconnected');
  }, []);

  const connect = useCallback(
    async (roomCode: string) => {
      setConnectionState('connecting');

      try {
        const socket = getSocket();
        socketRef.current = socket;

        // Connect the socket if not connected
        if (!socket.connected) {
          socket.connect();
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
            socket.once('connect', () => {
              clearTimeout(timeout);
              resolve();
            });
            socket.once('connect_error', (err) => {
              clearTimeout(timeout);
              reject(err);
            });
          });
        }

        // Join the room
        const joinResult = await new Promise<{ success: boolean; error?: string }>(
          (resolve) => {
            socket.emit('join-room', roomCode, resolve);
          }
        );

        if (!joinResult.success) {
          throw new Error(joinResult.error || 'Failed to join room');
        }

        // Successfully joined - we're connected via WebSocket relay
        connectedRef.current = true;
        setConnectionState('connected');

        // Handle peer disconnection
        socket.on('peer-disconnected', () => {
          disconnect();
        });

        socket.on('disconnect', () => {
          connectedRef.current = false;
          setConnectionState('disconnected');
        });

      } catch (error) {
        console.error('Connection error:', error);
        setConnectionState('error');
        throw error;
      }
    },
    [disconnect]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { connectionState, connect, disconnect, send };
}

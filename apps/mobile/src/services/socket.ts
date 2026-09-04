import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { Platform } from 'react-native';

// Use Ngrok Tunnel URL for stable development networking
const SOCKET_URL = 'https://injunctive-efrain-undecomposed.ngrok-free.dev';

let socket: Socket | null = null;

export const initSocket = () => {
  const token = store.getState().auth.token;
  if (!token) return;
  if (socket?.connected) return; // Already connected

  // Disconnect previous socket if exists but not connected
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    extraHeaders: {
      'ngrok-skip-browser-warning': 'true',
    },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected to WebSocket server');
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

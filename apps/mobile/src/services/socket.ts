import { io, Socket } from 'socket.io-client';
import { store } from '../store';

const SOCKET_URL = 'http://10.0.2.2:3000'; // Default Android Localhost

let socket: Socket | null = null;

export const initSocket = () => {
  const token = store.getState().auth.token;
  if (!token || socket) return;

  socket = io(SOCKET_URL, {
    auth: { token },
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected to WebSocket server');
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Disconnected from WebSocket server');
  });
};

export const getSocket = () => socket;

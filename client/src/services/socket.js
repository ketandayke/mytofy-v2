import { io } from 'socket.io-client';

export const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:8000', {
  withCredentials: true,
  autoConnect: false, // We connect manually when a user joins a room
});

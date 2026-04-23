import { useEffect, useCallback } from 'react';
import { socket } from '../services/socket';

export const useSocket = (roomId) => {
  useEffect(() => {
    if (!roomId) return;
    
    // Connect and join room
    socket.connect();
    socket.emit('join_room', { roomId });

    return () => {
      // Disconnect when component unmounts (user leaves room)
      socket.disconnect();
    };
  }, [roomId]);

  // Helper to safely bind event listeners
  const on = useCallback((event, callback) => {
    socket.on(event, callback);
    return () => socket.off(event, callback);
  }, []);

  // Helper to emit events to the server
  const emit = useCallback((event, data) => {
    socket.emit(event, data);
  }, []);

  return { on, emit, socket };
};

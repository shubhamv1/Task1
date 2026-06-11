import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(import.meta.env.VITE_SOCKET_URL || '/', {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => console.log('Socket connected:', socket.id));
  socket.on('connect_error', (err) => console.error('Socket error:', err.message));
  socket.on('disconnect', () => console.log('Socket disconnected'));

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const joinProject = (projectId) => {
  socket?.emit('join-project', projectId);
};

export const leaveProject = (projectId) => {
  socket?.emit('leave-project', projectId);
};

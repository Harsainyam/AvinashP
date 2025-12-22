import { io } from 'socket.io-client';
import config from '../config';
import { getToken } from './storage';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect(userId) {
    if (this.connected) {
      return;
    }

    const token = getToken();
    
    if (!token) {
      console.error('No token available for socket connection');
      return;
    }

    this.socket = io(config.SOCKET_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.connected = true;
    });

    this.socket.on('connected', (data) => {
      console.log('Socket welcome message:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      console.log('Socket disconnected manually');
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    }
  }

  ping() {
    if (this.socket && this.connected) {
      this.socket.emit('ping');
    }
  }
}

const socketService = new SocketService();
export default socketService;
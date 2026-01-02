import { io, Socket } from 'socket.io-client';
import { LogEntry } from './api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.emit('connection_status', { connected: true });
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.emit('connection_status', { connected: false });
    });

    this.socket.on('new_log', (log: LogEntry) => {
      this.emit('new_log', log);
    });

    this.socket.on('new_alert', (alert: any) => {
      this.emit('new_alert', alert);
    });

    this.socket.on('stats_update', (stats: any) => {
      this.emit('stats_update', stats);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((listener) => listener(data));
    }
  }

  subscribe(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const wsService = new WebSocketService();
export default wsService;

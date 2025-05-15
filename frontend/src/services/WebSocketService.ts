import { io, Socket } from 'socket.io-client';

export class WebSocketService {
  private socket: Socket | null = null;
  private socketUrl: string;
  private reconnectInterval: number = 5000; // 5 seconds
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private eventHandlers: Map<string, ((data: any) => void)[]> = new Map();

  constructor() {
    this.socketUrl = process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:3000';
  }

  // Connect to WebSocket server
  connect(): void {
    if (this.socket && this.socket.connected) {
      console.log('WebSocket is already connected');
      return;
    }

    // Get token from localStorage
    const token = localStorage.getItem('token');

    if (!token) {
      console.error('No authentication token found. Unable to connect to WebSocket');
      return;
    }

    // Create socket instance with auth
    this.socket = io(this.socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: this.reconnectInterval,
      reconnectionAttempts: this.maxReconnectAttempts
    });

    // Setup event handlers
    this.setupEventHandlers();
  }

  // Setup WebSocket event handlers
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`WebSocket disconnected: ${reason}`);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log('Max reconnect attempts reached. Stopping reconnect.');
      }
    });

    // Listen for events
    this.socket.on('notification', (data) => {
      this.handleEvent('notification', data);
    });

    this.socket.on('alert', (data) => {
      this.handleEvent('alert', data);
    });

    this.socket.on('event', (data) => {
      this.handleEvent('event', data);
    });

    this.socket.on('system', (data) => {
      this.handleEvent('system', data);
    });
  }

  // Handle incoming events
  private handleEvent(eventName: string, data: any): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  // Subscribe to a channel
  subscribe(channel: string): void {
    if (!this.socket || !this.socket.connected) {
      console.error('WebSocket is not connected. Unable to subscribe to channel');
      return;
    }

    this.socket.emit('subscribe', { channel });
  }

  // Unsubscribe from a channel
  unsubscribe(channel: string): void {
    if (!this.socket || !this.socket.connected) {
      console.error('WebSocket is not connected. Unable to unsubscribe from channel');
      return;
    }

    this.socket.emit('unsubscribe', { channel });
  }

  // Send a message
  send(event: string, data: any): void {
    if (!this.socket || !this.socket.connected) {
      console.error('WebSocket is not connected. Unable to send message');
      return;
    }

    this.socket.emit(event, data);
  }

  // Add event listener
  on(eventName: string, callback: (data: any) => void): void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    
    this.eventHandlers.get(eventName)?.push(callback);
  }

  // Remove event listener
  off(eventName: string, callback: (data: any) => void): void {
    if (!this.eventHandlers.has(eventName)) return;
    
    const handlers = this.eventHandlers.get(eventName) || [];
    const index = handlers.indexOf(callback);
    
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  // Disconnect WebSocket
  disconnect(): void {
    if (!this.socket) return;
    
    this.socket.disconnect();
    this.socket = null;
  }

  // Check connection status
  isConnected(): boolean {
    return !!(this.socket && this.socket.connected);
  }

  // Manually reconnect
  reconnect(): void {
    this.disconnect();
    this.connect();
  }

  // Ping server to check connection
  ping(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.socket || !this.socket.connected) {
        resolve(false);
        return;
      }

      let timeout: NodeJS.Timeout;
      
      const pingHandler = () => {
        clearTimeout(timeout);
        resolve(true);
      };

      // Set timeout to handle no response
      timeout = setTimeout(() => {
        this.socket?.off('pong', pingHandler);
        resolve(false);
      }, 5000);

      // Register one-time handler for pong response
      this.socket.once('pong', pingHandler);
      
      // Send ping
      this.socket.emit('ping');
    });
  }
}

export default WebSocketService;
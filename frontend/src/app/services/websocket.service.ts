import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: Socket;
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5 seconds
  
  // Event subjects
  private eventSubjects: Map<string, Subject<any>> = new Map();
  
  // Connection status subject
  private connectionStatusSubject = new Subject<boolean>();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  constructor(private authService: AuthService) {
    // Initialize connection subjects
    this.eventSubjects.set('connect', new Subject<void>());
    this.eventSubjects.set('disconnect', new Subject<void>());
    this.eventSubjects.set('error', new Subject<any>());
    
    // Common event types
    this.eventSubjects.set('alert', new Subject<any>());
    this.eventSubjects.set('event', new Subject<any>());
    this.eventSubjects.set('notification', new Subject<any>());
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.connected) {
      return;
    }
    
    const token = this.authService.getToken();
    
    if (!token) {
      console.warn('WebSocket: No authentication token available');
      return;
    }
    
    // Initialize socket with auth token
    this.socket = io(environment.wsUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectInterval
    });
    
    // Set up event listeners
    this.socket.on('connect', () => {
      console.log('WebSocket: Connected');
      this.connected = true;
      this.reconnectAttempts = 0;
      this.connectionStatusSubject.next(true);
      
      // Emit 'connect' event
      const subject = this.eventSubjects.get('connect');
      if (subject) {
        subject.next();
      }
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log(`WebSocket: Disconnected - ${reason}`);
      this.connected = false;
      this.connectionStatusSubject.next(false);
      
      // Emit 'disconnect' event
      const subject = this.eventSubjects.get('disconnect');
      if (subject) {
        subject.next();
      }
      
      // Handle reconnection for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Manual reconnection needed for server-side disconnects
        this.reconnect();
      }
    });
    
    this.socket.on('error', (error) => {
      console.error('WebSocket: Error', error);
      
      // Emit 'error' event
      const subject = this.eventSubjects.get('error');
      if (subject) {
        subject.next(error);
      }
    });
    
    // Set up event handlers for common events
    this.setupEventHandlers(['alert', 'event', 'notification']);
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
      this.connectionStatusSubject.next(false);
    }
  }

  /**
   * Subscribe to a specific event type
   */
  onEvent<T>(eventName: string): Observable<T> {
    // Create subject if it doesn't exist
    if (!this.eventSubjects.has(eventName)) {
      this.eventSubjects.set(eventName, new Subject<T>());
      
      // Set up event handler if socket is connected
      if (this.socket && this.connected) {
        this.setupEventHandler(eventName);
      }
    }
    
    return this.eventSubjects.get(eventName).asObservable();
  }

  /**
   * Send an event to the server
   */
  emit(eventName: string, data?: any): void {
    if (this.socket && this.connected) {
      this.socket.emit(eventName, data);
    } else {
      console.warn(`WebSocket: Cannot emit ${eventName} - not connected`);
    }
  }

  /**
   * Subscribe to a specific topic
   */
  subscribeTopic(topic: string): void {
    if (this.socket && this.connected) {
      this.socket.emit('subscribe', topic);
    } else {
      console.warn(`WebSocket: Cannot subscribe to ${topic} - not connected`);
    }
  }

  /**
   * Unsubscribe from a specific topic
   */
  unsubscribeTopic(topic: string): void {
    if (this.socket && this.connected) {
      this.socket.emit('unsubscribe', topic);
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Manual reconnection attempt
   */
  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('WebSocket: Maximum reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    console.log(`WebSocket: Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      if (!this.connected) {
        this.connect();
      }
    }, this.reconnectInterval);
  }

  /**
   * Set up event handlers for multiple events
   */
  private setupEventHandlers(eventNames: string[]): void {
    eventNames.forEach(eventName => {
      this.setupEventHandler(eventName);
    });
  }

  /**
   * Set up event handler for a specific event
   */
  private setupEventHandler(eventName: string): void {
    // Make sure subject exists
    if (!this.eventSubjects.has(eventName)) {
      this.eventSubjects.set(eventName, new Subject<any>());
    }
    
    const subject = this.eventSubjects.get(eventName);
    
    // Add listener to socket
    this.socket.on(eventName, (data: any) => {
      subject.next(data);
    });
  }
}
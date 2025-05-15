import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  withCredentials?: boolean;
  path?: string;
  transports?: string[];
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

const defaultOptions: UseWebSocketOptions = {
  url: process.env.REACT_APP_WS_URL || 'http://localhost:3000',
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 3000,
  withCredentials: true,
  path: '/socket.io',
  transports: ['websocket', 'polling'],
};

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState<number>(0);
  
  const opts = { ...defaultOptions, ...options };
  
  // Initialize socket connection
  const connect = useCallback(() => {
    // Close existing connection if any
    if (socketRef.current) {
      socketRef.current.close();
    }
    
    // Clear error state
    setError(null);
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // Create new socket connection
    const socket = io(opts.url!, {
      autoConnect: opts.autoConnect,
      reconnection: opts.reconnection,
      reconnectionAttempts: opts.reconnectionAttempts,
      reconnectionDelay: opts.reconnectionDelay,
      withCredentials: opts.withCredentials,
      path: opts.path,
      transports: opts.transports,
      auth: {
        token: token || undefined,
      },
    });
    
    // Setup socket event handlers
    socket.on('connect', () => {
      setIsConnected(true);
      setReconnectAttempt(0);
      if (opts.onConnect) opts.onConnect();
    });
    
    socket.on('disconnect', () => {
      setIsConnected(false);
      if (opts.onDisconnect) opts.onDisconnect();
    });
    
    socket.on('connect_error', (err) => {
      setError(`Connection error: ${err.message}`);
      if (opts.onError) opts.onError(err);
      
      // Handle reconnection attempts
      if (opts.reconnection) {
        setReconnectAttempt((prev) => prev + 1);
        
        if (reconnectAttempt >= (opts.reconnectionAttempts || 5)) {
          socket.close();
        }
      }
    });
    
    // Store socket in ref
    socketRef.current = socket;
    
    return socket;
  }, [
    opts.url,
    opts.autoConnect,
    opts.reconnection,
    opts.reconnectionAttempts,
    opts.reconnectionDelay,
    opts.withCredentials,
    opts.path,
    opts.transports,
    opts.onConnect,
    opts.onDisconnect,
    opts.onError,
    reconnectAttempt,
  ]);
  
  // Effect to connect on component mount
  useEffect(() => {
    if (opts.autoConnect) {
      connect();
    }
    
    // Cleanup function to disconnect on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [connect, opts.autoConnect]);
  
  // Subscribe to an event
  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    if (!socketRef.current) return;
    
    socketRef.current.on(event, callback);
    
    // Return unsubscribe function
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
      }
    };
  }, []);
  
  // Unsubscribe from an event
  const unsubscribe = useCallback((event: string, callback?: (data: any) => void) => {
    if (!socketRef.current) return;
    
    if (callback) {
      socketRef.current.off(event, callback);
    } else {
      socketRef.current.off(event);
    }
  }, []);
  
  // Emit an event
  const emit = useCallback((event: string, data?: any, callback?: (response: any) => void) => {
    if (!socketRef.current) return;
    
    socketRef.current.emit(event, data, callback);
  }, []);
  
  // Disconnect
  const disconnect = useCallback(() => {
    if (!socketRef.current) return;
    
    socketRef.current.disconnect();
  }, []);
  
  // Reconnect
  const reconnect = useCallback(() => {
    if (!socketRef.current) {
      connect();
      return;
    }
    
    socketRef.current.connect();
  }, [connect]);
  
  // Get socket instance
  const getSocket = useCallback(() => socketRef.current, []);
  
  return {
    socket: socketRef.current,
    isConnected,
    error,
    reconnectAttempt,
    connect,
    disconnect,
    reconnect,
    subscribe,
    unsubscribe,
    emit,
    getSocket,
  };
};

export default useWebSocket;
import React, { createContext, useContext, useEffect, useState } from 'react';
import { WebSocketService } from '../services/WebSocketService';
import { useAuth } from '../hooks/useAuth';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';

// Define context type
interface WebSocketContextType {
  connected: boolean;
  subscribe: (channel: string, callback?: () => void) => void;
  unsubscribe: (channel: string, callback?: () => void) => void;
  reconnect: () => void;
}

// Create context with default values
const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  subscribe: () => {},
  unsubscribe: () => {},
  reconnect: () => {},
});

// Define props for provider
interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  
  // State
  const [wsService, setWsService] = useState<WebSocketService | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  
  // Initialize WebSocket service when auth state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      const webSocketService = new WebSocketService();
      
      // Set up connection status listener
      webSocketService.on('connect', () => {
        setConnected(true);
        console.log('WebSocket connected');
      });
      
      webSocketService.on('disconnect', () => {
        setConnected(false);
        console.log('WebSocket disconnected');
      });
      
      // Set up notification listener
      webSocketService.on('notification', (data) => {
        enqueueSnackbar(data.message, {
          variant: data.type || 'info',
          autoHideDuration: 5000,
          action: data.actionable ? (
            <Button color="inherit" size="small" onClick={() => handleNotificationAction(data)}>
              View
            </Button>
          ) : undefined,
        });
      });
      
      // Set up alert listener
      webSocketService.on('alert', (data) => {
        enqueueSnackbar(`New Alert: ${data.title}`, {
          variant: getVariantFromSeverity(data.severity),
          autoHideDuration: 7000,
          action: (
            <Button color="inherit" size="small" onClick={() => navigate(`/alerts/${data.id}`)}>
              View
            </Button>
          ),
        });
      });
      
      // Connect to WebSocket server
      webSocketService.connect();
      
      // Save the service in state
      setWsService(webSocketService);
      
      // Cleanup on unmount
      return () => {
        webSocketService.disconnect();
      };
    } else {
      // Disconnect if not authenticated
      if (wsService) {
        wsService.disconnect();
        setWsService(null);
        setConnected(false);
      }
    }
  }, [isAuthenticated, user]);
  
  // Handle notification action
  const handleNotificationAction = (data: any) => {
    // Navigate based on notification type
    if (data.alertId) {
      navigate(`/alerts/${data.alertId}`);
    } else if (data.entityId) {
      navigate(`/entities/${data.entityId}`);
    } else if (data.eventId) {
      navigate(`/events/${data.eventId}`);
    } else if (data.reportId) {
      navigate(`/reports/${data.reportId}`);
    } else {
      navigate('/notifications');
    }
  };
  
  // Get snackbar variant based on severity
  const getVariantFromSeverity = (severity: string): 'default' | 'error' | 'success' | 'warning' | 'info' => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'info';
    }
  };
  
  // Subscribe to a channel
  const subscribe = (channel: string, callback?: () => void) => {
    if (wsService && connected) {
      wsService.subscribe(channel);
      if (callback) callback();
    }
  };
  
  // Unsubscribe from a channel
  const unsubscribe = (channel: string, callback?: () => void) => {
    if (wsService) {
      wsService.unsubscribe(channel);
      if (callback) callback();
    }
  };
  
  // Reconnect WebSocket
  const reconnect = () => {
    if (wsService) {
      wsService.reconnect();
    }
  };
  
  // Context value
  const contextValue: WebSocketContextType = {
    connected,
    subscribe,
    unsubscribe,
    reconnect
  };
  
  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook to use WebSocket context
export const useWebSocket = () => useContext(WebSocketContext);

export default WebSocketProvider;
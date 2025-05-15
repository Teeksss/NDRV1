import React, { createContext, useState, useContext, ReactNode } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  message: string;
  type: NotificationType;
  duration?: number;
  id?: string;
}

interface NotificationContextType {
  notification: Notification | null;
  showNotification: (notification: Notification) => void;
  closeNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notification: null,
  showNotification: () => {},
  closeNotification: () => {},
});

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<Notification | null>(null);
  
  // Show notification
  const showNotification = (newNotification: Notification) => {
    // Add unique ID if not provided
    if (!newNotification.id) {
      newNotification.id = Date.now().toString();
    }
    
    setNotification(newNotification);
    
    // Auto-close notification after duration if provided
    if (newNotification.duration) {
      setTimeout(() => {
        closeNotification();
      }, newNotification.duration);
    }
  };
  
  // Close notification
  const closeNotification = () => {
    setNotification(null);
  };
  
  return (
    <NotificationContext.Provider
      value={{
        notification,
        showNotification,
        closeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  
  return context;
};

export default NotificationProvider;
import React, { createContext, useState, useEffect, useContext } from 'react';

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export interface UserSettings {
  display?: {
    refreshInterval: number;
    language: string;
    dateFormat: string;
    timeFormat: string;
    chartAnimation: boolean;
    denseLayout: boolean;
  };
  notifications?: {
    emailNotifications: boolean;
    inAppNotifications: boolean;
    criticalAlerts: boolean;
    highAlerts: boolean;
    mediumAlerts: boolean;
    lowAlerts: boolean;
    systemUpdates: boolean;
    soundEnabled: boolean;
  };
  dashboard?: {
    defaultPage: string;
    widgetsPerRow: number;
    autoRefresh: boolean;
    showHelp: boolean;
    compactView: boolean;
    favoriteWidgets: string[];
  };
  security?: {
    sessionTimeout: number;
    passwordExpiryDays: number;
    mfaEnabled: boolean;
    apiTokensEnabled: boolean;
    auditLogging: boolean;
    userActivityTracking: boolean;
  };
}

const defaultSettings: UserSettings = {
  display: {
    refreshInterval: 60,
    language: 'tr',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: '24h',
    chartAnimation: true,
    denseLayout: false
  },
  notifications: {
    emailNotifications: true,
    inAppNotifications: true,
    criticalAlerts: true,
    highAlerts: true,
    mediumAlerts: true,
    lowAlerts: false,
    systemUpdates: true,
    soundEnabled: false
  },
  dashboard: {
    defaultPage: 'dashboard',
    widgetsPerRow: 3,
    autoRefresh: true,
    showHelp: true,
    compactView: false,
    favoriteWidgets: ['alerts', 'traffic', 'threats']
  },
  security: {
    sessionTimeout: 30,
    passwordExpiryDays: 90,
    mfaEnabled: false,
    apiTokensEnabled: true,
    auditLogging: true,
    userActivityTracking: true
  }
};

export const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: async () => {},
  resetSettings: async () => {},
  loading: false,
  error: null
});

interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings from localStorage or API when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        
        // First try to load from localStorage
        const savedSettings = localStorage.getItem('userSettings');
        
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        } else {
          // If not in localStorage, try to fetch from API
          try {
            const response = await fetch('/api/settings');
            
            if (response.ok) {
              const data = await response.json();
              setSettings(data);
              // Cache in localStorage
              localStorage.setItem('userSettings', JSON.stringify(data));
            } else {
              // Use default settings if API fails
              localStorage.setItem('userSettings', JSON.stringify(defaultSettings));
            }
          } catch (err) {
            // Use default settings if API is not available
            localStorage.setItem('userSettings', JSON.stringify(defaultSettings));
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading settings:', err);
        setError('Failed to load settings');
        setSettings(defaultSettings);
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // Update settings
  const updateSettings = async (newSettings: Partial<UserSettings>): Promise<void> => {
    try {
      setLoading(true);
      
      // Merge new settings with existing settings
      const updatedSettings = {
        ...settings,
        ...newSettings,
        // Merge nested objects
        display: { ...settings.display, ...newSettings.display },
        notifications: { ...settings.notifications, ...newSettings.notifications },
        dashboard: { ...settings.dashboard, ...newSettings.dashboard },
        security: { ...settings.security, ...newSettings.security }
      };
      
      // Save locally
      setSettings(updatedSettings);
      localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
      
      // Send to API
      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('/api/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatedSettings)
        });
        
        if (!response.ok) {
          console.warn('Failed to save settings to API, using local only');
        }
      } catch (err) {
        console.warn('API not available, settings saved locally only');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('Failed to update settings');
      setLoading(false);
      throw err;
    }
  };

  // Reset settings to defaults
  const resetSettings = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Reset to defaults
      setSettings(defaultSettings);
      localStorage.setItem('userSettings', JSON.stringify(defaultSettings));
      
      // Reset on API
      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('/api/settings/reset', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          console.warn('Failed to reset settings on API, using local reset only');
        }
      } catch (err) {
        console.warn('API not available, settings reset locally only');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error resetting settings:', err);
      setError('Failed to reset settings');
      setLoading(false);
      throw err;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        loading,
        error
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook to use settings
export const useSettings = () => {
  const context = useContext(SettingsContext);
  
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  
  return context;
};

export default SettingsProvider;
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
  lastLogin?: string;
  preferences?: UserPreferences;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  dashboardId?: string;
  disableNotifications?: boolean;
  notificationSettings?: {
    email?: boolean;
    browser?: boolean;
    slack?: boolean;
    criticalAlertsOnly?: boolean;
  };
}
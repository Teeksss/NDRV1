export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  permissions?: string[];
  lastLogin?: string;
  settings?: UserSettings;
}

export interface UserSettings {
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    email: boolean;
    browser: boolean;
    severity: string[];
  };
  dashboardLayout?: any;
  timezone?: string;
}
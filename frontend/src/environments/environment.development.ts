export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  wsUrl: 'http://localhost:3000/socket',
  defaultTheme: 'dark',
  version: '1.0.0-dev',
  mapbox: {
    accessToken: 'YOUR_MAPBOX_ACCESS_TOKEN',
  },
  featureFlags: {
    enableThreatIntelligence: true,
    enableAnomalyDetection: true,
    enableAdvancedFiltering: true,
    enableReports: true,
    enableNotifications: true
  }
};
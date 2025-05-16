/**
 * NDRV1 Uygulama Yapılandırması
 * 
 * Bu dosya uygulama genelinde kullanılan yapılandırma ayarlarını içerir.
 * Ortam değişkenlerine dayalı yapılandırmayı yönetir.
 */

// Ortam değişkenlerini yükle
const env = process.env.REACT_APP_ENV || 'development';

// Temel API URL'leri
const API_URLS = {
  development: 'http://localhost:8080/api/v1',
  staging: 'https://staging-api.ndrv1.example.com/v1',
  production: 'https://api.ndrv1.example.com/v1'
};

// WebSocket URL'leri
const WS_URLS = {
  development: 'ws://localhost:8081',
  staging: 'wss://staging-ws.ndrv1.example.com',
  production: 'wss://ws.ndrv1.example.com'
};

export const API_BASE_URL = API_URLS[env];
export const WS_BASE_URL = WS_URLS[env];

// Uygulama düzeyi yapılandırma
export const appConfig = {
  appName: 'NDRV1',
  apiVersion: 'v1',
  apiTimeout: 30000, // 30 saniye
  retryAttempts: 3,
  pagination: {
    defaultPageSize: 25,
    pageSizeOptions: [10, 25, 50, 100]
  },
  dataRefreshIntervals: {
    dashboard: 60000, // 1 dakika
    alerts: 30000, // 30 saniye
    networkMap: 120000, // 2 dakika
    trafficAnalytics: 60000 // 1 dakika
  },
  maxLoginAttempts: 5,
  sessionTimeout: 3600000, // 1 saat
  toastDuration: 4000, // 4 saniye
  dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
  defaultLanguage: 'tr',
  supportedLanguages: ['en', 'tr', 'de', 'fr'],
  logLevel: env === 'production' ? 'error' : 'debug'
};

// NDR özel yapılandırma
export const ndrConfig = {
  trafficAnalysis: {
    defaultTimespan: '1h', // 1 saat
    availableTimespans: ['15m', '1h', '6h', '24h', '7d', '30d'],
    maxDataPoints: 1000,
    anomalyThreshold: 0.75,
    bandwidthUnits: ['bps', 'Kbps', 'Mbps', 'Gbps'],
    defaultProtocolCount: 10
  },
  alerting: {
    severityLevels: ['critical', 'high', 'medium', 'low'],
    defaultSeverityFilter: 'all',
    defaultStatusFilter: 'open',
    maxAlertsPerPage: 100,
    autoRefreshEnabled: true
  },
  threatIntelligence: {
    sources: ['internal', 'virustotal', 'alienvault', 'mandiant', 'crowdstrike'],
    refreshInterval: 3600000, // 1 saat
    confidenceThreshold: 70
  },
  networkMap: {
    autoLayout: true,
    layoutAlgorithm: 'force-directed',
    nodeLimit: 500,
    edgeLimit: 1000,
    focusMode: 'auto'
  }
};

// Feature flags
export const featureFlags = {
  enableThreatIntelligence: true,
  enableNetworkMap: true,
  enableMachineLearning: true,
  enableUserBehaviorAnalytics: true,
  enableAutomatedResponse: env !== 'development',
  enableAdvancedVisualization: true,
  enableExporting: true,
  enableAnomalyDetection: true,
  enableThreatHunting: true
};
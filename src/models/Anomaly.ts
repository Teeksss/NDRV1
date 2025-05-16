import { Timestamp } from '@/types/common';

/**
 * Anomali tiplerini tanımlar
 */
export type AnomalyType = 
  | 'traffic_volume'       // Trafik hacmindeki anomaliler
  | 'connection_pattern'   // Bağlantı modellerindeki anomaliler
  | 'protocol_usage'       // Protokol kullanımındaki anomaliler
  | 'port_scan'            // Port tarama aktivitesi
  | 'dns_query'            // DNS sorgu anomalileri
  | 'authentication'       // Kimlik doğrulama anomalileri
  | 'data_exfiltration'    // Veri sızıntısı belirtileri
  | 'lateral_movement'     // Yanal hareket belirtileri
  | 'command_control'      // Komuta kontrol iletişimi belirtileri
  | 'malware_activity'     // Zararlı yazılım aktivitesi belirtileri
  | 'ransomware_activity'  // Fidye yazılımı aktivitesi belirtileri
  | 'user_behavior'        // Kullanıcı davranışı anomalileri
  | 'device_behavior'      // Cihaz davranışı anomalileri
  | 'geolocation';         // Coğrafi konum anomalileri

/**
 * Anomali durumlarını tanımlar
 */
export type AnomalyStatus = 
  | 'new'          // Yeni tespit edilmiş
  | 'investigating' // İnceleniyor
  | 'resolved'     // Çözüldü
  | 'dismissed'    // Reddedildi (yanlış pozitif)
  | 'escalated';   // Yükseltildi (daha yüksek seviyeye)

/**
 * Tespit edilen anormal davranışı temsil eder
 */
export interface Anomaly {
  id: string;
  timestamp: Timestamp;
  type: AnomalyType;
  subtype?: string;
  description: string;
  score: number; // 0-1 arası (1 en yüksek anomali)
  status: AnomalyStatus;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: {
    deviceId?: string;
    deviceName?: string;
    ipAddress?: string;
    mac?: string;
    userId?: string;
    username?: string;
    processName?: string;
    serviceName?: string;
  };
  target?: {
    deviceId?: string;
    deviceName?: string;
    ipAddress?: string;
    mac?: string;
    port?: number;
    protocol?: string;
    service?: string;
  };
  metrics: {
    name: string;
    expectedValue: number;
    actualValue: number;
    deviation: number;
    unit?: string;
  }[];
  baseline?: {
    period: {
      start: Timestamp;
      end: Timestamp;
    };
    values: number[];
    mean: number;
    stdDev: number;
  };
  relatedEvents?: {
    id: string;
    type: string;
    timestamp: Timestamp;
  }[];
  relatedAlerts?: string[];
  assignedTo?: string;
  tags?: string[];
  notes?: string[];
  isFalsePositive?: boolean;
  falsePositiveReason?: string;
  mitreTechniques?: string[];
  metadata?: Record<string, any>;
  detectionMethod: 'statistical' | 'machine_learning' | 'rule_based' | 'hybrid';
  confidence: number; // 0-1 arası
}

/**
 * İlişkili anomalilerin grubunu temsil eder
 */
export interface AnomalyGroup {
  id: string;
  name: string;
  description: string;
  anomalyCount: number;
  anomalyIds: string[];
  firstSeen: Timestamp;
  lastSeen: Timestamp;
  duration: number; // milisaniye
  primaryType: AnomalyType;
  types: AnomalyType[];
  maxScore: number;
  averageScore: number;
  status: AnomalyStatus;
  severity: 'critical' | 'high' | 'medium' | 'low';
  isActive: boolean;
  relatedEntityIds: {
    deviceIds: string[];
    ipAddresses: string[];
    userIds: string[];
  };
  pattern?: {
    description: string;
    confidence: number;
    similarPatterns?: string[];
  };
  tags?: string[];
  assignedTo?: string;
}

/**
 * Anomali tespiti için eşik değerlerini temsil eder
 */
export interface AnomalyThreshold {
  id: string;
  name: string;
  description: string;
  type: AnomalyType;
  subtype?: string;
  conditions: {
    metricName: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between' | 'outside';
    value: number | [number, number]; // Tek değer veya aralık
    duration?: number; // Koşulun ne kadar süreyle geçerli olması gerektiği (ms)
    unit?: string;
  }[];
  baselinePeriod?: {
    value: number;
    unit: 'minute' | 'hour' | 'day' | 'week';
  };
  deviationThreshold?: number; // Standart sapma çarpanı
  minSampleSize?: number;
  scoreMultiplier?: number; // Anomali skorunu etkileme faktörü
  severity: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  version: number;
  isSystem: boolean; // Sistem tarafından oluşturulan varsayılan eşik mi?
}

/**
 * Anomali tespit modeli yapılandırmasını temsil eder
 */
export interface AnomalyModelConfig {
  id: string;
  name: string;
  description: string;
  modelType: 'statistical' | 'machine_learning' | 'hybrid';
  parameters: Record<string, any>;
  targetMetrics: string[];
  baselinePeriod: {
    value: number;
    unit: 'minute' | 'hour' | 'day' | 'week';
  };
  trainingSchedule?: {
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number; // 0-6, 0 = Pazar
    dayOfMonth?: number; // 1-31
    hour?: number; // 0-23
    minute?: number; // 0-59
  };
  lastTrainedAt?: Timestamp;
  trainingStatus?: 'idle' | 'training' | 'failed' | 'completed';
  trainingError?: string;
  performance?: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    falsePositiveRate: number;
  };
  featureImportance?: Record<string, number>;
  version: string;
  enabled: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

/**
 * Anomali tespit modeli için eğitim veri setini temsil eder
 */
export interface AnomalyTrainingData {
  id: string;
  modelId: string;
  datasetType: 'normal' | 'anomalous' | 'mixed';
  startTime: Timestamp;
  endTime: Timestamp;
  recordCount: number;
  features: string[];
  labels?: Record<string, number>; // Etiketli veri dağılımı
  datasetPath: string;
  createdAt: Timestamp;
  createdBy: string;
  preprocessingSteps: string[];
  validationSplit: number; // 0-1 arası
  isActive: boolean;
}
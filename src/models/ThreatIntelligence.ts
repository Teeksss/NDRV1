import { Timestamp } from '@/types/common';

/**
 * Tehdit kategorilerini tanımlar
 */
export type ThreatCategory = 
  | 'malware' 
  | 'phishing' 
  | 'c2' 
  | 'botnet' 
  | 'ransomware' 
  | 'apt' 
  | 'exploit' 
  | 'scanner' 
  | 'spam' 
  | 'tor' 
  | 'proxy' 
  | 'cryptocurrency' 
  | 'ddos' 
  | 'anonymizer';

/**
 * Tehdit göstergesi tiplerini tanımlar
 */
export type ThreatIndicatorType = 
  | 'ip' 
  | 'domain' 
  | 'url' 
  | 'file_hash' 
  | 'email' 
  | 'asn' 
  | 'cidr';

/**
 * Tehdit göstergesini (IoC) temsil eder
 */
export interface ThreatIndicator {
  id: string;
  value: string;
  type: ThreatIndicatorType;
  categories: ThreatCategory[];
  source: string;
  firstSeen: Timestamp;
  lastSeen: Timestamp;
  expiresAt?: Timestamp;
  confidence: number; // 0-100
  severity: 'critical' | 'high' | 'medium' | 'low';
  description?: string;
  metadata?: Record<string, any>;
  isActive: boolean;
  tags?: string[];
  relatedIndicators?: string[];
  reportUrl?: string;
  isCustom?: boolean;
  addedBy?: string;
}

/**
 * Tehdit beslemesini (feed) temsil eder
 */
export interface ThreatFeed {
  id: string;
  name: string;
  provider: string;
  description: string;
  categories: ThreatCategory[];
  indicatorTypes: ThreatIndicatorType[];
  indicatorCount: number;
  lastUpdated: Timestamp;
  updateFrequency: string;
  confidenceScore: number;
  isEnabled: boolean;
  isCommercial: boolean;
  apiUrl?: string;
  apiKey?: string;
  requiresAuth: boolean;
}

/**
 * Tehdit analiz sonucunu temsil eder
 */
export interface ThreatAnalysis {
  value: string;
  type: ThreatIndicatorType;
  isKnownThreat: boolean;
  highestConfidence: number;
  highestSeverity: 'critical' | 'high' | 'medium' | 'low' | 'none';
  firstReported: Timestamp;
  lastReported: Timestamp;
  reportCount: number;
  categories: ThreatCategory[];
  sources: string[];
  relatedIndicators: ThreatIndicator[];
  matchedRules?: string[];
  geolocation?: {
    country: string;
    region: string;
    city: string;
    latitude: number;
    longitude: number;
    asn: number;
    organization: string;
  };
  whois?: {
    registrar: string;
    registeredOn: Timestamp;
    expiresOn: Timestamp;
    updatedOn: Timestamp;
    nameServers: string[];
    status: string[];
  };
  resolutions?: {
    value: string;
    firstSeen: Timestamp;
    lastSeen: Timestamp;
  }[];
  malwareDetails?: {
    name: string;
    family: string;
    type: string;
    platform: string;
    detectionRate: number;
  };
  mitreTechniques?: string[];
  tags: string[];
  riskScore: number; // 0-100
}

/**
 * Tehdit istihbaratı raporunu temsil eder
 */
export interface ThreatReport {
  id: string;
  title: string;
  publisher: string;
  publishDate: Timestamp;
  categories: ThreatCategory[];
  summary: string;
  content?: string;
  indicators: ThreatIndicator[];
  mitreTactics?: string[];
  mitreTechniques?: string[];
  affectedSystems?: string[];
  recommendedActions?: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  tlp: 'red' | 'amber' | 'green' | 'white';
  tags: string[];
  attachments?: {
    name: string;
    type: string;
    size: number;
    url: string;
  }[];
  url: string;
}

/**
 * MITRE ATT&CK taktik ve tekniklerini temsil eder
 */
export interface MitreTechnique {
  id: string;
  name: string;
  description: string;
  tactic: string;
  url: string;
  indicators: string[];
}
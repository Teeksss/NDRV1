export interface Entity {
  id: string;
  name: string;
  type: string;
  status?: string;
  description?: string;
  ipAddress?: string;
  macAddress?: string;
  hostname?: string;
  operatingSystem?: string;
  osVersion?: string;
  riskScore?: number;
  firstSeen?: string;
  lastSeen?: string;
  tags?: string[];
  metadata?: any;
  vulnerabilities?: Vulnerability[];
  createdAt: string;
  updatedAt: string;
}

export interface Vulnerability {
  id: string;
  name: string;
  description: string;
  severity: string;
  cvss?: number;
  cve?: string;
  discoveredAt: string;
  patched: boolean;
  patchedAt?: string;
}
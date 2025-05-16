import * as mongoose from 'mongoose';

export const SecurityAlertSchema = new mongoose.Schema({
    type: { type: String, required: true },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true
    },
    description: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['active', 'acknowledged', 'resolved'],
        default: 'active'
    },
    creator: { type: String, required: true },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    },
    serviceInfo: {
        timestamp: { type: Date, default: Date.now },
        maintainer: { type: String, default: 'Teeksss' },
        version: { type: String, default: '3.2.6' },
        buildNumber: { type: String, default: '202505160712' }
    }
});

export const SecurityMetricsSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    type: { type: String, required: true },
    value: { type: Number, required: true },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    },
    serviceInfo: {
        timestamp: { type: Date, default: Date.now },
        maintainer: { type: String, default: 'Teeksss' },
        version: { type: String, default: '3.2.6' },
        buildNumber: { type: String, default: '202505160712' }
    }
});

export const SecurityAuditSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    action: { type: String, required: true },
    actor: { type: String, required: true },
    target: { type: String, required: true },
    details: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    },
    serviceInfo: {
        timestamp: { type: Date, default: Date.now },
        maintainer: { type: String, default: 'Teeksss' },
        version: { type: String, default: '3.2.6' },
        buildNumber: { type: String, default: '202505160712' }
    }
});

export const SecurityConfigSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    features: {
        realTimeMonitoring: { type: Boolean, default: true },
        mlDetection: { type: Boolean, default: true },
        automatedResponse: { type: Boolean, default: true },
        threatIntelligence: { type: Boolean, default: true }
    },
    thresholds: {
        minConfidenceScore: { type: Number, default: 0.75 },
        maxResponseTime: { type: Number, default: 5000 },
        criticalSeverityLevel: { type: Number, default: 8 }
    },
    serviceInfo: {
        timestamp: { type: Date, default: Date.now },
        maintainer: { type: String, default: 'Teeksss' },
        version: { type: String, default: '3.2.6' },
        buildNumber: { type: String, default: '202505160712' }
    }
});
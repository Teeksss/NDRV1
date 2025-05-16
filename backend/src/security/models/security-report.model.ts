import * as mongoose from 'mongoose';

const SecurityReportSchema = new mongoose.Schema({
    summary: {
        overallStatus: {
            type: String,
            enum: ['healthy', 'warning', 'critical'],
            required: true
        },
        criticalFindings: [{
            id: String,
            type: String,
            severity: {
                type: String,
                enum: ['high', 'critical']
            },
            description: String,
            detectedAt: Date,
            status: {
                type: String,
                enum: ['open', 'investigating', 'mitigated']
            }
        }],
        riskLevel: Number,
        timeframe: String,
        generatedAt: Date
    },
    details: {
        threatAnalysis: {
            totalThreats: Number,
            criticalThreats: Number,
            threatsByCategory: mongoose.Schema.Types.Mixed,
            trendAnalysis: {
                direction: {
                    type: String,
                    enum: ['increasing', 'stable', 'decreasing']
                },
                percentage: Number,
                period: String
            }
        },
        securityMetrics: {
            overallScore: Number,
            metrics: [{
                name: String,
                value: Number,
                threshold: Number,
                status: {
                    type: String,
                    enum: ['good', 'warning', 'critical']
                }
            }],
            trends: [{
                metric: String,
                values: [Number],
                timestamps: [Date]
            }]
        },
        complianceStatus: {
            overallCompliance: Number,
            frameworks: [{
                name: String,
                compliance: Number,
                criticalIssues: Number,
                lastAssessed: Date
            }]
        },
        incidents: [{
            id: String,
            type: String,
            severity: String,
            status: String,
            detectedAt: Date,
            resolvedAt: Date,
            impact: String
        }]
    },
    recommendations: [{
        priority: {
            type: String,
            enum: ['low', 'medium', 'high']
        },
        category: String,
        action: String,
        impact: String,
        deadline: Date,
        resources: [String],
        estimatedEffort: String
    }],
    metrics: {
        performance: {
            responseTime: Number,
            resourceUsage: {
                cpu: Number,
                memory: Number,
                disk: Number,
                network: Number
            },
            score: Number
        },
        security: {
            threatCount: Number,
            criticalVulnerabilities: Number,
            failedLogins: Number,
            incidentResponseTime: Number,
            patchStatus: Number
        },
        trends: {
            threatTrend: {
                type: String,
                enum: ['increasing', 'stable', 'decreasing']
            },
            securityScore: Number,
            riskTrend: {
                current: Number,
                previous: Number,
                change: Number
            }
        }
    },
    metadata: {
        version: String,
        generator: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        tags: [String],
        categories: [String]
    },
    serviceInfo: {
        timestamp: {
            type: Date,
            default: Date.now
        },
        maintainer: {
            type: String,
            default: 'Teeksss'
        },
        version: {
            type: String,
            default: '3.3.2'
        },
        buildNumber: {
            type: String,
            default: '202505160725'
        }
    }
}, {
    timestamps: true
});

export const SecurityReport = mongoose.model('SecurityReport', SecurityReportSchema);
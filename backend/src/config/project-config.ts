export const ProjectConfiguration = {
    system: {
        version: '3.0.3',
        lastUpdate: '2025-05-16 06:29:54',
        buildNumber: '202505160629',
        maintainer: 'Teeksss',
        environment: process.env.NODE_ENV || 'development',
        projectName: 'NDR-Enhanced'
    },
    features: {
        realTimeMonitoring: true,
        threatIntelligence: true,
        automatedResponse: true,
        advancedAnalytics: true,
        mlBasedDetection: true,
        behavioralAnalysis: true
    },
    security: {
        monitoring: {
            interval: 60000,
            retentionDays: 90,
            alertThreshold: 0.75
        },
        analysis: {
            mlModelVersion: '2.1.0',
            minConfidenceScore: 0.85,
            maxAnalysisDuration: 300000
        }
    }
};
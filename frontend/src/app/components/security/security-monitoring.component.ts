import { Component, OnInit, OnDestroy } from '@angular/core';
import { SecurityService } from '../../services/security.service';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

@Component({
    selector: 'app-security-monitoring',
    templateUrl: './security-monitoring.component.html',
    styleUrls: ['./security-monitoring.component.scss']
})
export class SecurityMonitoringComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    
    componentInfo = {
        timestamp: '2025-05-16 06:59:56',
        maintainer: 'Teeksss',
        version: '3.2.2',
        buildNumber: '202505160659'
    };

    securityMetrics = {
        threatLevel: 0,
        activeThreats: 0,
        mitigatedThreats: 0,
        systemHealth: 100
    };

    recentAlerts = [];
    activeMitigations = [];
    systemStatus = 'normal';
    lastUpdateTime = new Date();

    constructor(private securityService: SecurityService) {}

    ngOnInit() {
        this.initializeMonitoring();
        this.startRealTimeUpdates();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private async initializeMonitoring() {
        try {
            await Promise.all([
                this.loadSecurityMetrics(),
                this.loadRecentAlerts(),
                this.loadActiveMitigations()
            ]);
            this.lastUpdateTime = new Date();
        } catch (error) {
            console.error('Security monitoring initialization error:', error);
        }
    }

    private startRealTimeUpdates() {
        interval(30000).pipe(
            takeUntil(this.destroy$),
            switchMap(() => this.securityService.getSecurityUpdates())
        ).subscribe(
            update => this.handleSecurityUpdate(update),
            error => console.error('Real-time update error:', error)
        );
    }

    private async loadSecurityMetrics() {
        const metrics = await this.securityService.getSecurityMetrics();
        this.updateMetrics(metrics);
    }

    private async loadRecentAlerts() {
        this.recentAlerts = await this.securityService.getRecentAlerts();
    }

    private async loadActiveMitigations() {
        this.activeMitigations = await this.securityService.getActiveMitigations();
    }

    private handleSecurityUpdate(update: any) {
        this.updateMetrics(update.metrics);
        if (update.alerts) {
            this.handleNewAlerts(update.alerts);
        }
        if (update.mitigations) {
            this.updateMitigations(update.mitigations);
        }
        this.lastUpdateTime = new Date();
    }

    private updateMetrics(metrics: any) {
        this.securityMetrics = { ...metrics };
        this.systemStatus = this.calculateSystemStatus(metrics);
    }

    private handleNewAlerts(alerts: any[]) {
        this.recentAlerts = [...alerts, ...this.recentAlerts]
            .slice(0, 50); // Son 50 alert'i tut
    }

    private updateMitigations(mitigations: any[]) {
        this.activeMitigations = mitigations;
    }

    private calculateSystemStatus(metrics: any): string {
        if (metrics.threatLevel > 75) return 'critical';
        if (metrics.threatLevel > 50) return 'warning';
        return 'normal';
    }

    async acknowledgeAlert(alertId: string) {
        try {
            await this.securityService.acknowledgeAlert(alertId);
            this.recentAlerts = this.recentAlerts.map(alert => 
                alert.id === alertId 
                    ? { ...alert, acknowledged: true }
                    : alert
            );
        } catch (error) {
            console.error('Error acknowledging alert:', error);
        }
    }

    async startMitigation(threatId: string) {
        try {
            const mitigation = await this.securityService.startMitigation(threatId);
            this.activeMitigations = [...this.activeMitigations, mitigation];
        } catch (error) {
            console.error('Error starting mitigation:', error);
        }
    }
}
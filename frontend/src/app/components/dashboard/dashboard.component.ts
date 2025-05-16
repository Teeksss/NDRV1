import { Component, OnInit, OnDestroy } from '@angular/core';
import { SecurityService } from '../../services/security.service';
import { NetworkService } from '../../services/network.service';
import { AnalyticsService } from '../../services/analytics.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    
    dashboardInfo = {
        timestamp: '2025-05-16 06:52:04',
        maintainer: 'Teeksss',
        version: '3.2.1',
        buildNumber: '202505160652'
    };

    metrics = {
        security: null,
        network: null,
        system: null
    };

    alerts = [];
    recentEvents = [];
    systemStatus = {
        cpu: 0,
        memory: 0,
        network: 0
    };

    constructor(
        private securityService: SecurityService,
        private networkService: NetworkService,
        private analyticsService: AnalyticsService
    ) {}

    async ngOnInit() {
        await this.initializeDashboard();
        this.startRealTimeUpdates();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private async initializeDashboard() {
        try {
            await Promise.all([
                this.loadSecurityMetrics(),
                this.loadNetworkMetrics(),
                this.loadSystemMetrics(),
                this.loadRecentAlerts(),
                this.loadRecentEvents()
            ]);
        } catch (error) {
            console.error('Dashboard initialization error:', error);
        }
    }

    private startRealTimeUpdates() {
        this.securityService.getSecurityUpdates()
            .pipe(takeUntil(this.destroy$))
            .subscribe(update => this.handleSecurityUpdate(update));

        this.networkService.getNetworkUpdates()
            .pipe(takeUntil(this.destroy$))
            .subscribe(update => this.handleNetworkUpdate(update));

        this.analyticsService.getSystemUpdates()
            .pipe(takeUntil(this.destroy$))
            .subscribe(update => this.handleSystemUpdate(update));
    }

    private async loadSecurityMetrics() {
        this.metrics.security = await this.securityService.getMetrics();
    }

    private async loadNetworkMetrics() {
        this.metrics.network = await this.networkService.getMetrics();
    }

    private async loadSystemMetrics() {
        this.metrics.system = await this.analyticsService.getSystemMetrics();
    }

    private async loadRecentAlerts() {
        this.alerts = await this.securityService.getRecentAlerts();
    }

    private async loadRecentEvents() {
        this.recentEvents = await this.securityService.getRecentEvents();
    }

    private handleSecurityUpdate(update: any) {
        this.metrics.security = update.metrics;
        if (update.alerts) {
            this.alerts = [...update.alerts, ...this.alerts].slice(0, 10);
        }
    }

    private handleNetworkUpdate(update: any) {
        this.metrics.network = update.metrics;
        this.systemStatus.network = update.status;
    }

    private handleSystemUpdate(update: any) {
        this.metrics.system = update.metrics;
        this.systemStatus.cpu = update.cpu;
        this.systemStatus.memory = update.memory;
    }
}
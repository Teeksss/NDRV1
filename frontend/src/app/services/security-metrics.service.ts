import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SecurityMetricsService {
    private readonly apiUrl = `${environment.apiUrl}/security/metrics`;
    private readonly serviceInfo = {
        timestamp: '2025-05-16 07:01:21',
        maintainer: 'Teeksss',
        version: '3.2.2',
        buildNumber: '202505160701'
    };

    private metricsSubject = new BehaviorSubject<any>(null);
    private updateInterval = 60000; // 1 dakika

    constructor(private http: HttpClient) {
        this.startPeriodicUpdates();
    }

    getMetrics(): Observable<any> {
        return this.metricsSubject.asObservable();
    }

    async refreshMetrics(): Promise<void> {
        try {
            const metrics = await this.fetchMetrics();
            this.metricsSubject.next(this.processMetrics(metrics));
        } catch (error) {
            console.error('Failed to refresh metrics:', error);
            throw error;
        }
    }

    private startPeriodicUpdates(): void {
        timer(0, this.updateInterval).pipe(
            switchMap(() => this.fetchMetrics())
        ).subscribe(
            metrics => this.metricsSubject.next(this.processMetrics(metrics)),
            error => console.error('Periodic update error:', error)
        );
    }

    private async fetchMetrics(): Promise<any> {
        const response = await this.http.get(this.apiUrl, {
            headers: {
                'X-Service-Version': this.serviceInfo.version,
                'X-Build-Number': this.serviceInfo.buildNumber
            }
        }).toPromise();

        return response;
    }

    private processMetrics(metrics: any): any {
        return {
            ...metrics,
            processedAt: new Date().toISOString(),
            trends: this.calculateTrends(metrics),
            status: this.calculateStatus(metrics)
        };
    }

    private calculateTrends(metrics: any): any {
        // Trend hesaplama mantığı
        return {
            threatLevel: this.calculateTrendPercentage(metrics.threatLevel),
            systemHealth: this.calculateTrendPercentage(metrics.systemHealth),
            activeThreats: this.calculateTrendPercentage(metrics.activeThreats)
        };
    }

    private calculateTrendPercentage(value: number): number {
        // Trend yüzde hesaplama mantığı
        return value;
    }

    private calculateStatus(metrics: any): string {
        if (metrics.threatLevel > 75 || metrics.systemHealth < 50) {
            return 'critical';
        } else if (metrics.threatLevel > 50 || metrics.systemHealth < 75) {
            return 'warning';
        }
        return 'normal';
    }
}
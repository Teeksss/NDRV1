import { Component, OnInit } from '@angular/core';
import { SecurityService } from './services/security.service';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';

@Component({
    selector: 'app-root',
    template: `
        <app-header 
            [user]="currentUser" 
            [systemStatus]="systemStatus"
            (themeChange)="onThemeChange($event)">
        </app-header>
        
        <main class="main-content" [class.dark-theme]="isDarkTheme">
            <app-sidebar 
                [menuItems]="navigationItems"
                [collapsed]="sidebarCollapsed">
            </app-sidebar>
            
            <div class="content-wrapper">
                <router-outlet></router-outlet>
            </div>
        </main>

        <app-footer 
            [version]="appInfo.version"
            [lastUpdate]="appInfo.lastUpdate"
            [maintainer]="appInfo.maintainer">
        </app-footer>

        <app-notification></app-notification>
    `
})
export class AppComponent implements OnInit {
    appInfo = {
        version: '3.2.0',
        lastUpdate: '2025-05-16 06:51:00',
        maintainer: 'Teeksss',
        buildNumber: '202505160651'
    };

    currentUser: any;
    systemStatus: any;
    isDarkTheme = false;
    sidebarCollapsed = false;
    navigationItems = [
        { title: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
        { title: 'Security', icon: 'security', route: '/security' },
        { title: 'Network', icon: 'network', route: '/network' },
        { title: 'Analytics', icon: 'analytics', route: '/analytics' },
        { title: 'Settings', icon: 'settings', route: '/settings' }
    ];

    constructor(
        private securityService: SecurityService,
        private authService: AuthService,
        private themeService: ThemeService
    ) {}

    async ngOnInit() {
        this.initializeApp();
    }

    private async initializeApp() {
        try {
            await this.loadUserData();
            await this.loadSystemStatus();
            this.initializeTheme();
            this.startRealTimeUpdates();
        } catch (error) {
            console.error('App initialization error:', error);
        }
    }

    private async loadUserData() {
        this.currentUser = await this.authService.getCurrentUser();
    }

    private async loadSystemStatus() {
        this.systemStatus = await this.securityService.getSystemStatus();
    }

    private initializeTheme() {
        this.isDarkTheme = this.themeService.getCurrentTheme() === 'dark';
    }

    private startRealTimeUpdates() {
        this.securityService.startRealTimeUpdates();
    }

    onThemeChange(isDark: boolean) {
        this.isDarkTheme = isDark;
        this.themeService.setTheme(isDark ? 'dark' : 'light');
    }
}
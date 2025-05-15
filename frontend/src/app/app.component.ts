import { Component, OnInit } from '@angular/core';
import { ThemeService } from './services/theme.service';
import { WebsocketService } from './services/websocket.service';
import { AuthService } from './services/auth.service';
import { NotificationService } from './services/notification.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'NDR Korelasyon Motoru';
  sidebarCollapsed = false;
  isLoggedIn = false;
  appVersion = environment.version;

  constructor(
    private themeService: ThemeService,
    private websocketService: WebsocketService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize theme
    this.themeService.initializeTheme();

    // Listen for authentication status changes
    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
      
      // Connect to WebSocket when logged in
      if (isLoggedIn) {
        this.websocketService.connect();
      } else {
        this.websocketService.disconnect();
      }
    });

    // Track page navigation for analytics
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.trackPageView(event.urlAfterRedirects);
      });

    // Initialize notification listeners
    this.initializeNotificationListeners();
  }

  /**
   * Toggle sidebar collapsed state
   */
  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  /**
   * Initialize notification listeners for real-time alerts
   */
  private initializeNotificationListeners() {
    // Only set up listeners if user is logged in
    if (this.isLoggedIn) {
      // Listen for alert notifications
      this.websocketService.onEvent('alert')
        .subscribe(alert => {
          this.notificationService.showNotification(
            `New Alert: ${alert.title}`,
            alert.severity,
            `/alerts/${alert.id}`
          );
        });

      // Listen for system notifications
      this.websocketService.onEvent('notification')
        .subscribe(notification => {
          this.notificationService.showNotification(
            notification.title,
            notification.type,
            notification.link
          );
        });
    }
  }

  /**
   * Track page view for analytics
   */
  private trackPageView(url: string) {
    // Implement analytics tracking here
    console.log(`Page view: ${url}`);
  }
}
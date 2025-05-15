import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { NotificationService } from '../../services/notification.service';
import { Observable } from 'rxjs';
import { User } from '../../models/user.model';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  @Input() sidebarCollapsed: boolean = false;
  @Output() toggleSidebar = new EventEmitter<void>();
  
  currentUser$: Observable<User | null>;
  isDarkTheme: boolean = false;
  notificationCount: number = 0;
  isConnected: boolean = false;

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private notificationService: NotificationService,
    private websocketService: WebsocketService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Get theme
    this.isDarkTheme = this.themeService.isDarkTheme();
    this.themeService.currentTheme$.subscribe(() => {
      this.isDarkTheme = this.themeService.isDarkTheme();
    });
    
    // Get unread notification count
    this.getUnreadNotificationCount();
    
    // Listen for new notifications
    this.websocketService.onEvent('notification').subscribe(() => {
      this.getUnreadNotificationCount();
    });
    
    // Check websocket connection status
    this.isConnected = this.websocketService.isConnected();
    this.websocketService.connectionStatus$.subscribe(status => {
      this.isConnected = status;
    });
  }

  /**
   * Toggle sidebar
   */
  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  /**
   * Toggle theme
   */
  onToggleTheme(): void {
    this.themeService.toggleTheme();
  }

  /**
   * Log out user
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Navigate to profile page
   */
  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  /**
   * Get unread notification count
   */
  getUnreadNotificationCount(): void {
    this.notificationService.getUnreadCount().subscribe(
      count => {
        this.notificationCount = count.unreadCount;
      },
      error => {
        console.error('Error fetching notification count:', error);
      }
    );
  }

  /**
   * Navigate to notifications page
   */
  goToNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  /**
   * Get user's initials for avatar
   */
  getUserInitials(user: User): string {
    if (!user || !user.name) return '?';
    
    const names = user.name.split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    } else {
      return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    }
  }
}
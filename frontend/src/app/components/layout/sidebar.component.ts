import { Component, OnInit, Input } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { User } from '../../models/user.model';
import { environment } from '../../../environments/environment';

interface MenuItem {
  title: string;
  icon: string;
  route: string;
  activePattern?: RegExp;
  children?: MenuItem[];
  expanded?: boolean;
  disabled?: boolean;
  requiredRole?: string;
  featureFlag?: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  @Input() collapsed: boolean = false;
  
  menuItems: MenuItem[] = [];
  activeMenuItem: string = '';
  currentUser$: Observable<User | null>;
  featureFlags = environment.featureFlags;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Initialize menu items
    this.initializeMenu();
    
    // Set active menu item based on current route
    this.setActiveMenuItem(this.router.url);
    
    // Update active menu item on route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.setActiveMenuItem(event.urlAfterRedirects);
      });
  }

  /**
   * Initialize sidebar menu items
   */
  private initializeMenu(): void {
    this.menuItems = [
      {
        title: 'Dashboard',
        icon: 'dashboard',
        route: '/dashboard',
        activePattern: /^\/dashboard/
      },
      {
        title: 'Alerts',
        icon: 'notifications_active',
        route: '/alerts',
        activePattern: /^\/alerts/
      },
      {
        title: 'Events',
        icon: 'event_note',
        route: '/events',
        activePattern: /^\/events/
      },
      {
        title: 'Entities',
        icon: 'devices',
        route: '/entities',
        activePattern: /^\/entities/
      },
      {
        title: 'Correlation Rules',
        icon: 'rule',
        route: '/correlation-rules',
        activePattern: /^\/correlation-rules/
      },
      {
        title: 'Reports',
        icon: 'assessment',
        route: '/reports',
        activePattern: /^\/reports/,
        featureFlag: 'enableReports'
      },
      {
        title: 'Threat Intelligence',
        icon: 'security',
        route: '/threat-intel',
        activePattern: /^\/threat-intel/,
        featureFlag: 'enableThreatIntelligence'
      },
      {
        title: 'Settings',
        icon: 'settings',
        route: '/settings',
        children: [
          {
            title: 'Users',
            icon: 'people',
            route: '/settings/users',
            requiredRole: 'admin'
          },
          {
            title: 'System',
            icon: 'tune',
            route: '/settings/system',
            requiredRole: 'admin'
          },
          {
            title: 'API Keys',
            icon: 'vpn_key',
            route: '/settings/api-keys',
            requiredRole: 'admin'
          }
        ],
        expanded: false
      }
    ];
  }

  /**
   * Set active menu item based on current route
   */
  private setActiveMenuItem(url: string): void {
    // Find menu item that matches the current route
    const findActiveItem = (items: MenuItem[]): boolean => {
      for (const item of items) {
        if (item.activePattern && item.activePattern.test(url)) {
          this.activeMenuItem = item.route;
          return true;
        }
        
        if (item.children) {
          const found = findActiveItem(item.children);
          if (found) {
            item.expanded = true;
            return true;
          }
        }
      }
      return false;
    };
    
    findActiveItem(this.menuItems);
  }

  /**
   * Toggle expanded state of menu item with children
   */
  toggleMenuItem(item: MenuItem, event: Event): void {
    event.preventDefault();
    item.expanded = !item.expanded;
  }

  /**
   * Check if user has the required role for a menu item
   */
  hasRequiredRole(requiredRole?: string): boolean {
    if (!requiredRole) return true;
    
    const user = this.authService.getCurrentUser();
    if (!user) return false;
    
    if (requiredRole === 'admin') {
      return this.authService.isAdmin();
    }
    
    return user.role === requiredRole;
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(featureFlag?: string): boolean {
    if (!featureFlag) return true;
    return this.featureFlags[featureFlag] === true;
  }
}
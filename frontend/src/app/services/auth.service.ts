import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private jwtHelper = new JwtHelperService();
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);

  // Observables for components to subscribe to
  public currentUser$ = this.currentUserSubject.asObservable();
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Check if user is logged in on service initialization
    this.checkAuthStatus();
  }

  /**
   * Check authentication status
   */
  checkAuthStatus(): void {
    const token = this.getToken();
    
    if (token && !this.jwtHelper.isTokenExpired(token)) {
      // Token exists and not expired
      this.getUserProfile().subscribe();
    } else {
      // No token or expired token
      this.clearAuthData();
    }
  }

  /**
   * Login user
   */
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(response => {
          if (response && response.accessToken) {
            this.setToken(response.accessToken);
            this.setRefreshToken(response.refreshToken);
            this.getUserProfile().subscribe();
          }
        })
      );
  }

  /**
   * Register new user
   */
  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/register`, userData);
  }

  /**
   * Logout user
   */
  logout(): void {
    // Call logout endpoint if available
    this.http.post(`${this.apiUrl}/auth/logout`, {})
      .pipe(
        catchError(error => {
          console.error('Error during logout:', error);
          return of(null);
        })
      )
      .subscribe(() => {
        this.handleLogout();
      });
  }

  /**
   * Handle logout actions
   */
  private handleLogout(): void {
    this.clearAuthData();
    this.router.navigate(['/login']);
  }

  /**
   * Clear authentication data
   */
  private clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
  }

  /**
   * Refresh token
   */
  refreshToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return of(null);
    }
    
    return this.http.post<any>(`${this.apiUrl}/auth/refresh`, { refreshToken })
      .pipe(
        tap(response => {
          if (response && response.accessToken) {
            this.setToken(response.accessToken);
            if (response.refreshToken) {
              this.setRefreshToken(response.refreshToken);
            }
          }
        }),
        catchError(error => {
          this.clearAuthData();
          return of(null);
        })
      );
  }

  /**
   * Get user profile
   */
  getUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/profile`)
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          this.isLoggedInSubject.next(true);
        }),
        catchError(error => {
          this.clearAuthData();
          return of(null);
        })
      );
  }

  /**
   * Update user profile
   */
  updateProfile(userData: any): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/auth/profile`, userData)
      .pipe(
        tap(updatedUser => {
          this.currentUserSubject.next(updatedUser);
        })
      );
  }

  /**
   * Change password
   */
  changePassword(passwordData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/change-password`, passwordData);
  }

  /**
   * Request password reset
   */
  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  /**
   * Reset password with token
   */
  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, { token, password });
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.getValue();
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  /**
   * Set JWT token in local storage
   */
  private setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  /**
   * Get JWT token from local storage
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Set refresh token in local storage
   */
  private setRefreshToken(token: string): void {
    localStorage.setItem('refreshToken', token);
  }

  /**
   * Get refresh token from local storage
   */
  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }
}
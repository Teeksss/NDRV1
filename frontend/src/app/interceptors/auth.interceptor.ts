import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Get the auth token
    const token = this.authService.getToken();

    // Clone the request and add the token if available
    if (token) {
      request = this.addToken(request, token);
    }

    // Handle the request and catch any errors
    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          // Try to refresh the token if unauthorized
          return this.handle401Error(request, next);
        } else {
          // Pass through all other errors
          return throwError(() => error);
        }
      })
    );
  }

  /**
   * Add authorization token to request headers
   */
  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  /**
   * Handle 401 (Unauthorized) errors by refreshing the token
   */
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip certain URLs like login or refresh
    if (request.url.includes('auth/login') || request.url.includes('auth/refresh')) {
      return throwError(() => new Error('Authentication failed'));
    }

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap(response => {
          this.isRefreshing = false;

          if (response && response.accessToken) {
            this.refreshTokenSubject.next(response.accessToken);
            return next.handle(this.addToken(request, response.accessToken));
          }

          // If refresh failed, logout and pass through error
          this.authService.logout();
          return throwError(() => new Error('Token refresh failed'));
        }),
        catchError(error => {
          this.isRefreshing = false;
          this.authService.logout();
          return throwError(() => error);
        })
      );
    } else {
      // Wait for the token to be refreshed
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => next.handle(this.addToken(request, token)))
      );
    }
  }
}
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private snackBar: MatSnackBar) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An error occurred';
        
        // Skip error notifications for certain status codes
        const skipErrorCodes = [401]; // 401 handled by auth interceptor
        
        if (!skipErrorCodes.includes(error.status)) {
          if (error.error instanceof ErrorEvent) {
            // Client-side error
            errorMessage = `Error: ${error.error.message}`;
          } else {
            // Server-side error
            errorMessage = this.getServerErrorMessage(error);
          }
          
          // Show error notification
          this.showErrorNotification(errorMessage);
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Get user-friendly error message from server response
   */
  private getServerErrorMessage(error: HttpErrorResponse): string {
    // Check if error response has a message property
    if (error.error && (error.error.message || error.error.error)) {
      return error.error.message || error.error.error;
    }
    
    // Default messages based on status code
    switch (error.status) {
      case 400:
        return 'Bad request. Please check your input.';
      case 403:
        return 'Access denied. You do not have permission to access this resource.';
      case 404:
        return 'Resource not found.';
      case 500:
        return 'Internal server error. Please try again later.';
      case 503:
        return 'Service unavailable. Please try again later.';
      default:
        return `Server error: ${error.status} ${error.statusText}`;
    }
  }

  /**
   * Show error notification to user
   */
  private showErrorNotification(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['notification-error']
    });
  }
}
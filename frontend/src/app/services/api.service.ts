import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  /**
   * Generic GET request
   */
  get<T>(endpoint: string, params: any = {}): Observable<T> {
    const url = `${this.apiUrl}/${endpoint}`;
    let httpParams = new HttpParams();
    
    // Convert params object to HttpParams
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        httpParams = httpParams.append(key, params[key]);
      }
    });
    
    return this.http.get<T>(url, { params: httpParams })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Generic POST request
   */
  post<T>(endpoint: string, data: any): Observable<T> {
    const url = `${this.apiUrl}/${endpoint}`;
    return this.http.post<T>(url, data)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Generic PUT request
   */
  put<T>(endpoint: string, data: any): Observable<T> {
    const url = `${this.apiUrl}/${endpoint}`;
    return this.http.put<T>(url, data)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Generic PATCH request
   */
  patch<T>(endpoint: string, data: any): Observable<T> {
    const url = `${this.apiUrl}/${endpoint}`;
    return this.http.patch<T>(url, data)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Generic DELETE request
   */
  delete<T>(endpoint: string): Observable<T> {
    const url = `${this.apiUrl}/${endpoint}`;
    return this.http.delete<T>(url)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Download file
   */
  downloadFile(endpoint: string, params: any = {}): Observable<Blob> {
    const url = `${this.apiUrl}/${endpoint}`;
    let httpParams = new HttpParams();
    
    // Convert params object to HttpParams
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        httpParams = httpParams.append(key, params[key]);
      }
    });
    
    return this.http.get(url, {
      params: httpParams,
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Upload file
   */
  uploadFile(endpoint: string, file: File, additionalData?: any): Observable<any> {
    const url = `${this.apiUrl}/${endpoint}`;
    const formData = new FormData();
    
    formData.append('file', file, file.name);
    
    // Add any additional data
    if (additionalData) {
      for (const key in additionalData) {
        if (additionalData.hasOwnProperty(key)) {
          formData.append(key, additionalData[key]);
        }
      }
    }
    
    return this.http.post(url, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any) {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      
      // Check if token is expired
      if (error.status === 401) {
        // Handle unauthorized errors
        // this.authService.logout();
      }
    }
    
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

export class ApiService {
  private static instance: ApiService;
  private api: AxiosInstance;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
    
    this.api = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    this.setupInterceptors();
  }

  // Singleton instance getter
  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    
    return ApiService.instance;
  }

  // Setup interceptors for authorization and error handling
  private setupInterceptors() {
    // Request interceptor - add token to headers
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Handle unauthenticated responses (401)
        if (error.response?.status === 401 && window.location.pathname !== '/login') {
          // Don't redirect if we're already trying to refresh the token
          if (!error.config.url?.includes('auth/refresh-token')) {
            // Try to refresh token
            this.refreshToken()
              .then(success => {
                if (!success) {
                  // If token refresh fails, logout
                  this.handleLogout();
                }
              })
              .catch(() => {
                this.handleLogout();
              });
          } else {
            // If we get 401 while trying to refresh token, logout
            this.handleLogout();
          }
        }
        
        // Handle forbidden responses (403)
        if (error.response?.status === 403) {
          // Optionally redirect to a "forbidden" page
          console.error('Access forbidden');
        }
        
        // Log API errors
        const errorMessage = error.response?.data?.message || error.message;
        console.error(`API Error: ${errorMessage}`, error);
        
        return Promise.reject(error);
      }
    );
  }

  // Logout handler
  private handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    
    // Redirect to login page
    window.location.href = '/login';
  }

  // Token refresh logic
  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        return false;
      }
      
      const response = await axios.post(
        `${this.baseUrl}/auth/refresh-token`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'refresh-token': refreshToken
          }
        }
      );
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  }

  // Generic request method
  public async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api(config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Convenience methods for common HTTP verbs
  public async get<T>(url: string, params?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      ...config,
      method: 'GET',
      url,
      params,
    });
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      ...config,
      method: 'POST',
      url,
      data,
    });
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      ...config,
      method: 'PUT',
      url,
      data,
    });
  }

  public async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      ...config,
      method: 'PATCH',
      url,
      data,
    });
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      ...config,
      method: 'DELETE',
      url,
    });
  }
}

export default ApiService.getInstance();
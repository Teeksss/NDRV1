import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Default API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
const API_TIMEOUT = 30000; // 30 seconds

// Create a custom Axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor to attach auth token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  // If token exists, attach to Authorization header
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, 
(error) => {
  return Promise.reject(error);
});

// Response interceptor to handle common responses
axiosInstance.interceptors.response.use(
  (response) => {
    // Return data directly if available
    return response.data;
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with a status code outside the 2xx range
      const status = error.response.status;
      
      // Handle authentication errors
      if (status === 401) {
        // Clear token and redirect to login if not already there
        localStorage.removeItem('token');
        
        // Only redirect if we're not already on the login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      // Create a more descriptive error
      const message = error.response.data?.message || 'Server error occurred';
      const errorObj = new Error(message);
      errorObj.name = 'ApiError';
      
      return Promise.reject(errorObj);
    } else if (error.request) {
      // Request was made but no response received
      const networkError = new Error('Network error. Please check your connection.');
      networkError.name = 'NetworkError';
      
      return Promise.reject(networkError);
    } else {
      // Something happened in setting up the request
      return Promise.reject(error);
    }
  }
);

// API client class
class ApiClient {
  // GET request
  async get<T = any>(url: string, params?: any): Promise<T> {
    const config: AxiosRequestConfig = { params };
    return axiosInstance.get<T, T>(url, config);
  }
  
  // POST request
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return axiosInstance.post<T, T>(url, data, config);
  }
  
  // PUT request
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return axiosInstance.put<T, T>(url, data, config);
  }
  
  // PATCH request
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return axiosInstance.patch<T, T>(url, data, config);
  }
  
  // DELETE request
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return axiosInstance.delete<T, T>(url, config);
  }
  
  // Upload file(s) with progress tracking
  async upload<T = any>(
    url: string, 
    files: File | File[], 
    onProgress?: (percentage: number) => void,
    additionalData?: Record<string, any>
  ): Promise<T> {
    const formData = new FormData();
    
    // Append files to form data
    if (Array.isArray(files)) {
      files.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });
    } else {
      formData.append('file', files);
    }
    
    // Append additional data if provided
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, JSON.stringify(value));
      });
    }
    
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };
    
    // Add progress tracking if callback provided
    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentage);
      };
    }
    
    return axiosInstance.post<T, T>(url, formData, config);
  }
  
  // Download file
  async download(url: string, fileName?: string): Promise<void> {
    try {
      const response = await axiosInstance.get(url, {
        responseType: 'blob'
      });
      
      // Create a temporary URL for the blob
      const blobUrl = window.URL.createObjectURL(new Blob([response]));
      
      // Create a link element to trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', fileName || this.getFileNameFromUrl(url));
      
      // Append link, click it, and clean up
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Release the URL
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }
  
  // Extract filename from URL or Content-Disposition header
  private getFileNameFromUrl(url: string): string {
    // Default filename from URL path
    const urlParts = url.split('/');
    return urlParts[urlParts.length - 1] || 'download';
  }
}

// Export singleton instance
export default new ApiClient();
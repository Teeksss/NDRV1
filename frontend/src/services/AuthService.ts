import apiClient from '../utils/api-client';

export class AuthService {
  async login(email: string, password: string): Promise<any> {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      
      if (response.token) {
        localStorage.setItem('token', response.token);
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
  
  async register(name: string, email: string, password: string): Promise<any> {
    try {
      const response = await apiClient.post('/auth/register', { name, email, password });
      
      if (response.token) {
        localStorage.setItem('token', response.token);
      }
      
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }
  
  async forgotPassword(email: string): Promise<any> {
    try {
      return await apiClient.post('/auth/forgot-password', { email });
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }
  
  async resetPassword(token: string, newPassword: string): Promise<any> {
    try {
      return await apiClient.post('/auth/reset-password', { token, newPassword });
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }
  
  async changePassword(currentPassword: string, newPassword: string): Promise<any> {
    try {
      return await apiClient.post('/auth/change-password', { currentPassword, newPassword });
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }
  
  async refreshToken(): Promise<any> {
    try {
      const response = await apiClient.post('/auth/refresh-token');
      
      if (response.token) {
        localStorage.setItem('token', response.token);
      }
      
      return response;
    } catch (error) {
      console.error('Refresh token error:', error);
      throw error;
    }
  }
  
  async getCurrentUser(): Promise<any> {
    try {
      return await apiClient.get('/auth/me');
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }
  
  async updateProfile(profileData: any): Promise<any> {
    try {
      return await apiClient.patch('/auth/profile', profileData);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
  
  async uploadAvatar(file: File, onProgress?: (percent: number) => void): Promise<any> {
    try {
      return await apiClient.upload('/auth/avatar', file, onProgress);
    } catch (error) {
      console.error('Upload avatar error:', error);
      throw error;
    }
  }
  
  logout(): void {
    localStorage.removeItem('token');
  }
  
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
  
  async verifyEmail(token: string): Promise<any> {
    try {
      return await apiClient.post('/auth/verify-email', { token });
    } catch (error) {
      console.error('Verify email error:', error);
      throw error;
    }
  }
  
  async resendVerificationEmail(): Promise<any> {
    try {
      return await apiClient.post('/auth/resend-verification');
    } catch (error) {
      console.error('Resend verification email error:', error);
      throw error;
    }
  }
}

export default AuthService;
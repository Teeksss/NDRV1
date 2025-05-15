import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { AuthService } from '../services/AuthService';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  lastLogin?: Date;
  preferences?: Record<string, any>;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  forgotPassword: async () => {},
  resetPassword: async () => {},
  updateProfile: async () => {},
  clearError: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const authService = new AuthService();
  
  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Get current user data
        const userData = await authService.getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Auth check error:', err);
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.login(email, password);
      
      if (response.token) {
        localStorage.setItem('token', response.token);
        setUser(response.user);
        setIsAuthenticated(true);
      } else {
        throw new Error('No token received from server');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      setIsAuthenticated(false);
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Register function
  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.register(name, email, password);
      
      if (response.token) {
        localStorage.setItem('token', response.token);
        setUser(response.user);
        setIsAuthenticated(true);
      } else {
        throw new Error('No token received from server');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed';
      setError(errorMessage);
      setIsAuthenticated(false);
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    authService.logout();
  }, []);
  
  // Forgot password function
  const forgotPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await authService.forgotPassword(email);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Password reset request failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Reset password function
  const resetPassword = async (token: string, newPassword: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await authService.resetPassword(token, newPassword);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Password reset failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Update profile function
  const updateProfile = async (profileData: Partial<User>) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedUser = await authService.updateProfile(profileData);
      setUser(prev => ({ ...prev, ...updatedUser }));
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Profile update failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Clear error function
  const clearError = () => {
    setError(null);
  };
  
  // Context value
  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    clearError,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default useAuth;
import axios from 'axios';
import { API_BASE_URL } from '@/config';
import { User } from '@/models/User';

interface LoginResponse {
  token: string;
  user: User;
}

interface LoginRequest {
  username: string;
  password: string;
}

class AuthService {
  private static instance: AuthService;
  private token: string | null = null;
  private user: User | null = null;

  private constructor() {
    // İlk başlatmada token'ı localStorage'dan yükleme
    this.loadAuthState();
    
    // Axios interceptor'lar için kurulum
    this.setupAxiosInterceptors();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Kullanıcı giriş işlemi
   * @param username Kullanıcı adı
   * @param password Şifre
   * @returns Giriş bilgileri ve kullanıcı detayları
   */
  public async login(username: string, password: string): Promise<User> {
    try {
      const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/login`, {
        username,
        password
      });

      const { token, user } = response.data;
      
      // Token ve kullanıcı bilgilerini kaydet
      this.setAuthState(token, user);
      
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Authentication failed. Please check your credentials.');
    }
  }

  /**
   * Kullanıcı çıkış işlemi
   */
  public logout(): void {
    // Token ve kullanıcı bilgilerini temizle
    this.clearAuthState();
    
    // Varsa oturum kapatma API çağrısı yapılabilir
    // Burada şimdilik yalnızca yerel temizlik yapıyoruz
  }

  /**
   * Kullanıcının giriş durumunu kontrol etme
   * @returns Kullanıcı giriş yapmış mı?
   */
  public isAuthenticated(): boolean {
    return !!this.token;
  }

  /**
   * Mevcut kullanıcıyı getirme
   * @returns Giriş yapmış kullanıcı veya null
   */
  public getCurrentUser(): User | null {
    return this.user;
  }

  /**
   * Mevcut JWT token'ı getirme
   * @returns JWT token veya null
   */
  public getToken(): string | null {
    return this.token;
  }

  /**
   * Token yenileme işlemi
   * @returns Yeni token
   */
  public async refreshToken(): Promise<string> {
    try {
      const response = await axios.post<{ token: string }>(`${API_BASE_URL}/auth/refresh`, {}, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });

      const { token } = response.data;
      
      // Yeni token'ı kaydet
      this.setToken(token);
      
      return token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout(); // Yenileme başarısız olursa oturumu kapat
      throw new Error('Session expired. Please login again.');
    }
  }

  /**
   * Kullanıcının belirli bir role sahip olup olmadığını kontrol eder
   * @param role Kontrol edilecek rol
   * @returns Kullanıcı bu role sahip mi?
   */
  public hasRole(role: string): boolean {
    return this.user?.roles?.includes(role) || false;
  }

  /**
   * Token ve kullanıcı bilgilerini kaydetme
   * @param token JWT token
   * @param user Kullanıcı bilgileri
   */
  private setAuthState(token: string, user: User): void {
    this.token = token;
    this.user = user;
    
    // LocalStorage'a kaydet
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
  }

  /**
   * Sadece token'ı güncelleme
   * @param token Yeni JWT token
   */
  private setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  /**
   * Token ve kullanıcı bilgilerini temizleme
   */
  private clearAuthState(): void {
    this.token = null;
    this.user = null;
    
    // LocalStorage'dan temizle
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  /**
   * LocalStorage'dan token ve kullanıcı bilgilerini yükleme
   */
  private loadAuthState(): void {
    const token = localStorage.getItem('auth_token');
    const userJson = localStorage.getItem('auth_user');
    
    if (token) {
      this.token = token;
    }
    
    if (userJson) {
      try {
        this.user = JSON.parse(userJson);
      } catch (e) {
        console.error('Failed to parse user data from localStorage');
        this.clearAuthState();
      }
    }
  }

  /**
   * Axios interceptor'larını kurma
   * Her istekte token otomatik olarak eklenir ve token süresi dolduğunda yenilenir
   */
  private setupAxiosInterceptors(): void {
    // İstek interceptor'u
    axios.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Yanıt interceptor'u
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // 401 hatası ve daha önce yenileme denemediysek token'ı yenile
        if (error.response?.status === 401 && !originalRequest._retry && this.token) {
          originalRequest._retry = true;
          
          try {
            const newToken = await this.refreshToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // Token yenileme başarısız olduysa oturumu kapat ve hatayı ilet
            this.logout();
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
}

// Servisin singleton instance'ını dışa aktar
export default AuthService.getInstance();
import { IAuthService } from '../interfaces/IAuthService';
import { UserProfile, UserRole, AuthUser } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Implementación real conectada a un Backend REST (Node.js/AWS).
 */
export class ApiAuthService implements IAuthService {
  private async fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('librovivo_token') : null;
    
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    return response.json();
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      return await this.fetchApi<UserProfile>(`/auth/profile/${uid}`);
    } catch (e) {
      return null;
    }
  }

  async createUserProfile(user: AuthUser, role: UserRole = 'user'): Promise<UserProfile> {
    return this.fetchApi<UserProfile>('/auth/profile', {
      method: 'POST',
      body: JSON.stringify({ ...user, role }),
    });
  }

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    // Simulación de observador basado en localStorage para una API REST
    const checkAuth = () => {
      const userJson = localStorage.getItem('librovivo_user');
      if (userJson) {
        callback(JSON.parse(userJson));
      } else {
        callback(null);
      }
    };

    // Suscribirse a eventos de storage (para múltiples pestañas)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', checkAuth);
      // Ejecución inicial
      checkAuth();
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', checkAuth);
      }
    };
  }

  async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    const result = await this.fetchApi<{ user: AuthUser, token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem('librovivo_token', result.token);
      localStorage.setItem('librovivo_user', JSON.stringify(result.user));
    }

    return result.user;
  }

  async signUpWithEmail(email: string, password: string, name: string): Promise<AuthUser> {
    const result = await this.fetchApi<{ user: AuthUser, token: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem('librovivo_token', result.token);
      localStorage.setItem('librovivo_user', JSON.stringify(result.user));
    }

    return result.user;
  }

  async signInWithGoogle(): Promise<AuthUser> {
    // En una API real, esto redirigiría a un flujo OAuth o abriría un popup
    console.warn('[ApiAuthService] signInWithGoogle — redirecting to OAuth flow (mock).');
    throw new Error('Google Sign-In not implemented for REST API yet.');
  }

  async signOut(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('librovivo_token');
      localStorage.removeItem('librovivo_user');
      // Forzar actualización de observadores en la pestaña actual
      window.dispatchEvent(new Event('storage'));
    }
  }
}

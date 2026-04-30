import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse } from '../models/tourism.models';
import { environment } from '../../environments/environment';

export type UserRole = 'ADMIN' | 'CLIENT' | 'USER' | 'FREE_TOURIST' | 'PRO_TOURIST' | 'PREMIUM_TOURIST';
export type TouristRole = 'FREE_TOURIST' | 'PRO_TOURIST' | 'PREMIUM_TOURIST';

export interface LoginResponse {
  token: string;
  id?: number;
  name: string;
  email: string;
  role: UserRole;
  photoUrl?: string;
  bio?: string;
  ownedEstablishmentId?: number;
  expiresAt?: number;
}

interface StoredAuth extends LoginResponse {
  expiresAt?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private storageKey = 'sistur_auth';
  private expiryTimer?: ReturnType<typeof setTimeout>;

  // Usando Signals do Angular 21 para performance e reatividade
  currentUser = signal<LoginResponse | null>(null);

  constructor(private http: HttpClient) {
    this.loadStorage();
  }

  login(credentials: { email: string, password: string }): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (res.data) {
          this.saveStorage(res.data);
          this.currentUser.set(res.data);
        }
      })
    );
  }

  register(userData: { name: string, email: string, password: string, role?: TouristRole }): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/register`, userData).pipe(
      tap(res => {
        if (res.data) {
          this.saveStorage(res.data);
          this.currentUser.set(res.data);
        }
      })
    );
  }

  googleLogin(idToken: string): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/google`, idToken).pipe(
      tap(res => {
        if (res.data) {
          this.saveStorage(res.data);
          this.currentUser.set(res.data);
        }
      })
    );
  }

  updateProfile(profileData: { name: string, bio: string, photoUrl: string, ownedEstablishmentId?: number | null }): Observable<ApiResponse<LoginResponse>> {
    return this.http.put<ApiResponse<LoginResponse>>(`${environment.apiUrl}/users/profile`, profileData).pipe(
      tap(res => {
        if (res.data) {
          const current = this.currentUser();
          if (current) {
            const updated = { ...current, ...res.data };
            this.saveStorage(updated);
            this.currentUser.set(updated);
          }
        }
      })
    );
  }

  logout(redirect = true) {
    this.clearSessionState();
    if (redirect && typeof window !== 'undefined') {
      window.location.href = '/login'; // Forçando recarregamento para limpar estados
    }
  }

  private loadStorage() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data) as StoredAuth;
        const expiresAt = parsed.expiresAt ?? this.decodeJwtExpiration(parsed.token);

        if (!expiresAt || expiresAt <= Date.now()) {
           this.clearSessionState();
           return;
        }

        const normalized = { ...parsed, expiresAt };
        this.currentUser.set(normalized);
        this.persistSession(normalized);
        this.scheduleExpiry(expiresAt);
      }
    } catch (e) {
      console.error('Erro ao carregar cache de autenticação', e);
      this.clearSessionState();
    }
  }

  private saveStorage(data: LoginResponse) {
    const expiresAt = this.decodeJwtExpiration(data.token) ?? (Date.now() + 2 * 60 * 60 * 1000);
    const sessionData: StoredAuth = { ...data, expiresAt };
    this.persistSession(sessionData);
    this.scheduleExpiry(expiresAt);
  }

  getUser() {
    if (!this.ensureValidSession()) {
      return null;
    }

    return this.currentUser();
  }

  isAuthenticated(): boolean {
    return !!this.getUser();
  }

  hasRole(role: UserRole): boolean {
    const user = this.getUser();
    return user ? user.role === role : false;
  }

  getRole(): UserRole | undefined {
    return this.getUser()?.role;
  }

  isFreeTier(): boolean {
    const role = this.getUser()?.role;
    return role === 'FREE_TOURIST' || role === 'USER';
  }

  private ensureValidSession(): boolean {
    const user = this.currentUser();

    if (!user) {
      return false;
    }

    const expiresAt = user.expiresAt ?? this.decodeJwtExpiration(user.token);
    if (!expiresAt || expiresAt <= Date.now()) {
      this.clearSessionState();
      return false;
    }

    return true;
  }

  private decodeJwtExpiration(token: string): number | null {
    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) {
        return null;
      }

      const normalizedPayload = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=');
      const payload = JSON.parse(atob(paddedPayload));

      return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  private scheduleExpiry(expiresAt: number) {
    this.clearExpiryTimer();

    if (typeof window === 'undefined') {
      return;
    }

    const delay = expiresAt - Date.now();
    if (delay <= 0) {
      this.clearSessionState();
      return;
    }

    this.expiryTimer = window.setTimeout(() => {
      this.logout();
    }, delay);
  }

  private persistSession(data: StoredAuth) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  private clearSessionState() {
    this.clearExpiryTimer();
    localStorage.removeItem(this.storageKey);
    this.currentUser.set(null);
  }

  private clearExpiryTimer() {
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = undefined;
    }
  }
}

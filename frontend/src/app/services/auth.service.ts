import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse } from '../models/tourism.models';
import { environment } from '../../environments/environment';

export type UserRole = 'ADMIN' | 'CLIENT' | 'USER';

export interface LoginResponse {
  token: string;
  name: string;
  email: string;
  role: UserRole;
  photoUrl?: string;
  bio?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  
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

  register(userData: { name: string, email: string, password: string }): Observable<ApiResponse<LoginResponse>> {
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

  updateProfile(profileData: { name: string, bio: string, photoUrl: string }): Observable<ApiResponse<LoginResponse>> {
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

  logout() {
    localStorage.removeItem('sistur_auth');
    this.currentUser.set(null);
    window.location.href = '/login'; // Forçando recarregamento para limpar estados
  }

  private saveStorage(data: LoginResponse) {
    localStorage.setItem('sistur_auth', JSON.stringify(data));
  }

  private loadStorage() {
    try {
      const data = localStorage.getItem('sistur_auth');
      if (data) {
        this.currentUser.set(JSON.parse(data));
      }
    } catch (e) {
      console.error('Erro ao carregar cache de autenticação', e);
      localStorage.removeItem('sistur_auth');
      this.currentUser.set(null);
    }
  }

  isAuthenticated(): boolean {
    return !!this.currentUser();
  }

  hasRole(role: UserRole): boolean {
    return this.currentUser()?.role === role;
  }
  
  getRole(): UserRole | undefined {
    return this.currentUser()?.role;
  }
}

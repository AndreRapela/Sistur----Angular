import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse } from '../models/tourism.models';

export type UserRole = 'ADMIN' | 'CLIENT' | 'USER';

export interface LoginResponse {
  token: string;
  name: string;
  email: string;
  role: UserRole;
  photoUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';
  
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

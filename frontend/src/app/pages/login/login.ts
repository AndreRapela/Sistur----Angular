import { Component, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { AnalyticsService } from '../../services/analytics.service';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html'
})
export class LoginComponent implements AfterViewInit, OnInit {
  loading = false;
  credentials = { email: '', password: '' };
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
    private analytics: AnalyticsService
  ) {}

  login() {
    const credentials = {
      email: this.credentials.email.trim(),
      password: this.credentials.password
    };

    if (!credentials.email || !credentials.password) {
      this.toastService.add({ severity: 'warn', summary: 'Atenção', detail: 'Preencha e-mail e senha.' });
      return;
    }

    this.loading = true;
    this.authService.login(credentials).subscribe({
      next: (res) => {
        this.loading = false;
        this.toastService.add({ severity: 'success', summary: 'Sucesso', detail: `Bem-vindo, ${res.data?.name}!` });
        this.analytics.conversion('AUTH', 'LOGIN_SUCCESS', res.data?.email || credentials.email || 'login', '/login');
        this.redirectAfterLogin(res.data?.role);
      },
      error: (err: any) => {
        this.loading = false;
        this.toastService.add({ severity: 'error', summary: 'Erro', detail: this.getErrorMessage(err, 'Erro ao realizar login.') });
      }
    });
  }

  ngOnInit() {
    this.analytics.pageView('/login', 'PAGE', 'login');
  }

  ngAfterViewInit() {
    this.initializeGoogleSignIn();
  }

  initializeGoogleSignIn() {
    google.accounts.id.initialize({
      client_id: '503417730999-526j17g68kcc961i8tndr83rveat8a8d.apps.googleusercontent.com',
      callback: this.handleGoogleCredentialResponse.bind(this)
    });
    google.accounts.id.renderButton(
      document.getElementById('google-btn'),
      { theme: 'outline', size: 'large', width: '100%' }
    );
  }

  handleGoogleCredentialResponse(response: any) {
    this.loading = true;
    this.authService.googleLogin(response.credential).subscribe({
      next: (res) => {
        this.loading = false;
        this.toastService.add({ severity: 'success', summary: 'Sucesso', detail: `Bem-vindo, ${res.data?.name}!` });
        this.analytics.conversion('AUTH', 'LOGIN_SUCCESS', res.data?.email || 'google', '/login');
        this.redirectAfterLogin(res.data?.role);
      },
      error: (err: any) => {
        this.loading = false;
        this.toastService.add({ severity: 'error', summary: 'Erro', detail: this.getErrorMessage(err, 'Erro ao realizar login.') });
      }
    });
  }

  onSubmit() {
    this.login();
  }

  private getErrorMessage(err: any, fallback: string) {
    return err?.error?.message || err?.message || fallback;
  }

  private redirectAfterLogin(role?: string) {
    if (role === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
      return;
    }

    if (role === 'CLIENT') {
      this.router.navigate(['/client/dashboard']);
      return;
    }

    this.router.navigate(['/home']);
  }
}

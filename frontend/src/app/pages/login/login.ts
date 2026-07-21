import { Component, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { AnalyticsService } from '../../services/analytics.service';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    google?: any;
  }
}

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
  googleSignInEnabled = Boolean(environment.googleClientId?.trim());
  private googleIdentityPromise?: Promise<any>;

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
    void this.initializeGoogleSignIn();
  }

  async initializeGoogleSignIn() {
    if (!this.googleSignInEnabled) {
      return;
    }

    try {
      const google = await this.loadGoogleIdentity();
      if (!google?.accounts?.id) {
        return;
      }

      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: this.handleGoogleCredentialResponse.bind(this)
      });

      const buttonHost = document.getElementById('google-btn');
      if (!buttonHost) {
        return;
      }

      google.accounts.id.renderButton(buttonHost, { theme: 'outline', size: 'large', width: '100%' });
    } catch {
      this.googleSignInEnabled = false;
    }
  }

  private loadGoogleIdentity(): Promise<any> {
    if (window.google?.accounts?.id) {
      return Promise.resolve(window.google);
    }

    if (this.googleIdentityPromise) {
      return this.googleIdentityPromise;
    }

    this.googleIdentityPromise = new Promise((resolve, reject) => {
      const resolveIfReady = () => {
        if (window.google?.accounts?.id) {
          resolve(window.google);
          return true;
        }
        return false;
      };

      const existingScript = document.querySelector<HTMLScriptElement>('script[data-sistur-google-identity]');
      if (existingScript) {
        if (resolveIfReady()) {
          return;
        }

        existingScript.addEventListener('load', resolveIfReady, { once: true });
        existingScript.addEventListener('error', reject, { once: true });
        window.setTimeout(() => {
          if (!resolveIfReady()) {
            reject(new Error('Google Identity indisponivel'));
          }
        }, 10000);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.setAttribute('data-sistur-google-identity', 'true');
      script.addEventListener('load', resolveIfReady, { once: true });
      script.addEventListener('error', reject, { once: true });
      window.setTimeout(() => {
        if (!resolveIfReady()) {
          reject(new Error('Google Identity indisponivel'));
        }
      }, 10000);
      document.head.appendChild(script);
    });

    return this.googleIdentityPromise;
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

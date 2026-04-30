import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-not-found-redirect',
  standalone: true,
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
      Redirecionando...
    </div>
  `
})
export class NotFoundRedirectComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    const target = this.authService.isAuthenticated() ? '/home' : '/login';
    void this.router.navigateByUrl(target, { replaceUrl: true });
  }
}

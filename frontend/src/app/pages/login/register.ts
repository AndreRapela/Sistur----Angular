import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { AnalyticsService } from '../../services/analytics.service';
import { TouristRole } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './register.html',
  styles: []
})
export class RegisterComponent implements OnInit {
  name = '';
  email = '';
  password = '';
  selectedRole: TouristRole = 'FREE_TOURIST';
  isLoading = false;
  showPassword = false;

  private auth = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private analytics = inject(AnalyticsService);

  ngOnInit() {
    this.analytics.pageView('/register', 'PAGE', 'register');
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (!this.name || !this.email || !this.password) {
      this.toastService.add({ severity: 'warn', summary: 'Aten��o', detail: 'Preencha todos os campos' });
      return;
    }

    this.isLoading = true;
    this.auth.register({ name: this.name, email: this.email, password: this.password, role: this.selectedRole }).subscribe({
      next: () => {
        this.toastService.add({ severity: 'success', summary: 'Sucesso', detail: 'Conta criada com sucesso!' });
        this.analytics.conversion('AUTH', 'REGISTER_SUCCESS', this.email, '/register');
        this.router.navigate(['/home']);
        this.isLoading = false;
      },
      error: (err) => {
        this.toastService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message || 'Falha ao criar conta. Tente novamente.' });
        this.isLoading = false;
      }
    });
  }
}

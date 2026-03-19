import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule,
    CardModule, 
    ButtonModule, 
    InputTextModule, 
    PasswordModule,
    InputGroupModule,
    InputGroupAddonModule
  ],
  template: `
    <div class="login-wrapper">
      <div class="login-container">
        <div class="text-center mb-5">
          <h1 class="logo-title">SisTur</h1>
          <p class="logo-subtitle">Crie sua conta</p>
        </div>

        <p-card styleClass="shadow-6 border-round-2xl">
          <ng-template pTemplate="title">
            <div class="text-center mb-2">Novo no SisTur?</div>
          </ng-template>
          <ng-template pTemplate="subtitle">
            <div class="text-center mb-4">Complete seus dados para começar</div>
          </ng-template>

          <form (submit)="onSubmit($event)">
            <div style="display: block; width: 100%;">
              <div style="display: block; width: 100%; margin-bottom: 1.25rem;">
                <label for="name" style="display: block; font-weight: 700; margin-bottom: 0.5rem; color: #334155;">Nome Completo</label>
                <input pInputText id="name" name="name" [(ngModel)]="name" required 
                       placeholder="Seu nome" 
                       style="display: block; width: 100%; padding: 0.75rem 1rem; font-size: 1rem; border-radius: 0.75rem; border: 1px solid #cbd5e1; color: #334155;" />
              </div>

              <div style="display: block; width: 100%; margin-bottom: 1.25rem;">
                <label for="email" style="display: block; font-weight: 700; margin-bottom: 0.5rem; color: #334155;">E-mail</label>
                <input pInputText id="email" type="email" name="email" [(ngModel)]="email" required 
                       placeholder="seu@email.com" 
                       style="display: block; width: 100%; padding: 0.75rem 1rem; font-size: 1rem; border-radius: 0.75rem; border: 1px solid #cbd5e1; color: #334155;" />
              </div>

              <div style="display: block; width: 100%; margin-bottom: 1.25rem;">
                <label for="password" style="display: block; font-weight: 700; margin-bottom: 0.5rem; color: #334155;">Senha</label>
                <p-password id="password" name="password" [(ngModel)]="password" required 
                            [toggleMask]="true"
                            placeholder="Mínimo 6 caracteres" 
                            styleClass="block-password" 
                            inputStyleClass="block-password-input"></p-password>
              </div>
            </div>

            <p-button type="submit" [label]="isLoading ? 'Cadastrando...' : 'Criar Conta'" 
                      icon="pi pi-user-plus" 
                      styleClass="w-full py-3 font-bold border-round-xl mt-2" 
                      [loading]="isLoading"></p-button>
          </form>

          <p class="text-center mt-4 text-sm">
            Já tem uma conta? <a routerLink="/login" class="no-underline text-primary font-bold">Entre aqui</a>
          </p>
        </p-card>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      padding: 1rem;
    }
    .login-container {
      width: 100%;
      max-width: 420px;
    }
    .logo-title {
      font-size: 3rem;
      font-weight: 900;
      color: var(--primary-color);
      margin: 0;
      letter-spacing: -1px;
    }
    .logo-subtitle {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #64748b;
      margin-top: 5px;
    }
    :host ::ng-deep .p-password input {
      width: 100%;
    }
    :host ::ng-deep .block-password,
    :host ::ng-deep .block-password input {
      display: block !important;
      width: 100% !important;
    }
    :host ::ng-deep .block-password-input {
      display: block !important;
      width: 100% !important;
      padding: 0.75rem 1rem !important;
      font-size: 1rem !important;
      border-radius: 0.75rem !important;
      border: 1px solid #cbd5e1 !important;
      color: #334155 !important;
    }
    :host ::ng-deep .p-password-toggle-mask-icon {
      cursor: pointer;
    }
  `]
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  isLoading = false;

  private auth = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  onSubmit(event: Event) {
    event.preventDefault();
    if (!this.name || !this.email || !this.password) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Preencha todos os campos' });
      return;
    }

    this.isLoading = true;
    this.auth.register({ name: this.name, email: this.email, password: this.password }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Conta criada com sucesso!' });
        this.router.navigate(['/home']);
        this.isLoading = false;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao criar conta. E-mail já existe?' });
        this.isLoading = false;
      }
    });
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
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
          <p class="logo-subtitle">Fernando de Noronha</p>
        </div>

        <p-card styleClass="shadow-6 border-round-2xl">
          <ng-template pTemplate="title">
            <div class="text-center mb-2">Seja Bem-vindo</div>
          </ng-template>
          <ng-template pTemplate="subtitle">
            <div class="text-center mb-4">Entre com suas credenciais do SisTur</div>
          </ng-template>

          <form (submit)="onSubmit($event)">
            <div class="flex flex-column gap-4 mb-4">
              <p-inputGroup>
                <p-inputGroupAddon>
                  <i class="pi pi-envelope"></i>
                </p-inputGroupAddon>
                <input pInputText type="email" name="email" [(ngModel)]="email" required placeholder="E-mail" class="w-full" />
              </p-inputGroup>

              <p-inputGroup>
                <p-inputGroupAddon>
                  <i class="pi pi-lock"></i>
                </p-inputGroupAddon>
                <p-password name="password" [(ngModel)]="password" required [feedback]="false" placeholder="Senha" styleClass="w-full" inputStyleClass="w-full"></p-password>
              </p-inputGroup>
            </div>

            <p-button type="submit" [label]="isLoading ? 'Entrando...' : 'Acessar Conta'" [icon]="isLoading ? 'pi pi-spin pi-spinner' : 'pi pi-sign-in'" styleClass="w-full" [loading]="isLoading"></p-button>
          </form>

          <div class="text-center mt-4">
            <span class="text-500 text-sm">Ou continue com</span>
          </div>
          
          <div class="mt-3">
             <p-button label="Google" icon="pi pi-google" styleClass="w-full p-button-outlined p-button-secondary"></p-button>
          </div>

          <p class="text-center mt-4 text-sm">
            Não tem uma conta? <a href="#" class="no-underline text-primary">Cadastre-se</a>
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
      max-width: 400px;
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
    :host ::ng-deep .p-inputgroup {
      width: 100%;
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  isLoading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

  onSubmit(event: Event) {
    event.preventDefault();
    if (!this.email || !this.password) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Preencha todos os campos' });
      return;
    }

    this.isLoading = true;
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: `Bem-vindo, ${res.data?.name}!` });
        
        const role = res.data?.role;
        if (role === 'ADMIN') this.router.navigate(['/admin/dashboard']);
        else if (role === 'CLIENT') this.router.navigate(['/client/dashboard']);
        else this.router.navigate(['/home']);
        
        this.isLoading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Credenciais inválidas' });
        this.isLoading = false;
      }
    });
  }
}

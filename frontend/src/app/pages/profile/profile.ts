import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ButtonModule, 
    FormsModule, 
    InputTextModule, 
    TextareaModule
  ],
  template: `
    <div class="profile-container min-h-screen bg-white">
      <!-- Header Estilo Instagram -->
      <header class="max-w-4xl mx-auto px-4 pt-8 pb-12">
        <div class="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-16">
          <!-- Avatar -->
          <div class="relative group">
            <div class="w-24 h-24 md:w-40 md:h-40 rounded-full overflow-hidden border-2 border-slate-100 p-1 bg-white shadow-sm">
              <img [src]="auth.currentUser()?.photoUrl || 'assets/default-avatar.png'" 
                   class="w-full h-full object-cover rounded-full">
            </div>
            @if (editMode) {
              <div class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer" (click)="photoInput.click()">
                 Alterar
              </div>
              <input #photoInput type="file" hidden (change)="onFileSelected($event)">
            }
          </div>

          <!-- Info -->
          <div class="flex-1 text-center md:text-left">
            <div class="flex flex-col md:flex-row items-center gap-4 mb-6">
              <h1 class="text-2xl font-light text-slate-800 m-0">{{ auth.currentUser()?.name }}</h1>
              <div class="flex gap-2">
                @if (!editMode) {
                  <button (click)="toggleEdit()" class="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-4 py-1.5 text-sm font-bold transition-colors">Editar perfil</button>
                  <button class="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-1.5 text-sm transition-colors"><i class="pi pi-cog"></i></button>
                } @else {
                  <button (click)="saveProfile()" class="bg-primary text-white rounded-lg px-4 py-1.5 text-sm font-bold shadow-md">Salvar</button>
                  <button (click)="toggleEdit()" class="bg-slate-50 rounded-lg px-4 py-1.5 text-sm font-bold border border-slate-200">Cancelar</button>
                }
              </div>
            </div>

            <div class="flex justify-center md:justify-start gap-10 mb-6">
              <div class="text-center md:text-left"><span class="font-bold">{{ itineraries().length }}</span> roteiros</div>
              <div class="text-center md:text-left"><span class="font-bold">154</span> seguidores</div>
              <div class="text-center md:text-left"><span class="font-bold">82</span> seguindo</div>
            </div>

            <div class="max-w-md">
              <span class="block font-bold text-slate-800 mb-1">Explorador de Noronha 🏝️</span>
              @if (!editMode) {
                <p class="text-sm leading-relaxed whitespace-pre-wrap">{{ auth.currentUser()?.bio || 'Bem-vindo ao meu perfil! Aqui compartilho minhas aventuras em Fernando de Noronha.' }}</p>
              } @else {
                <textarea pInputTextarea [(ngModel)]="tempUser.bio" rows="2" class="w-full text-sm mt-2" placeholder="Sua biografia..."></textarea>
              }
            </div>
          </div>
        </div>
      </header>

      <!-- Tabs e Grid -->
      <div class="max-w-5xl mx-auto border-t border-slate-200">
        <div class="flex justify-center gap-12 -mt-px">
          <button class="flex items-center gap-2 py-4 border-t border-slate-800 text-xs font-bold uppercase tracking-widest text-slate-800">
            <i class="pi pi-th-large"></i> Roteiros
          </button>
          <button class="flex items-center gap-2 py-4 border-none bg-transparent text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 cursor-pointer">
            <i class="pi pi-bookmark"></i> Salvos
          </button>
        </div>

        <div class="p-4">
          @if (itineraries().length === 0) {
            <div class="py-20 text-center">
              <div class="w-16 h-16 rounded-full border-2 border-slate-800 flex items-center justify-center mx-auto mb-4">
                <i class="pi pi-camera text-2xl"></i>
              </div>
              <h3 class="text-xl font-bold mb-2">Ainda não há roteiros</h3>
              <p class="text-slate-500 mb-6">Comece a planejar sua viagem agora mesmo!</p>
              <p-button label="Criar meu primeiro roteiro" routerLink="/itinerary" styleClass="p-button-rounded p-button-sm"></p-button>
            </div>
          } @else {
            <div class="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-8">
              @for (itin of itineraries(); track itin.id) {
                <div class="aspect-square relative group cursor-pointer overflow-hidden rounded-lg md:rounded-2xl shadow-sm border border-slate-100">
                  <img [src]="itin.photoUrl || 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=600&h=600&fit=crop'" 
                       class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white gap-6 transition-opacity font-bold">
                    <div class="flex items-center gap-1"><i class="pi pi-heart-fill"></i> 12</div>
                    <div class="flex items-center gap-1"><i class="pi pi-comment"></i> 3</div>
                  </div>
                  <div class="absolute bottom-4 left-4 right-4 text-white text-sm font-black truncate drop-shadow-md">
                     {{ itin.title }}
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep .p-button.p-button-sm { padding: 0.5rem 1rem; font-size: 0.875rem; }
  `]
})
export class ProfilePageComponent {
  public auth = inject(AuthService);
  private http = inject(HttpClient);
  private messageService = inject(MessageService);
  
  editMode = false;
  tempUser: any = {};
  itineraries = signal<any[]>([]);

  constructor() {
    this.loadMyItineraries();
  }

  loadMyItineraries() {
    this.http.get(`${environment.apiUrl}/itineraries/my`).subscribe({
      next: (res: any) => this.itineraries.set(res.data || []),
      error: () => console.warn('Erro ao carregar roteiros do perfil')
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.messageService.add({ severity: 'info', summary: 'Upload', detail: 'Simulando upload de imagem...' });
    }
  }

  toggleEdit() {
    this.editMode = !this.editMode;
    if (this.editMode) {
      const current = this.auth.currentUser();
      this.tempUser = {
        name: current?.name || '',
        bio: (current as any)?.bio || '',
        photoUrl: current?.photoUrl || ''
      };
    }
  }

  saveProfile() {
    this.auth.updateProfile(this.tempUser).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Perfil atualizado com sucesso!' });
        this.editMode = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao atualizar perfil' });
      }
    });
  }
}

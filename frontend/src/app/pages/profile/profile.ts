import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, CardModule, ProgressBarModule],
  template: `
    <div class="page-wrapper min-h-screen bg-slate-50 p-4 md:p-8">
      <header class="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="flex items-center gap-6">
          <div class="w-20 h-20 md:w-24 md:h-24 rounded-3xl overflow-hidden shadow-premium border-4 border-white shrink-0">
            <img [src]="$any(auth.currentUser())?.photoUrl || 'https://ui-avatars.com/api/?name=' + auth.currentUser()?.name + '&background=0077B6&color=fff'" 
                 class="w-full h-full object-cover">
          </div>
          <div>
            <span class="text-primary font-bold text-xs uppercase tracking-widest">Explorador de Noronha</span>
            <h1 class="page-title mt-1 m-0">{{ auth.currentUser()?.name }}</h1>
            <p class="text-slate-500 font-medium text-sm mt-1">{{ auth.currentUser()?.email }}</p>
          </div>
        </div>
        <div class="flex gap-3">
          <p-button label="Editar Perfil" icon="pi pi-user-edit" styleClass="p-button-outlined p-button-rounded shadow-sm"></p-button>
          <p-button label="Sair" icon="pi pi-sign-out" styleClass="p-button-text p-button-danger p-button-rounded" (click)="auth.logout()"></p-button>
        </div>
      </header>

      <div class="grid g-4">
        <!-- Digital Passport / Badges Section -->
        <div class="col-12 lg:col-8">
          <div class="bg-white rounded-[2.5rem] p-8 shadow-premium border border-slate-50 h-full">
            <div class="flex items-center justify-between mb-8">
              <h2 class="text-2xl font-black text-slate-800 tracking-tight m-0">Passaporte Digital</h2>
              <span class="px-4 py-2 bg-primary/10 text-primary rounded-xl font-bold text-xs uppercase tracking-widest">
                Level 12 • 2840 XP
              </span>
            </div>
            
            <p class="text-slate-500 font-medium mb-10 max-w-2xl">
              Seu passaporte registra cada experiência vivida em Noronha. Colecione selos visitando praias, restaurantes e participando de eventos!
            </p>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
              @for (badge of badges; track badge.id) {
                <div class="flex flex-col items-center gap-4 text-center group cursor-help transition-all hover:-translate-y-2">
                  <div [class]="'w-20 h-20 md:w-24 md:h-24 rounded-3xl flex items-center justify-center shadow-lg transition-all ' + (badge.unlocked ? badge.color + ' group-hover:shadow-2xl' : 'bg-slate-100 grayscale opacity-40')">
                    <i [class]="'pi ' + badge.icon + ' text-white text-3xl md:text-4xl'"></i>
                  </div>
                  <div>
                    <span class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{{ badge.category }}</span>
                    <h4 class="text-sm font-black text-slate-800 m-0 uppercase tracking-tight">{{ badge.name }}</h4>
                  </div>
                </div>
              }
            </div>

            <div class="mt-12 p-8 bg-slate-50 rounded-3xl border border-slate-100">
               <div class="flex items-center justify-between mb-4">
                  <span class="text-sm font-bold text-slate-700">Progresso para o Selo: "Lenda de Noronha"</span>
                  <span class="text-xs font-black text-primary uppercase">75%</span>
               </div>
               <p-progressBar [value]="75" [showValue]="false" styleClass="h-0.5rem"></p-progressBar>
               <p class="text-xs text-slate-400 mt-4 font-medium italic">Faltam apenas 2 visitas a praias do Mar de Fora para desbloquear!</p>
            </div>
          </div>
        </div>

        <!-- Sidebar Actions/Stats -->
        <div class="col-12 lg:col-4 space-y-8">
          <div class="bg-gradient-to-br from-primary to-secondary p-8 rounded-[2.5rem] text-white shadow-premium">
            <h3 class="text-xl font-black mb-6 tracking-tight">Estatísticas da Viagem</h3>
            <div class="space-y-6">
              <div class="flex items-center justify-between border-b border-white/10 pb-4">
                <span class="text-white/60 font-bold text-xs uppercase tracking-widest">Locais Visitados</span>
                <span class="text-2xl font-black">18</span>
              </div>
              <div class="flex items-center justify-between border-b border-white/10 pb-4">
                <span class="text-white/60 font-bold text-xs uppercase tracking-widest">Fotos Check-in</span>
                <span class="text-2xl font-black">42</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-white/60 font-bold text-xs uppercase tracking-widest">Dias na Ilha</span>
                <span class="text-2xl font-black">5/7</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-[2.5rem] p-8 shadow-premium border border-slate-50">
             <h3 class="text-lg font-black text-slate-800 mb-6 tracking-tight">Missões Ativas</h3>
             <div class="space-y-4">
               <div class="p-4 bg-emerald-50 rounded-2xl flex items-center gap-4">
                 <div class="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-lg shrink-0">
                   <i class="pi pi-camera"></i>
                 </div>
                 <div>
                   <h5 class="text-sm font-bold text-slate-800 m-0 leading-tight">Nascer do Sol no Forte</h5>
                   <p class="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">+500 XP</p>
                 </div>
               </div>
               <div class="p-4 bg-amber-50 rounded-2xl flex items-center gap-4">
                 <div class="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white text-lg shrink-0">
                   <i class="pi pi-map"></i>
                 </div>
                 <div>
                   <h5 class="text-sm font-bold text-slate-800 m-0 leading-tight">Explorador das Trilhas</h5>
                   <p class="text-[10px] text-amber-600 font-bold uppercase tracking-widest">3 de 5 concluídas</p>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-title { font-weight: 900; font-size: 2.5rem; color: var(--text-main); letter-spacing: -1.5px; }
  `]
})
export class ProfilePageComponent {
  badges = [
    { id: 1, name: 'Sancho', icon: 'pi-image', color: 'bg-nature', unlocked: true, category: 'Praias' },
    { id: 2, name: 'Mergulhador', icon: 'pi-info-circle', color: 'bg-secondary', unlocked: true, category: 'Aventura' },
    { id: 3, name: 'Gastronômico', icon: 'pi-shopping-cart', color: 'bg-cta', unlocked: true, category: 'Gastronomia' },
    { id: 4, name: 'Sustentável', icon: 'pi-leaf', color: 'bg-emerald-500', unlocked: true, category: 'Impacto' },
    { id: 5, name: 'Noite na Vila', icon: 'pi-moon', color: 'bg-slate-800', unlocked: false, category: 'Eventos' },
    { id: 6, name: 'Baía dos Porcos', icon: 'pi-image', color: 'bg-nature', unlocked: false, category: 'Praias' },
    { id: 7, name: 'Barco', icon: 'pi-directions', color: 'bg-primary', unlocked: false, category: 'Passeios' },
    { id: 8, name: 'Golfinho', icon: 'pi-heart-fill', color: 'bg-red-400', unlocked: true, category: 'Natureza' }
  ];

  constructor(public auth: AuthService) {}
}

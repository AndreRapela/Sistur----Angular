import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50 p-6 md:p-10">
      <header class="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span class="text-secondary font-black text-[10px] uppercase tracking-[0.2em]">Painel do Parceiro</span>
          <h1 class="text-4xl font-black text-slate-800 tracking-tight mt-2">Meu Negócio</h1>
        </div>
        <div class="flex gap-3">
          <button class="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <i class="pi pi-pencil mr-2"></i> Editar Perfil
          </button>
          <button class="px-6 py-3 bg-secondary text-white rounded-xl font-bold shadow-lg shadow-secondary/20 hover:scale-105 active:scale-95 transition-all">
            <i class="pi pi-chart-bar mr-2"></i> Ver Métricas
          </button>
        </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Stats & Business Card -->
        <div class="lg:col-span-2 space-y-8">
          <div class="bg-white rounded-[2.5rem] p-8 shadow-premium border border-slate-50 flex flex-col md:flex-row items-center gap-8">
            <div class="w-32 h-32 rounded-3xl overflow-hidden shadow-lg shrink-0 border-4 border-white">
              <img src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover">
            </div>
            <div class="text-center md:text-left">
               <h2 class="text-3xl font-black text-slate-800 mb-1 tracking-tight">Restaurante Mirante</h2>
               <p class="text-slate-500 font-medium mb-4">Gastrobar • Vila dos Remédios</p>
               <div class="flex flex-wrap justify-center md:justify-start gap-4">
                 <div class="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-xs">
                    <i class="pi pi-check-circle"></i> VERIFICADO
                 </div>
                 <div class="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl font-black text-xs">
                    <i class="pi pi-star-fill text-yellow-400"></i> 4.9 (128 avaliações)
                 </div>
               </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-6">
            <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
               <span class="text-slate-400 font-black text-[10px] uppercase tracking-widest">Reserva / Hoje</span>
               <p class="text-4xl font-black text-slate-800 mt-2">12</p>
               <div class="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                 <div class="bg-secondary h-full w-[70%]" style="width: 70%"></div>
               </div>
            </div>
            <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
               <span class="text-slate-400 font-black text-[10px] uppercase tracking-widest">Visualizações / Sem</span>
               <p class="text-4xl font-black text-slate-800 mt-2">1.4k</p>
               <div class="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                 <div class="bg-primary h-full w-[85%]" style="width: 85%"></div>
               </div>
            </div>
          </div>
        </div>

        <!-- Gamification / Badges (Roteo Insight) -->
        <div class="space-y-8">
          <div class="bg-white rounded-[2.5rem] p-8 shadow-premium border border-slate-100">
             <h3 class="text-xl font-black text-slate-800 mb-6 tracking-tight">Selos de Visitantes</h3>
             <div class="grid grid-cols-3 gap-4">
               @for (badge of badges; track badge.id) {
                 <div class="flex flex-col items-center gap-2 text-center group cursor-help" [title]="badge.description">
                   <div [class]="'w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 ' + (badge.unlocked ? badge.color : 'bg-slate-100 grayscale')">
                     <i [class]="'pi ' + badge.icon + ' text-white text-xl'"></i>
                   </div>
                   <span class="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{{badge.name}}</span>
                 </div>
               }
             </div>
             <button class="w-full mt-8 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-black text-xs rounded-2xl transition-all uppercase tracking-widest">
               Ver Gamificação
             </button>
          </div>

          <!-- Quick Actions -->
          <div class="bg-white rounded-[2.5rem] p-8 shadow-premium border border-slate-100">
             <h3 class="text-lg font-black text-slate-800 mb-6">Ações Rápidas</h3>
             <div class="space-y-3">
               <button class="w-full p-4 hover:bg-slate-50 border border-slate-100 rounded-2xl font-bold flex items-center gap-3 transition-colors text-slate-700">
                 <i class="pi pi-megaphone text-orange-400"></i> Criar Oferta
               </button>
               <button class="w-full p-4 hover:bg-slate-50 border border-slate-100 rounded-2xl font-bold flex items-center gap-3 transition-colors text-slate-700">
                 <i class="pi pi-users text-blue-400"></i> Vincular Funcionários
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ClientDashboardComponent {
  badges = [
    { id: 1, name: 'Pioneiro', icon: 'pi-flag', color: 'bg-primary', unlocked: true, description: 'Um dos primeiros negócios cadastrados' },
    { id: 2, name: 'Favorito', icon: 'pi-heart-fill', color: 'bg-red-400', unlocked: true, description: 'Mais de 100 favoritos de turistas' },
    { id: 3, name: 'Sustentável', icon: 'pi-leaf', color: 'bg-nature', unlocked: true, description: 'Selo de práticas eco-friendly' },
    { id: 4, name: 'Top Rated', icon: 'pi-star-fill', color: 'bg-yellow-400', unlocked: false, description: 'Média de avaliação acima de 4.8' },
    { id: 5, name: 'Verificado', icon: 'pi-check-circle', color: 'bg-emerald-500', unlocked: true, description: 'Identidade e localização verificadas' },
    { id: 6, name: 'Engajado', icon: 'pi-comments', color: 'bg-secondary', unlocked: false, description: 'Responde a 100% das avaliações' }
  ];
  constructor(public auth: AuthService) {}
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItineraryService, ItineraryItem } from '../../services/itinerary.service';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-itinerary',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, CardModule, FormsModule, SelectModule, TextareaModule],
  template: `
    <div class="page-wrapper min-h-screen bg-slate-50 p-4 md:p-8 pb-32">
      <header class="mb-12 flex justify-between items-end max-w-5xl mx-auto">
        <div>
          <span class="text-primary font-black uppercase tracking-widest text-[10px]">Meu Planejamento</span>
          <h1 class="text-4xl md:text-6xl font-black text-slate-800 mt-1 tracking-tight">Roteiro</h1>
        </div>
        @if (itinerary.items().length > 0) {
          <p-button label="Limpar" icon="pi pi-trash" styleClass="p-button-text p-button-danger p-button-sm" (click)="itinerary.clear()"></p-button>
        }
      </header>

      <div class="max-w-5xl mx-auto">
        @if (itinerary.items().length === 0) {
          <div class="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up bg-white rounded-[40px] shadow-premium border border-slate-50 px-6">
             <div class="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 text-4xl mb-6 shadow-inner">
                <i class="pi pi-map"></i>
             </div>
             <h2 class="text-3xl font-black text-slate-800 mb-4">Seu roteiro está vazio</h2>
             <p class="text-slate-500 max-w-md mb-10 font-medium leading-relaxed">
               Adicione praias, passeios e eventos favoritos para criar o itinerário perfeito em Noronha.
             </p>
             <p-button label="Explorar a Ilha" icon="pi pi-search" routerLink="/home" styleClass="p-button-rounded p-button-lg shadow-xl shadow-primary/20"></p-button>
          </div>
        } @else {
          <!-- Itens por Dia -->
          @for (dayGroup of Object.keys(itinerary.itemsByDay()); track dayGroup) {
            <div class="mb-16">
              <div class="flex items-center gap-4 mb-8">
                <div class="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-primary/20">
                  {{dayGroup == '0' ? '?' : dayGroup}}
                </div>
                <h2 class="text-2xl font-black text-slate-800">
                  {{dayGroup == '0' ? 'A definir' : 'Dia ' + dayGroup}}
                </h2>
              </div>

              <div class="space-y-6">
                @for (item of itinerary.itemsByDay()[+dayGroup]; track item.id + item.type) {
                  <div class="bg-white rounded-[32px] shadow-premium border border-slate-50 p-6 md:p-8 flex flex-col md:flex-row gap-8 group hover:-translate-y-1 transition-all duration-300">
                    <div class="w-full md:w-48 h-48 rounded-[24px] overflow-hidden shrink-0">
                      <img [src]="item.image || 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&q=80&w=600'" 
                           class="w-full h-full object-cover">
                    </div>
                    
                    <div class="flex-1 flex flex-col justify-between">
                      <div>
                        <div class="flex justify-between items-start mb-2">
                           <div>
                             <span class="text-primary font-black uppercase text-[10px] tracking-widest">{{item.type}}</span>
                             <h3 class="text-2xl font-black text-slate-800">{{item.name}}</h3>
                           </div>
                           <button (click)="itinerary.toggleItem(item)" 
                                   class="w-10 h-10 bg-slate-50 text-slate-300 hover:text-red-500 rounded-xl flex items-center justify-center transition-all border-none cursor-pointer">
                             <i class="pi pi-trash"></i>
                           </button>
                        </div>
                        <p class="text-slate-400 text-sm font-bold flex items-center gap-2 mb-6 uppercase tracking-wider">
                          <i class="pi pi-map-marker text-primary"></i> {{item.location || 'Fernando de Noronha'}}
                        </p>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label class="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Organizar no dia</label>
                            <p-select [options]="daysOptions" 
                                        [(ngModel)]="item.day" 
                                        (onChange)="itinerary.updateItem(item)"
                                        styleClass="w-full rounded-2xl border-slate-100 social-dropdown" 
                                        placeholder="Escolher dia">
                            </p-select>
                          </div>
                          <div>
                            <label class="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Anotações</label>
                            <textarea pTextarea 
                                      [(ngModel)]="item.notes" 
                                      (blur)="itinerary.updateItem(item)"
                                      class="w-full rounded-2xl border-slate-100 text-sm bg-slate-50/50 p-3 outline-none focus:bg-white transition-all"
                                      placeholder="Ex: Levar protetor solar, barco às 09h..." rows="1"></textarea>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
          
          <div class="mt-16 p-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-[40px] text-center relative overflow-hidden shadow-2xl">
             <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
             <div class="relative z-10">
               <i class="pi pi-users text-primary text-4xl mb-4"></i>
               <h3 class="text-2xl font-black text-white mb-2">Sincronizar com Amigos</h3>
               <p class="text-white/60 font-medium mb-8 max-w-sm mx-auto">Em breve: Planeje cada segundo da viagem com seus companheiros de aventura em tempo real.</p>
               <button class="px-8 py-4 bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest border border-white/20 cursor-not-allowed opacity-50">
                 Disponível em Breve
               </button>
             </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep .social-dropdown .p-select {
      border-radius: 16px !important;
      background: #f8fafc !important;
      border: 1px solid #f1f5f9 !important;
    }
    :host ::ng-deep .social-dropdown .p-select:hover {
      border-color: var(--primary) !important;
    }
  `]
})
export class ItineraryPageComponent {
  Object = Object;
  daysOptions = [
    { label: 'A definir', value: 0 },
    { label: 'Dia 1', value: 1 },
    { label: 'Dia 2', value: 2 },
    { label: 'Dia 3', value: 3 },
    { label: 'Dia 4', value: 4 },
    { label: 'Dia 5', value: 5 },
    { label: 'Dia 6', value: 6 },
    { label: 'Dia 7', value: 7 },
  ];

  constructor(public itinerary: ItineraryService) {}
}

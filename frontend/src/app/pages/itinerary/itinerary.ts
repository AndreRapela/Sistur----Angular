import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItineraryService, ItineraryItem } from '../../services/itinerary.service';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-itinerary',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, CardModule, FormsModule, SelectModule, TextareaModule],
  template: `
    <div class="page-wrapper min-h-screen bg-white p-4 md:p-8 pb-32">
      <!-- WIZARD STEP 1: CONFIG -->
      @if (step === 'SETUP') {
        <div class="max-w-xl mx-auto py-20 animate-fade-in">
          <div class="text-center mb-12">
            <h1 class="text-4xl font-black text-slate-800 mb-4 tracking-tight">Crie seu Roteiro ✨</h1>
            <p class="text-slate-500 font-medium">Como você quer chamar sua aventura em Noronha?</p>
          </div>

          <div class="space-y-8 bg-slate-50 p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <div>
              <label class="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Nome do Roteiro</label>
              <input type="text" [(ngModel)]="itineraryName" placeholder="Ex: Férias de Verão 2024"
                     class="w-full bg-white border border-slate-200 rounded-2xl p-4 text-lg font-bold outline-none focus:ring-2 ring-primary/20 transition-all">
            </div>

            <div class="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200">
               <div>
                  <h3 class="font-bold text-slate-800">Tornar Público?</h3>
                  <p class="text-xs text-slate-400">Outros viajantes poderão ver e copiar seu roteiro.</p>
               </div>
               <button (click)="isPublic = !isPublic" 
                       [class.bg-primary]="isPublic"
                       class="w-14 h-8 rounded-full bg-slate-200 relative transition-all duration-300">
                  <div [class.translate-x-6]="isPublic"
                       class="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300"></div>
               </button>
            </div>

            <p-button label="Começar Planejamento" (onClick)="startPlanning()" [disabled]="!itineraryName"
                      styleClass="w-full py-4 text-lg font-black rounded-2xl shadow-xl shadow-primary/20"></p-button>
          </div>
        </div>
      }

      <!-- WIZARD STEP 2: PLANNING -->
      @if (step === 'PLANNING') {
        <header class="mb-12 flex justify-between items-end max-w-5xl mx-auto animate-fade-in">
          <div>
            <span class="text-primary font-black uppercase tracking-widest text-[10px]">{{ itineraryName }}</span>
            <h1 class="text-4xl md:text-6xl font-black text-slate-800 mt-1 tracking-tight">Seu Plano</h1>
          </div>
          <div class="flex gap-2">
            <p-button label="Salvar" icon="pi pi-check" (onClick)="saveItinerary()" 
                      styleClass="p-button-primary p-button-rounded shadow-lg font-bold"></p-button>
            <p-button label="Config" icon="pi pi-cog" (onClick)="step = 'SETUP'" 
                      styleClass="p-button-text p-button-secondary p-button-rounded"></p-button>
          </div>
        </header>

        <div class="max-w-5xl mx-auto animate-slide-up">
          @if (itinerary.items().length === 0) {
            <div class="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-[40px] border border-dashed border-slate-200 px-6">
               <i class="pi pi-plus-circle text-slate-300 text-4xl mb-4"></i>
               <h2 class="text-2xl font-black text-slate-800 mb-2">Adicione experiências</h2>
               <p class="text-slate-500 mb-8 max-w-xs mx-auto">Navegue pelas praias e passeios e adicione-os aqui para organizar seu dia.</p>
               <p-button label="Buscar Locais" icon="pi pi-search" routerLink="/home" styleClass="p-button-text font-bold"></p-button>
            </div>
          } @else {
            @for (dayGroup of Object.keys(itinerary.itemsByDay()); track dayGroup) {
              <div class="mb-16">
                <div class="flex items-center gap-4 mb-8">
                  <div class="w-10 h-10 bg-slate-800 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg">
                    {{dayGroup == '0' ? '?' : dayGroup}}
                  </div>
                  <h2 class="text-xl font-bold text-slate-800">
                    {{dayGroup == '0' ? 'Ideias e Pendentes' : 'Dia ' + dayGroup}}
                  </h2>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  @for (item of itinerary.itemsByDay()[+dayGroup]; track item.id + item.type) {
                    <div class="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 flex gap-4 hover:shadow-md transition-all">
                      <div class="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                        <img [src]="item.image || 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&q=80&w=200'" class="w-full h-full object-cover">
                      </div>
                      <div class="flex-1 min-w-0">
                        <h3 class="font-bold text-slate-800 truncate">{{item.name}}</h3>
                        <div class="flex gap-2 mt-2">
                           <p-select [options]="daysOptions" 
                                      [(ngModel)]="item.day" 
                                      (onChange)="itinerary.updateItem(item)"
                                      styleClass="itinerary-day-select" 
                                      placeholder="Mudar dia">
                           </p-select>
                           <button (click)="itinerary.toggleItem(item)" class="bg-transparent border-none text-slate-300 hover:text-red-500 cursor-pointer"><i class="pi pi-times"></i></button>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    
    :host ::ng-deep .itinerary-day-select {
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 12px;
      font-size: 11px;
      height: 32px;
      display: flex;
      align-items: center;
    }
  `]
})
export class ItineraryPageComponent {
  Object = Object;
  step: 'SETUP' | 'PLANNING' = 'SETUP';
  itineraryName = '';
  isPublic = false;

  daysOptions = [
    { label: 'Pendentes', value: 0 },
    { label: 'Dia 1', value: 1 },
    { label: 'Dia 2', value: 2 },
    { label: 'Dia 3', value: 3 },
    { label: 'Dia 4', value: 4 },
    { label: 'Dia 5', value: 5 },
  ];

  constructor(
    public itinerary: ItineraryService,
    private messageService: MessageService
  ) {}

  startPlanning() {
    this.step = 'PLANNING';
  }

  saveItinerary() {
    this.itinerary.saveToServer(this.itineraryName, this.isPublic)?.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso!', detail: 'Seu roteiro foi salvo na nuvem.' });
        this.step = 'PLANNING';
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível salvar online agora.' });
      }
    });
  }
}

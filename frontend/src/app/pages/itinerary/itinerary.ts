import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
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
  imports: [CommonModule, RouterModule, ButtonModule, CardModule, FormsModule, SelectModule, TextareaModule, DragDropModule],
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
<header class="mb-12 flex flex-col md:flex-row justify-between md:items-end gap-4 max-w-5xl mx-auto animate-fade-in hide-on-print">
          <div>
            <span class="text-primary font-black uppercase tracking-widest text-[10px]">{{ itineraryName }}</span>
            <div class="flex items-center gap-4">
              <h1 class="text-4xl md:text-6xl font-black text-slate-800 mt-1 tracking-tight">Seu Plano</h1>
              <div class="bg-primary/10 text-primary px-4 py-2 rounded-full font-black text-xl mt-2 flex items-center justify-center shadow-inner">
                R$ {{ itinerary.totalCost() }}
              </div>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <p-button label="Mapa" icon="pi pi-map" routerLink="/map"
                      styleClass="p-button-outlined p-button-rounded font-bold"></p-button>
            <p-button label="Limpar" icon="pi pi-trash" (onClick)="clearItinerary()"
                      styleClass="p-button-text p-button-danger p-button-rounded font-bold"></p-button>
            <p-button label="Exportar" icon="pi pi-print" (onClick)="printItinerary()"
                      styleClass="p-button-outlined p-button-rounded font-bold"></p-button>
            <p-button label="Salvar" icon="pi pi-check" (onClick)="saveItinerary()"
                      styleClass="p-button-primary p-button-rounded shadow-lg font-bold"></p-button>
            <p-button label="Config" icon="pi pi-cog" (onClick)="step = 'SETUP'"
                      styleClass="p-button-text p-button-secondary p-button-rounded"></p-button>
          </div>
        </header>

        <!-- PRINT HEADER (Only visible when printing) -->
        <div class="print-only mb-10 text-center">
            <h1 class="text-5xl font-black text-slate-800">{{ itineraryName }}</h1>
            <p class="text-xl text-slate-500 mt-2">Um roteiro exclusivo criado no SisTur - Custo Estimado: R$ {{ itinerary.totalCost() }}</p>
        </div>

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
                    <div class="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 flex flex-col hover:shadow-md transition-all">
                      <div class="flex gap-4">
                        <div class="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden shrink-0">
                          <img [src]="item.image || 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&q=80&w=200'" class="w-full h-full object-cover">
                        </div>
                        <div class="flex-1 min-w-0">
                          <h3 class="font-bold text-slate-800 truncate">{{item.name}}</h3>
                          <div class="flex flex-wrap items-center gap-2 mt-2">
                             <p-select [options]="daysOptions"
                                        [(ngModel)]="item.day"
                                        (onChange)="itinerary.updateItem(item)"
                                        styleClass="itinerary-day-select"
                                        placeholder="Mudar dia">
                             </p-select>
                             <div class="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-100">
                               <span class="text-xs text-slate-400 font-medium">R$</span>
                               <input type="number"
                                      [(ngModel)]="item.estimatedCost"
                                      (change)="itinerary.updateItem(item)"
                                      placeholder="0"
                                      class="w-12 bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0 p-0 text-right hide-arrows print:text-black">
                             </div>
                             <div class="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-100">
                               <i class="pi pi-clock text-slate-400 text-xs"></i>
                               <input type="time"
                                      [(ngModel)]="item.time"
                                      (change)="itinerary.updateItem(item)"
                                      class="text-xs bg-transparent border-none font-bold text-slate-700 focus:ring-0 p-0 outline-none w-[70px] print:text-black">
                             </div>
                             <button (click)="itinerary.toggleItem(item)" class="bg-transparent border-none text-slate-300 hover:text-red-500 cursor-pointer ml-auto hide-on-print"><i class="pi pi-times"></i></button>
                          </div>
                        </div>
                      </div>
                      <div class="mt-3 pt-3 border-t border-slate-50 relative">
                         <i class="pi pi-align-left absolute left-2 top-4 text-slate-300 text-xs"></i>
                         <input type="text"
                                [(ngModel)]="item.notes"
                                (change)="itinerary.updateItem(item)"
                                placeholder="Notas ou Lembretes (ex: Trazer protetor, Reservar às 14h...)"
                                class="w-full text-xs p-2 pl-7 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-transparent focus:border-primary/20 rounded-xl outline-none text-slate-600 transition-all print:border-none print:p-0 print:text-black print:pl-0">
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
  printItinerary() {
    window.print();
  }

  clearItinerary() {
    if (confirm('Tem certeza que deseja limpar todo o seu roteiro?')) {
      this.itinerary.clear();
      this.messageService.add({ severity: 'info', summary: 'Limpo', detail: 'Seu roteiro foi limpo.' });
      this.step = 'SETUP';
    }
  }
}

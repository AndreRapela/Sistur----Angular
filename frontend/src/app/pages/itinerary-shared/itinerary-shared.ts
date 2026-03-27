import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ItineraryService } from '../../services/itinerary.service';
import { ButtonModule } from 'primeng/button';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-itinerary-shared',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  template: `
    <div class="min-h-screen bg-slate-50 p-4 md:p-8">
      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <i class="pi pi-spinner pi-spin text-4xl text-primary"></i>
        </div>
      } @else if (error()) {
        <div class="text-center py-20 max-w-md mx-auto">
          <i class="pi pi-exclamation-triangle text-red-500 text-6xl mb-4"></i>
          <h2 class="text-xl font-bold mb-2 text-slate-800">Roteiro nÃ£o encontrado</h2>
          <p class="text-slate-500 mb-6">O link pode ter expirado ou o roteiro Ã© privado.</p>
          <button pButton label="Voltar para InÃ­cio" routerLink="/" class="p-button-outlined"></button>
        </div>
      } @else if (itinerary()) {
        <div class="max-w-4xl mx-auto py-10">
          <div class="bg-white rounded-[40px] shadow-sm border border-slate-100 p-8 md:p-12 mb-8 relative overflow-hidden">
            <!-- decorative bg -->
            <div class="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-[100%] pointer-events-none"></div>

            <div class="flex justify-between items-start mb-8">
               <div>
                 <span class="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase mb-3 inline-block">
                    Roteiro Compartilhado
                 </span>
                 <h1 class="text-3xl md:text-5xl font-black text-slate-800 tracking-tight leading-none mb-2">
                    {{ itinerary().name }}
                 </h1>
                 <p class="text-slate-500 font-medium">
                    Criado por <span class="text-slate-800 font-bold">{{ itinerary().user?.name || 'Viajante' }}</span> â€¢
                    {{ itinerary().viewCount }} visualizaÃ§Ãµes
                 </p>
               </div>

               <p-button label="Copiar Roteiro" icon="pi pi-clone" (onClick)="cloneItinerary()" styleClass="p-button-rounded p-button-primary shadow-lg"></p-button>
            </div>

            <!-- List of items -->
            <div class="space-y-6 relative z-10">
               @for (item of itinerary().items; track item.id) {
                 <div class="flex bg-slate-50 rounded-3xl p-4 items-center gap-4 border border-slate-100">
                    <div class="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                      <img [src]="item.image || 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&q=80&w=200'" class="w-full h-full object-cover">
                    </div>
                    <div class="flex-1">
                      <span class="text-[10px] font-black tracking-widest text-slate-400 uppercase">DIA {{ item.day === 0 ? '?' : item.day }}</span>
                      <h3 class="text-lg font-bold text-slate-800 leading-tight">{{ item.name }}</h3>
                      @if(item.location) {
                         <p class="text-xs text-slate-500 mt-1"><i class="pi pi-map-marker mr-1"></i> {{ item.location }}</p>
                      }
                    </div>
                 </div>
               }
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ItinerarySharedComponent implements OnInit {
  route = inject(ActivatedRoute);
  itineraryService = inject(ItineraryService);
  titleService = inject(Title);

  loading = signal(true);
  error = signal(false);
  itinerary = signal<any>(null);

  ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token');
    if (token) {
      this.itineraryService.getSharedItinerary(token).subscribe({
        next: (data: any) => {
          this.itinerary.set(data);
          this.titleService.setTitle(data.name + ' | SisTur Roteiros');
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        }
      });
    } else {
      this.error.set(true);
      this.loading.set(false);
    }
  }

  cloneItinerary() {
    const data = this.itinerary();
    if (data && data.items) {
      this.itineraryService.clear();
      data.items.forEach((item: any) => {
         this.itineraryService.toggleItem({
            id: item.referenceId,
            type: item.type,
            name: item.name,
            image: item.image,
            location: item.location,
            day: item.day || 0
         });
      });
      // Navegar para planejador
      window.location.href = '/itinerary';
    }
  }
}


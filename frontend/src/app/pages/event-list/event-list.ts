import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Router, RouterModule } from '@angular/router';
import { Event } from '../../models/tourism.models';
import { SkeletonListComponent } from '../../components/skeleton-list/skeleton-list';
import { ItineraryService } from '../../services/itinerary.service';
import { finalize } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, SkeletonListComponent, ButtonModule, CarouselModule, RouterModule],
  template: `
    <div class="page-wrapper min-h-screen bg-slate-50 p-4 md:p-8 pb-32">
      <header class="mb-12 flex justify-between items-end max-w-7xl mx-auto">
        <div>
          <span class="text-primary font-black uppercase tracking-widest text-[10px]">Agenda Cultural</span>
          <h1 class="text-4xl md:text-6xl font-black text-slate-800 mt-1 tracking-tight">Eventos</h1>
        </div>
        <p-button label="Mapa" icon="pi pi-map" styleClass="p-button-outlined p-button-rounded shadow-sm" (click)="goToMap()"></p-button>
      </header>
      
      <!-- CARROSSEL DE DESTAQUES -->
      <section class="mb-16 max-w-7xl mx-auto">
        <p-carousel [value]="events.slice(0, 3)" [numVisible]="1" [numScroll]="1" [circular]="true" [autoplayInterval]="5000" [showIndicators]="true">
          <ng-template let-event pTemplate="item">
            <div class="px-2">
              <div class="relative h-[300px] md:h-[500px] rounded-[40px] overflow-hidden shadow-premium group cursor-pointer" (click)="viewDetails(event)">
                <img [src]="event.photoUrl" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms]">
                <div class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent"></div>
                <div class="absolute bottom-10 left-10 right-10 text-white">
                  <span class="bg-cta text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-xl mb-6 inline-block shadow-xl">Destaque da Semana</span>
                  <h2 class="text-3xl md:text-5xl font-black mb-4 leading-tight">{{event.title}}</h2>
                  <div class="flex flex-wrap items-center gap-6 text-white/90 font-bold text-sm md:text-base">
                    <span class="flex items-center gap-2"><i class="pi pi-calendar text-primary"></i> {{event.date | date:'dd/MM HH:mm'}}</span>
                    <span class="flex items-center gap-2"><i class="pi pi-map-marker text-primary"></i> {{event.location}}</span>
                  </div>
                </div>
              </div>
            </div>
          </ng-template>
        </p-carousel>
      </section>

      <div class="max-w-7xl mx-auto">
        <!-- FILTROS ESTILO SOCIAL -->
        <div class="flex gap-4 mb-12 overflow-x-auto pb-4 scrollbar-hide">
          @for (cat of categories; track cat) {
            <button [class.bg-primary]="selectedCategory === cat"
                    [class.text-white]="selectedCategory === cat"
                    [class.bg-white]="selectedCategory !== cat"
                    [class.text-slate-600]="selectedCategory !== cat"
                    (click)="selectedCategory = cat"
                    class="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-premium border border-slate-50 whitespace-nowrap active:scale-95">
              {{cat}}
            </button>
          }
        </div>

        @if (loading) {
          <app-skeleton-list></app-skeleton-list>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            @for (event of filteredEvents(); track event.id) {
              <div class="bg-white rounded-[40px] shadow-premium border border-slate-50 overflow-hidden group hover:-translate-y-3 transition-all duration-500">
                <div class="relative h-72 overflow-hidden">
                  <img [src]="event.photoUrl" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1500ms]">
                  <div class="absolute top-6 left-6">
                    <span class="bg-white/95 backdrop-blur-md text-primary text-[10px] font-black uppercase px-4 py-2 rounded-2xl shadow-xl border border-white/50">
                      {{event.category}}
                    </span>
                  </div>
                  
                  <!-- Overlays de Ação Social (Sempre Visíveis) -->
                  <div class="absolute top-6 right-6 flex flex-col gap-3 transition-all duration-500">
                    <button (click)="toggleItinerary(event); $event.stopPropagation()" 
                            [class.bg-secondary]="itinerary.isAdded(event.id, 'EVENT')"
                            [class.text-white]="itinerary.isAdded(event.id, 'EVENT')"
                            class="w-12 h-12 bg-white/95 backdrop-blur-md text-slate-600 rounded-2xl flex items-center justify-center shadow-premium hover:scale-110 active:scale-95 transition-all">
                      <i [class]="itinerary.isAdded(event.id, 'EVENT') ? 'pi pi-calendar-times' : 'pi pi-calendar-plus'" class="text-xl"></i>
                    </button>
                    <button (click)="shareEvent(event); $event.stopPropagation()" 
                            class="w-12 h-12 bg-white/95 backdrop-blur-md text-slate-600 rounded-2xl flex items-center justify-center shadow-premium hover:scale-110 active:scale-95 transition-all">
                      <i class="pi pi-share-alt text-xl"></i>
                    </button>
                  </div>
                </div>

                <div class="p-8">
                  <div class="flex justify-between items-start mb-6">
                    <h3 class="text-2xl font-black text-slate-800 leading-tight pr-4">{{event.title}}</h3>
                    <button (click)="toggleLike(event); $event.stopPropagation()" 
                            [class.text-red-500]="event.likes && event.likes > 0"
                            class="flex flex-col items-center gap-1 font-black text-slate-300 hover:text-red-500 transition-all bg-transparent border-none cursor-pointer">
                      <i [class]="event.likes && event.likes > 0 ? 'pi pi-heart-fill scale-125' : 'pi pi-heart text-xl'"></i>
                      <span class="text-[10px]">{{event.likes || 0}}</span>
                    </button>
                  </div>

                  <p class="text-slate-500 text-sm font-medium leading-relaxed mb-8 line-clamp-2">
                    {{event.description || 'Uma experiência inesquecível aguarda você neste evento exclusivo em Fernando de Noronha.'}}
                  </p>

                  <div class="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div class="space-y-1">
                      <div class="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
                        <i class="pi pi-calendar"></i> {{event.date | date:'dd/MM HH:mm'}}
                      </div>
                      <div class="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                        <i class="pi pi-map-marker"></i> {{event.location}}
                      </div>
                    </div>
                    
                    <button (click)="findOnMap(event)" class="w-12 h-12 bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-2xl flex items-center justify-center transition-all">
                      <i class="pi pi-compass text-xl"></i>
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class EventListComponent implements OnInit {
  categories = ['Todos', 'Musical', 'Cultural', 'Profissional', 'Ambiental'];
  selectedCategory = 'Todos';
  events: Event[] = [];
  loading = true;

  constructor(
    private api: ApiService,
    private router: Router,
    public itinerary: ItineraryService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.api.getEvents()
      .pipe(finalize(() => this.loading = false))
      .subscribe(res => {
        // Simulando dados sociais que viriam do backend
        this.events = res.data?.content.map(e => ({ 
          ...e, 
          likes: Math.floor(Math.random() * 850) + 100, 
          shares: Math.floor(Math.random() * 200) 
        })) || [];
      });
  }

  filteredEvents() {
    if (this.selectedCategory === 'Todos') return this.events;
    return this.events.filter(e => e.category === this.selectedCategory);
  }

  goToMap() {
    this.router.navigate(['/map']);
  }

  findOnMap(event: Event) {
    this.router.navigate(['/map'], { queryParams: { id: event.id, type: 'EVENT' } });
  }

  viewDetails(event: Event) {
    // Implementação futura de detalhes
  }

  toggleLike(event: Event) {
    if (!event.likes) event.likes = 0;
    event.likes++;
    // Integração real via API seria feita aqui
  }

  shareEvent(event: Event) {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description || 'Confira este evento em Noronha!',
        url: window.location.href
      }).catch(() => {
        this.copyToClipboard();
      });
    } else {
      this.copyToClipboard();
    }
  }

  private copyToClipboard() {
    navigator.clipboard.writeText(window.location.href);
    this.messageService.add({ severity: 'success', summary: 'Copiado', detail: 'Link do evento copiado para a área de transferência!' });
  }

  toggleItinerary(event: Event) {
    this.itinerary.toggleItem({
      id: event.id,
      type: 'EVENT',
      name: event.title,
      image: event.photoUrl,
      location: event.location,
      addedAt: new Date()
    });
  }
}

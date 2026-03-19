import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { ItineraryService } from '../../services/itinerary.service';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-itinerary-feed',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, AvatarModule, TagModule, RouterModule, SkeletonModule],
  template: `
    <div class="feed-container min-h-screen bg-gray-50 p-4 md:p-8">
      <div class="max-w-4xl mx-auto">
        <header class="mb-10 text-center">
          <span class="text-primary font-bold text-xs uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full mb-3 inline-block">Comunidade SisTur</span>
          <h1 class="text-4xl md:text-5xl font-black text-gray-900 tracking-tight m-0">Roteiros Inspiradores</h1>
          <p class="text-gray-500 font-medium mt-2">Veja como outros viajantes estão vivendo Noronha.</p>
        </header>

        @if (loading) {
          <div class="flex flex-col gap-8">
            @for (i of [1,2,3]; track i) {
              <div class="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                <div class="flex items-center gap-3 mb-6">
                  <p-skeleton shape="circle" size="3rem"></p-skeleton>
                  <div class="flex-1">
                    <p-skeleton width="30%" height="1rem" styleClass="mb-2"></p-skeleton>
                    <p-skeleton width="20%" height="0.5rem"></p-skeleton>
                  </div>
                </div>
                <p-skeleton width="60%" height="2rem" styleClass="mb-3"></p-skeleton>
                <p-skeleton width="100%" height="1.5rem" styleClass="mb-6"></p-skeleton>
                <p-skeleton width="100%" height="12rem" borderRadius="1.5rem"></p-skeleton>
              </div>
            }
          </div>
        } @else {
          <div class="flex flex-col gap-8">
            @for (itin of itineraries; track itin.id) {
              <div class="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <!-- User Info Header -->
                <div class="p-6 flex items-center justify-between border-b border-gray-50">
                  <div class="flex items-center gap-3">
                    <p-avatar [image]="itin.userPhoto || 'assets/default-avatar.png'" shape="circle" size="large"></p-avatar>
                    <div>
                      <h3 class="font-bold text-gray-900 leading-none">{{ itin.userName }}</h3>
                      <span class="text-xs text-gray-400 capitalize">Viajante {{ itin.userRole }}</span>
                    </div>
                  </div>
                  <p-tag [value]="itin.items?.length + ' paradas'" severity="info" [rounded]="true"></p-tag>
                </div>

                <!-- Itinerary Content -->
                <div class="p-6">
                  <h2 class="text-2xl font-extrabold text-gray-800 mb-2">{{ itin.title || 'Viagem dos Sonhos: Noronha' }}</h2>
                  <p class="text-gray-500 mb-6 line-clamp-2">{{ itin.description || 'Uma jornada inesquecível explorando os melhores picos e sabores da ilha!' }}</p>

                  <!-- Featured Image & Grid Preview -->
                  <div class="grid grid-cols-4 gap-2 h-48 mb-6">
                    <div class="col-span-3 rounded-2xl overflow-hidden relative group">
                       <img [src]="itin.items?.[0]?.photoUrl || 'assets/placeholder-itinerary.jpg'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
                       <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                          <span class="text-white font-bold text-sm">{{ itin.items?.[0]?.name }}</span>
                       </div>
                    </div>
                    <div class="col-span-1 flex flex-col gap-2">
                       <div class="flex-1 rounded-xl overflow-hidden bg-gray-100">
                          <img [src]="itin.items?.[1]?.photoUrl || 'assets/placeholder-itinerary.jpg'" class="w-full h-full object-cover">
                       </div>
                       <div class="flex-1 rounded-xl overflow-hidden bg-gray-100 relative">
                          <img [src]="itin.items?.[2]?.photoUrl || 'assets/placeholder-itinerary.jpg'" class="w-full h-full object-cover">
                          @if (itin.items?.length > 3) {
                             <div class="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-black text-lg">
                                +{{ itin.items.length - 2 }}
                             </div>
                          }
                       </div>
                    </div>
                  </div>
                </div>

                <!-- Action Footer -->
                <div class="px-6 py-4 bg-gray-50 flex justify-between items-center">
                  <div class="flex items-center gap-4 text-gray-400">
                    <button class="flex items-center gap-1 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer">
                      <i class="pi pi-heart"></i> <span class="text-xs font-bold">24</span>
                    </button>
                    <button class="flex items-center gap-1 hover:text-blue-500 transition-colors bg-transparent border-none cursor-pointer">
                      <i class="pi pi-comment"></i> <span class="text-xs font-bold">8</span>
                    </button>
                  </div>
                  <p-button label="Clonar Roteiro" icon="pi pi-copy" styleClass="p-button-text p-button-sm font-bold" (onClick)="cloneItinerary(itin)"></p-button>
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
export class ItineraryFeedComponent implements OnInit {
  itineraries: any[] = [];
  loading = true;
  private http = inject(HttpClient);
  private itineraryService = inject(ItineraryService);
  private messageService = inject(MessageService);

  ngOnInit() {
    this.http.get(`${environment.apiUrl}/itineraries/public`).subscribe({
      next: (res: any) => {
        this.itineraries = res.data || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  cloneItinerary(itin: any) {
    // Lógica para adicionar todos os itens ao roteiro do usuário logado
    itin.items.forEach((item: any) => {
      this.itineraryService.toggleItem({
        id: item.originalId,
        type: item.type,
        name: item.name,
        image: item.photoUrl,
        location: item.location
      });
    });
    this.messageService.add({ severity: 'success', summary: 'Copiado!', detail: 'Roteiro clonado para sua lista.' });
  }
}

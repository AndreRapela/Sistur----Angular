import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ItineraryService } from '../../services/itinerary.service';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MapComponent } from '../../components/map/map';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TagModule, MapComponent],
  template: `
    @if (event) {
      <div class="detail-container">
        <div class="hero-image" [style.background-image]="'url(' + event.photoUrl + ')'">
          <div class="hero-overlay">
            <div class="container">
              <p-tag [value]="event.category" severity="info" class="mb-2"></p-tag>
              <h1 class="text-4xl md:text-6xl font-bold text-white">{{ event.title }}</h1>
            </div>
          </div>
        </div>

        <div class="container py-12">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div class="lg:col-span-2">
              <section class="mb-8">
                <h2 class="text-2xl font-bold mb-4">Sobre o Evento</h2>
                <p class="text-gray-600 leading-relaxed whitespace-pre-wrap">{{ event.description }}</p>
              </section>

              <section class="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-100">
                <h3 class="font-bold mb-4 flex items-center gap-2">
                  <i class="pi pi-calendar"></i> Quando e Onde?
                </h3>
                <div class="flex flex-col gap-2">
                  <p><strong>Data:</strong> {{ event.date | date:'dd/MM/yyyy HH:mm' }}</p>
                  <p><strong>Local:</strong> {{ event.location }}</p>
                </div>
              </section>
            </div>

            <div class="lg:col-span-1">
              <div class="sticky top-24 flex flex-col gap-4 p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
                <h3 class="text-xl font-bold mb-2">Ações</h3>
                
                @if (event.contactNumber) {
                  <p-button 
                    label="Entrar em Contato" 
                    icon="pi pi-whatsapp" 
                    styleClass="p-button-success w-full"
                    (onClick)="openWhatsApp()">
                  </p-button>
                  <p class="text-xs text-center text-gray-400 mt-1">Fale diretamente com o organizador</p>
                @}

                <p-button 
                  [label]="itineraryService.isAdded(event.id, 'EVENT') ? 'No Roteiro' : 'Add ao Roteiro'" 
                  [icon]="itineraryService.isAdded(event.id, 'EVENT') ? 'pi pi-check' : 'pi pi-plus'" 
                  [styleClass]="itineraryService.isAdded(event.id, 'EVENT') ? 'p-button-outlined p-button-secondary w-full' : 'p-button-primary w-full'"
                  (onClick)="itineraryService.toggleItem({ id: event.id, type: 'EVENT', name: event.title, image: event.photoUrl, location: event.location })">
                </p-button>

                @if (event.externalBookingUrl) {
                  <a [href]="event.externalBookingUrl" target="_blank" class="w-full">
                    <p-button label="Ingressos/Reserva" icon="pi pi-external-link" styleClass="p-button-info w-full p-button-outlined"></p-button>
                  </a>
                @}

                @if (event.latitude && event.longitude) {
                  <p-button 
                    label="Como Chegar" 
                    icon="pi pi-map" 
                    styleClass="p-button-outlined p-button-info w-full"
                    (onClick)="openGoogleMaps()">
                  </p-button>

                  <div class="mt-4">
                    <h4 class="text-xs font-bold uppercase text-gray-400 mb-2">Localização e Rota</h4>
                    <app-map [lat]="event.latitude" [lng]="event.longitude" [destinationName]="event.title"></app-map>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="container py-20 text-center">
        <i class="pi pi-spin pi-spinner text-4xl text-blue-500"></i>
        <p class="mt-4 text-gray-500">Carregando detalhes do evento...</p>
      </div>
    }
  `,
  styles: [`
    .hero-image {
      height: 50vh;
      background-size: cover;
      background-position: center;
      position: relative;
    }
    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
      display: flex;
      align-items: flex-end;
      padding-bottom: 4rem;
    }
  `]
})
export class EventDetailComponent implements OnInit {
  event: any;
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  itineraryService = inject(ItineraryService);

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.http.get(`${environment.apiUrl}/events`).subscribe((res: any) => {
      // Temporário: O backend ainda não tem GET /events/:id individual, então filtramos da lista
      // Em produção, o backend deve prover o endpoint individual.
      this.event = res.data.content.find((e: any) => e.id == id);
    });
  }

  openWhatsApp() {
    const msg = encodeURIComponent(`Olá! Vi o evento "${this.event.title}" no SisTur e gostaria de mais informações.`);
    window.open(`https://wa.me/${this.event.contactNumber}?text=${msg}`, '_blank');
  }

  openGoogleMaps() {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${this.event.latitude},${this.event.longitude}`;
    window.open(url, '_blank');
  }
}

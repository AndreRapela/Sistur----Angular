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
  selector: 'app-tour-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TagModule, MapComponent],
  template: `
    @if (tour) {
      <div class="detail-container">
        <div class="hero-image" [style.background-image]="'url(' + tour.photoUrl + ')'">
          <div class="hero-overlay">
            <div class="container">
              <p-tag [value]="tour.category" severity="success" class="mb-2"></p-tag>
              <h1 class="text-4xl md:text-6xl font-bold text-white">{{ tour.name }}</h1>
              <p class="text-white opacity-90 mt-2 flex items-center gap-2">
                <i class="pi pi-users"></i> Oferecido por: {{ tour.partnership || 'Operador Local' }}
              </p>
            </div>
          </div>
        </div>

        <div class="container py-12">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div class="lg:col-span-2">
              <section class="mb-8">
                <h2 class="text-2xl font-bold mb-4">Descrição do Passeio</h2>
                <p class="text-gray-600 leading-relaxed whitespace-pre-wrap">{{ tour.description }}</p>
              </section>

              <section class="p-6 bg-yellow-50 rounded-xl border border-yellow-100 mt-8">
                <h3 class="font-bold mb-4 text-yellow-900 flex items-center gap-2">
                  <i class="pi pi-info-circle"></i> O que levar?
                </h3>
                <p class="text-yellow-800">Recomendamos protetor solar, água, roupas leves e calçados confortáveis. Não esqueça a câmera para registrar as belezas de Noronha!</p>
              </section>
            </div>

            <div class="lg:col-span-1">
              <div class="sticky top-24 flex flex-col gap-4 p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
                <div class="mb-2">
                  <span class="text-gray-400 text-sm">Valor por pessoa</span>
                  <p class="text-3xl font-bold text-blue-600">R$ {{ tour.price | number:'1.2-2' }}</p>
                </div>
                
                @if (tour.contactNumber) {
                  <p-button 
                    label="Agendar via WhatsApp" 
                    icon="pi pi-whatsapp" 
                    styleClass="p-button-success w-full"
                    (onClick)="openWhatsApp()">
                  </p-button>
                @}

                <p-button 
                  [label]="itineraryService.isAdded(tour.id, 'TOUR') ? 'No Roteiro' : 'Add ao Roteiro'" 
                  [icon]="itineraryService.isAdded(tour.id, 'TOUR') ? 'pi pi-check' : 'pi pi-plus'" 
                  [styleClass]="itineraryService.isAdded(tour.id, 'TOUR') ? 'p-button-outlined p-button-secondary w-full' : 'p-button-primary w-full'"
                  (onClick)="itineraryService.toggleItem({ id: tour.id, type: 'TOUR', name: tour.name, image: tour.photoUrl, location: 'Noronha' })">
                </p-button>

                @if (tour.latitude && tour.longitude) {
                  <p-button 
                    label="Como Chegar" 
                    icon="pi pi-map" 
                    styleClass="p-button-outlined p-button-info w-full"
                    (onClick)="openGoogleMaps()">
                  </p-button>

                  <div class="mt-4">
                    <h4 class="text-xs font-bold uppercase text-gray-400 mb-2">Localização e Rota</h4>
                    <app-map [lat]="tour.latitude" [lng]="tour.longitude" [destinationName]="tour.name"></app-map>
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
        <p class="mt-4 text-gray-500">Buscando as melhores trilhas...</p>
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
export class TourDetailComponent implements OnInit {
  tour: any;
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  itineraryService = inject(ItineraryService);

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.http.get(`${environment.apiUrl}/tours`).subscribe((res: any) => {
      // Temporário: O backend ainda não tem GET /tours/:id individual
      this.tour = res.data.content.find((t: any) => t.id == id);
    });
  }

  openWhatsApp() {
    const msg = encodeURIComponent(`Olá! Vi o passeio "${this.tour.name}" no SisTur e gostaria de mais informações.`);
    window.open(`https://wa.me/${this.tour.contactNumber}?text=${msg}`, '_blank');
  }

  openGoogleMaps() {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${this.tour.latitude},${this.tour.longitude}`;
    window.open(url, '_blank');
  }
}

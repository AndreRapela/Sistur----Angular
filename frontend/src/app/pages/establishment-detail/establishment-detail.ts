import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ItineraryService } from '../../services/itinerary.service';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { RatingModule } from 'primeng/rating';
import { FormsModule } from '@angular/forms';
import { MapComponent } from '../../components/map/map';

@Component({
  selector: 'app-establishment-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TagModule, RatingModule, FormsModule, MapComponent],
  template: `
    @if (est) {
      <div class="detail-container">
        <div class="hero-image" [style.background-image]="'url(' + est.photoUrl + ')'">
          <div class="hero-overlay">
            <div class="container">
              <div class="flex gap-2 mb-2">
                <p-tag [value]="est.type" severity="warn"></p-tag>
                @if (est.foodType) { <p-tag [value]="est.foodType" severity="info"></p-tag> }
              </div>
              <h1 class="text-4xl md:text-6xl font-bold text-white">{{ est.name }}</h1>
              <div class="flex items-center gap-2 mt-2">
                <p-rating [(ngModel)]="est.rating" [readonly]="true"></p-rating>
                <span class="text-white opacity-80">({{ est.rating }})</span>
              </div>
            </div>
          </div>
        </div>

        <div class="container py-12">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div class="lg:col-span-2">
              <section class="mb-8">
                <h2 class="text-2xl font-bold mb-4">Sobre o local</h2>
                <p class="text-gray-600 leading-relaxed whitespace-pre-wrap">{{ est.description }}</p>
              </section>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section class="p-6 bg-blue-50 rounded-xl border border-blue-100 text-blue-900">
                  <h3 class="font-bold mb-4 flex items-center gap-2">
                    <i class="pi pi-clock"></i> Horário de Funcionamento
                  </h3>
                  <p>{{ est.openingHours || 'Consulte o local' }}</p>
                </section>

                <section class="p-6 bg-green-50 rounded-xl border border-green-100 text-green-900">
                  <h3 class="font-bold mb-4 flex items-center gap-2">
                    <i class="pi pi-map-marker"></i> Onde fica?
                  </h3>
                  <p>{{ est.location }}</p>
                </section>
              </div>

              @if (est.amenities) {
                <section class="mt-8">
                  <h3 class="text-xl font-bold mb-4">Comodidades</h3>
                  <div class="flex flex-wrap gap-2">
                    @for (item of est.amenities.split(','); track item) {
                      <span class="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">{{ item.trim() }}</span>
                    }
                  </div>
                </section>
              @}
            </div>

            <div class="lg:col-span-1">
              <div class="sticky top-24 flex flex-col gap-4 p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
                <div class="mb-2">
                  <span class="text-gray-400 text-sm">Preço Médio</span>
                  <p class="text-2xl font-bold text-green-600">R$ {{ est.averagePrice | number:'1.2-2' }}</p>
                </div>
                
                @if (est.contactNumber) {
                  <p-button 
                    label="Reservar mesa / Contato" 
                    icon="pi pi-whatsapp" 
                    styleClass="p-button-success w-full"
                    (onClick)="openWhatsApp()">
                  </p-button>
                @}

                <p-button 
                  [label]="itineraryService.isAdded(est.id, 'RESTAURANT') ? 'No Roteiro' : 'Add ao Roteiro'" 
                  [icon]="itineraryService.isAdded(est.id, 'RESTAURANT') ? 'pi pi-check' : 'pi pi-plus'" 
                  [styleClass]="itineraryService.isAdded(est.id, 'RESTAURANT') ? 'p-button-outlined p-button-secondary w-full' : 'p-button-primary w-full'"
                  (onClick)="itineraryService.toggleItem({ id: est.id, type: 'RESTAURANT', name: est.name, image: est.photoUrl, location: est.location })">
                </p-button>

                <div class="flex gap-2 mt-4">
                  @if (est.latitude && est.longitude) {
                    <p-button 
                      label="Como Chegar" 
                      icon="pi pi-map" 
                      styleClass="p-button-outlined p-button-info w-full"
                      (onClick)="openGoogleMaps()">
                    </p-button>
                  }
                  @if (est.instagramUrl) {
                    <a [href]="est.instagramUrl" target="_blank" class="flex-1">
                      <p-button icon="pi pi-instagram" styleClass="p-button-outlined p-button-danger w-full"></p-button>
                    </a>
                  @}
                </div>

                <!-- Small Map Preview -->
                @if (est.latitude && est.longitude) {
                  <div class="mt-4">
                    <h4 class="text-xs font-bold uppercase text-gray-400 mb-2">Localização e Rota</h4>
                    <app-map [lat]="est.latitude" [lng]="est.longitude" [destinationName]="est.name"></app-map>
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
        <p class="mt-4 text-gray-500">Carregando detalhes do estabelecimento...</p>
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
export class EstablishmentDetailComponent implements OnInit {
  est: any;
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  itineraryService = inject(ItineraryService);

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.http.get(`${environment.apiUrl}/establishments`).subscribe((res: any) => {
      // Temporário: O backend ainda não tem GET /establishments/:id individual
      this.est = res.data.content.find((e: any) => e.id == id);
    });
  }

  openWhatsApp() {
    const msg = encodeURIComponent(`Olá! Vi o estabelecimento "${this.est.name}" no SisTur e gostaria de mais informações.`);
    window.open(`https://wa.me/${this.est.contactNumber}?text=${msg}`, '_blank');
  }

  openGoogleMaps() {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${this.est.latitude},${this.est.longitude}`;
    window.open(url, '_blank');
  }
}

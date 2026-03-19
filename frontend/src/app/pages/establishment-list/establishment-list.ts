import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Establishment, EstablishmentType } from '../../models/tourism.models';
import { SkeletonListComponent } from '../../components/skeleton-list/skeleton-list';
import { ItineraryService } from '../../services/itinerary.service';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-establishment-list',
  standalone: true,
  imports: [CommonModule, SkeletonListComponent, ButtonModule],
  template: `
    <div class="p-4 container-fluid page-wrapper">
      <div class="d-flex justify-content-between align-items-center mb-5">
        <h1 class="page-title">{{ title }}</h1>
        <p-button label="Ver no Mapa" icon="pi pi-map" styleClass="p-button-outlined p-button-rounded" (click)="goToMap()"></p-button>
      </div>
      
      <div class="filters-container mb-5 scroll-hide d-flex pb-2">
        @for (cat of categories; track cat) {
          <button [class.active]="selectedCategory === cat"
                  (click)="selectedCategory = cat"
                  class="filter-chip shadow-sm">
            {{cat}}
          </button>
        }
      </div>

      @if (loading) {
        <app-skeleton-list></app-skeleton-list>
      } @else {
        <div class="row g-4">
          @for (est of establishments; track est.id) {
            <div class="col-12 col-md-6 col-lg-4">
              <div class="noronha-card h-100 hover-elevated">
                <div class="card-img-wrapper">
                  <img [src]="est.photoUrl" class="card-img" alt="Establishment image">
                  <div class="rating-badge shadow-md">
                    <i class="pi pi-star-fill text-yellow-400"></i> {{est.rating}}
                  </div>
                </div>
                
                <div class="p-4 cursor-pointer" (click)="viewDetails(est)">
                   <div class="d-flex justify-content-between align-items-start">
                      <h3 class="est-name">{{est.name}}</h3>
                      <span class="price-label">R$ {{est.averagePrice}}</span>
                   </div>
                   <p class="location-text"><i class="pi pi-map-marker"></i> {{est.location}}</p>
                   <p class="description-text">{{est.description}}</p>
                   
                   <div class="mt-4 d-flex gap-2">
                      <button class="btn-primary-gradient flex-grow-1" (click)="viewDetails(est); $event.stopPropagation()">Ver Detalhes</button>
                      
                      <button class="btn-icon-light" 
                              [class.btn-added]="itinerary.isAdded(est.id, est.type)"
                              (click)="toggleItinerary(est)" 
                              title="Adicionar ao Roteiro">
                        <i [class]="itinerary.isAdded(est.id, est.type) ? 'pi pi-calendar-times text-white' : 'pi pi-calendar-plus'"></i>
                      </button>

                      <button class="btn-icon-light" (click)="findOnMap(est)" title="Encontrar no mapa"><i class="pi pi-compass"></i></button>

                      @if (est.instagramUrl) {
                        <a [href]="est.instagramUrl" class="btn-icon-light instag-btn" target="_blank"><i class="pi pi-instagram"></i></a>
                      }
                   </div>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-title { font-weight: 900; font-size: 28px; color: var(--text-main); letter-spacing: -1px; margin: 0; }
    .card-img-wrapper { position: relative; overflow: hidden; }
    .card-img { width: 100%; height: 200px; object-fit: cover; transition: transform 0.5s ease; }
    .noronha-card:hover .card-img { transform: scale(1.05); }
    
    .rating-badge { position: absolute; top: 15px; right: 15px; background: white; padding: 6px 12px; border-radius: 30px; font-weight: 800; font-size: 13px; color: var(--text-main); z-index: 2; }
    
    .est-name { font-size: 18px; font-weight: 800; color: var(--text-main); line-height: 1.2; flex: 1; margin: 0; }
    .price-label { font-weight: 700; color: var(--secondary); font-size: 15px; white-space: nowrap; }
    
    .location-text { font-size: 13px; color: #64748b; margin-top: 8px; font-weight: 500; }
    .description-text { font-size: 14px; color: #475569; margin-top: 12px; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

    .btn-primary-gradient { background: var(--primary); color: white; border: none; padding: 12px; border-radius: 12px; font-weight: 700; transition: filter 0.2s; }
    .btn-primary-gradient:hover { filter: brightness(1.1); }
    
    .btn-icon-light { width: 50px; height: 50px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; display: flex; align-items: center; justify-content: center; font-size: 18px; transition: all 0.2s; text-decoration: none; }
    .btn-icon-light:hover { background: white; border-color: var(--primary); color: var(--primary); }
    .btn-added { background: var(--secondary) !important; color: white !important; border-color: var(--secondary) !important; }
    .instag-btn:hover { color: #e1306c; border-color: #e1306c; }

    .filter-chip {
      background-color: white;
      color: #64748b;
      padding: 10px 20px;
      border-radius: 50px;
      border: 1px solid #e2e8f0;
      cursor: pointer;
      margin-right: 12px;
      font-size: 15px;
      font-weight: 600;
      white-space: nowrap;
      transition: all 0.2s;
    }
    .filter-chip.active {
      background-color: var(--primary);
      color: white;
      border-color: var(--primary);
      box-shadow: 0 4px 12px rgba(0, 119, 182, 0.2);
    }
    .scroll-hide::-webkit-scrollbar { display: none; }
    .hover-elevated { transition: transform 0.3s ease, box-shadow 0.3s ease; }
    .hover-elevated:hover { transform: translateY(-8px); box-shadow: 0 12px 30px rgba(0,0,0,0.12); }
    
    .btn-mini-itinerary {
      width: 32px; height: 32px; border-radius: 10px; border: 1px solid #e2e8f0; background: white;
      color: #64748b; display: flex; align-items: center; justify-content: center; font-size: 12px;
      transition: all 0.2s;
    }
    .btn-mini-itinerary.added { background: var(--secondary); color: white; border-color: var(--secondary); }
    .btn-mini-itinerary:hover { transform: scale(1.1); }
  `]
})
export class EstablishmentListComponent implements OnInit {
  title = '';
  type: EstablishmentType = 'RESTAURANT';
  selectedCategory = 'Todos';
  establishments: Establishment[] = [];
  loading = true;
  categories = ['Todos', 'Praia', 'Piscina', 'Vista Mar', 'Pet Friendly']; // Example categories

  constructor(
    private route: ActivatedRoute, 
    private api: ApiService,
    private router: Router,
    public itinerary: ItineraryService
  ) {}

  ngOnInit() {
    this.route.url.subscribe(url => {
      const path = url[0].path;
      this.type = path === 'restaurants' ? 'RESTAURANT' : 'HOTEL';
      this.title = path === 'restaurants' ? 'Onde Comer' : 'Onde Ficar';
      this.loadData();
    });
  }

  loadData() {
    this.loading = true;
    this.api.getEstablishments(this.type)
      .pipe(finalize(() => this.loading = false))
      .subscribe(res => {
        this.establishments = res.data?.content || [];
      });
  }

  goToMap() {
    this.router.navigate(['/map']);
  }

  findOnMap(est: Establishment) {
    this.router.navigate(['/map'], { queryParams: { id: est.id, type: est.type } });
  }

  toggleItinerary(est: Establishment) {
    this.itinerary.toggleItem({
      id: est.id,
      type: est.type as any,
      name: est.name,
      image: est.photoUrl,
      location: est.location,
      addedAt: new Date()
    });
  }

  viewDetails(est: Establishment) {
    this.router.navigate(['/establishments', est.id]);
  }
}

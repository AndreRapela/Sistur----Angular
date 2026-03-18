import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { Tour } from '../../models/tourism.models';
import { SkeletonListComponent } from '../../components/skeleton-list/skeleton-list';
import { ItineraryService } from '../../services/itinerary.service';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-tour-list',
  standalone: true,
  imports: [CommonModule, SkeletonListComponent, ButtonModule],
  template: `
    <div class="p-4 container-fluid page-wrapper">
      <div class="d-flex justify-content-between align-items-center mb-5">
        <h1 class="page-title">Passeios e Experiências</h1>
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
          @for (tour of tours; track tour.id) {
            <div class="col-12 col-md-6 col-lg-4">
              <div class="noronha-card h-100 hover-elevated">
                <div class="card-img-wrapper">
                  <img [src]="tour.photoUrl" class="card-img" alt="Tour image">
                  <div class="price-badge shadow-md">R$ {{tour.price}}</div>
                </div>
                
                <div class="p-4">
                   <div class="d-flex justify-content-between align-items-start">
                      <h3 class="tour-name">{{tour.name}}</h3>
                      <div class="d-flex flex-column align-items-end gap-1">
                        <span class="text-xs font-bold text-blue-500 uppercase tracking-tighter">{{tour.partnership}}</span>
                      </div>
                   </div>
                   
                   <p class="description-text mt-3">{{tour.description}}</p>
                   
                   <div class="mt-4 d-flex gap-2">
                       <button class="btn-primary-gradient flex-grow-1">Reservar Agora</button>
                       
                       <button class="btn-icon-light" 
                               [class.added]="itinerary.isAdded(tour.id, 'TOUR')"
                               (click)="toggleItinerary(tour)" 
                               title="Adicionar ao Roteiro">
                         <i [class]="itinerary.isAdded(tour.id, 'TOUR') ? 'pi pi-calendar-times text-secondary' : 'pi pi-calendar-plus'"></i>
                       </button>

                       <button class="btn-icon-light" (click)="findOnMap(tour)" title="Encontrar no mapa"><i class="pi pi-compass"></i></button>
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
    
    .price-badge { position: absolute; top: 15px; right: 15px; background: white; color: var(--secondary); padding: 8px 15px; border-radius: 12px; font-weight: 800; font-size: 15px; z-index: 2; }
    
    .tour-name { font-size: 19px; font-weight: 800; color: var(--text-main); line-height: 1.2; flex: 1; margin: 0; }
    .description-text { font-size: 14px; color: #64748b; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

    .btn-primary-gradient { background: var(--primary); color: white; border: none; padding: 14px; border-radius: 14px; font-weight: 700; transition: filter 0.2s; }
    .btn-icon-light { width: 55px; height: 55px; border-radius: 14px; background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .btn-icon-light:hover { background: white; border-color: var(--primary); color: var(--primary); }

    .filter-chip {
      background-color: white; color: #64748b; padding: 10px 20px; border-radius: 50px; border: 1px solid #e2e8f0;
      cursor: pointer; margin-right: 12px; font-size: 14px; font-weight: 600; white-space: nowrap; transition: all 0.2s;
    }
    .filter-chip.active { background-color: var(--primary); color: white; border-color: var(--primary); box-shadow: 0 4px 12px rgba(0, 119, 182, 0.2); }
    
    .scroll-hide::-webkit-scrollbar { display: none; }
    .hover-elevated { transition: transform 0.3s ease, box-shadow 0.3s ease; }
    .hover-elevated:hover { transform: translateY(-8px); box-shadow: 0 12px 30px rgba(0,0,0,0.1); }

    .btn-mini-itinerary {
      width: 32px; height: 32px; border-radius: 10px; border: 1px solid #e2e8f0; background: white;
      color: #64748b; display: flex; align-items: center; justify-content: center; font-size: 12px;
      transition: all 0.2s;
    }
    .btn-mini-itinerary.added { background: var(--secondary); color: white; border-color: var(--secondary); }
    .btn-mini-itinerary:hover { transform: scale(1.1); }
  `]
})
export class TourListComponent implements OnInit {
  categories = ['Todos', 'Mergulho', 'Trilha', 'Barco', 'Histórico'];
  selectedCategory = 'Todos';
  tours: Tour[] = [];
  loading = true;

  constructor(
    private api: ApiService,
    private router: Router,
    public itinerary: ItineraryService
  ) {}

  ngOnInit() {
    this.api.getTours()
      .pipe(finalize(() => this.loading = false))
      .subscribe(res => {
        this.tours = res.data?.content || [];
      });
  }

  goToMap() {
    this.router.navigate(['/map']);
  }

  findOnMap(tour: Tour) {
    this.router.navigate(['/map'], { queryParams: { id: tour.id, type: 'TOUR' } });
  }

  toggleItinerary(tour: Tour) {
    this.itinerary.toggleItem({
      id: tour.id,
      type: 'TOUR',
      name: tour.name,
      image: tour.photoUrl,
      addedAt: new Date()
    });
  }
}

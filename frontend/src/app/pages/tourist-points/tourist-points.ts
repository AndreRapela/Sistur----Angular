import { Component, ChangeDetectionStrategy, OnInit, computed, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { ItineraryService } from '../../services/itinerary.service';
import { AnalyticsService } from '../../services/analytics.service';
import { TouristPoint } from '../../models/tourism.models';
import { touristPointDetails } from '../../data/tourist-point-details';
import { SkeletonListComponent } from '../../components/skeleton-list/skeleton-list';

@Component({
  selector: 'app-tourist-points',
  standalone: true,
  imports: [CommonModule, RouterModule, SkeletonListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tourist-points.html'
})
export class TouristPointsComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private titleService = inject(Title);
  private cdr = inject(ChangeDetectorRef);
  private analytics = inject(AnalyticsService);
  public itinerary = inject(ItineraryService);

  title = 'Pontos Turísticos';
  searchQuery = signal('');
  selectedCategory = signal('Todos');
  loading = signal(true);
  points = signal<TouristPoint[]>([]);

  categories = ['Todos', 'Praia', 'Mirante', 'Trilha', 'Histórico', 'Cultura', 'Mergulho', 'Educação', 'Surf'];

  filteredPoints = computed(() => {
    const cat = this.selectedCategory();
    const query = this.searchQuery().trim().toLowerCase();
    const allPoints = this.points();
    const byCategory = cat === 'Todos' ? allPoints : allPoints.filter(point => point.category === cat);

    if (!query) {
      return byCategory;
    }

    return byCategory.filter(point => {
      const haystack = [
        point.name,
        point.description,
        point.location,
        point.category,
        point.accessType,
        point.bestTime
      ].filter(Boolean).join(' ').toLowerCase();

      return haystack.includes(query);
    });
  });

  ngOnInit() {
    this.titleService.setTitle('Pontos Turísticos de Noronha - SisTur');
    this.analytics.pageView('/pontos-turisticos', 'PAGE', 'tourist-points');
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.api.getTouristPoints()
      .pipe(finalize(() => {
        this.loading.set(false);
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (res: any) => {
          this.points.set(res.data?.content || []);
        }
      });
  }

  onSearch(term: string) {
    this.searchQuery.set(term);
  }

  filterByCategory(category: string) {
    this.selectedCategory.set(category);
  }

  goToMap() {
    this.analytics.conversion('TOURIST_POINT', 'MAP_CLICK', 'pontos-turisticos', '/pontos-turisticos');
    this.router.navigate(['/map']);
  }

  openDetail(point: TouristPoint) {
    this.analytics.conversion('TOURIST_POINT', 'DETAIL_OPEN', point.id, `/pontos-turisticos/${point.id}`);
    this.router.navigate(['/pontos-turisticos', point.id]);
  }

  openOnMap(point: TouristPoint) {
    this.analytics.conversion('TOURIST_POINT', 'MAP_CLICK', point.id, `/pontos-turisticos/${point.id}`);
    this.router.navigate(['/map'], { queryParams: { id: point.id, type: 'POINT' } });
  }

  toggleItinerary(point: TouristPoint) {
    const wasAdded = this.itinerary.isInItinerary(point.id, 'HIGHLIGHT');
    const extra = touristPointDetails[point.id];
    this.itinerary.toggleItem({
      id: point.id,
      type: 'HIGHLIGHT',
      name: point.name,
      image: point.photoUrl,
      location: point.location,
      category: point.category,
      bestTime: point.bestTime,
      bestSeason: extra?.bestSeason,
      idealWeather: extra?.idealWeather,
      latitude: point.latitude,
      longitude: point.longitude
    });
    this.analytics.conversion('TOURIST_POINT', wasAdded ? 'ITINERARY_REMOVE' : 'ITINERARY_ADD', point.id, `/pontos-turisticos/${point.id}`);
  }
}

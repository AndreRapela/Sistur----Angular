import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { Tour } from '../../models/tourism.models';
import { SkeletonListComponent } from '../../components/skeleton-list/skeleton-list';
import { ItineraryService } from '../../services/itinerary.service';
import { AnalyticsService } from '../../services/analytics.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-tour-list',
  standalone: true,
  imports: [CommonModule, SkeletonListComponent, NgOptimizedImage],
  templateUrl: './tour-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourListComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private analytics = inject(AnalyticsService);
  public itinerary = inject(ItineraryService);
  protected readonly String = String;

  categories = ['Todos', 'Mergulho', 'Trilha', 'Barco', 'Histórico'];
  selectedCategory = signal('Todos');
  searchQuery = signal('');
  tours = signal<Tour[]>([]);
  loading = signal(true);

  filteredTours = computed(() => {
    const cat = this.selectedCategory();
    const query = this.searchQuery().trim().toLowerCase();
    const allTours = this.tours();
    const categoryFiltered = cat === 'Todos' ? allTours : allTours.filter(t => t.category === cat);

    if (!query) {
      return categoryFiltered;
    }

    return categoryFiltered.filter(tour => {
      const haystack = [tour.name, tour.description, tour.partnership, tour.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  });

  ngOnInit() {
    this.analytics.pageView('/tours', 'PAGE', 'tours');
    this.api.getTours()
      .pipe(finalize(() => {
        this.loading.set(false);
        this.cdr.markForCheck();
      }))
      .subscribe(res => {
        this.tours.set(res.data?.content || []);
      });
  }

  goToMap() {
    this.analytics.conversion('TOUR', 'MAP_CLICK', 'tours', '/tours');
    this.router.navigate(['/map']);
  }

  onSearch(term: string) {
    this.searchQuery.set(term);
  }

  clearSearch() {
    this.searchQuery.set('');
  }

  findOnMap(tour: Tour) {
    this.analytics.conversion('TOUR', 'MAP_CLICK', tour.id, `/tours/${tour.id}`);
    this.router.navigate(['/map'], { queryParams: { id: tour.id, type: 'TOUR' } });
  }

  toggleItinerary(tour: Tour) {
    const wasAdded = this.itinerary.isInItinerary(tour.id, 'TOUR');
    this.itinerary.toggleItem({
      id: tour.id,
      type: 'TOUR',
      name: tour.name,
      image: tour.photoUrl,
      addedAt: new Date()
    });
    this.analytics.conversion('TOUR', wasAdded ? 'ITINERARY_REMOVE' : 'ITINERARY_ADD', tour.id, `/tours/${tour.id}`);
  }

  viewDetails(tour: Tour) {
    this.analytics.conversion('TOUR', 'DETAIL_OPEN', tour.id, `/tours/${tour.id}`);
    this.router.navigate(['/tours', tour.id]);
  }
}

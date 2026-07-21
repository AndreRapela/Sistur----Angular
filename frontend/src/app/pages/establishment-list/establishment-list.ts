import { Component, ChangeDetectionStrategy, DestroyRef, OnInit, computed, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { ItineraryService } from '../../services/itinerary.service';
import { AnalyticsService } from '../../services/analytics.service';
import { Establishment, EstablishmentType } from '../../models/tourism.models';
import { SkeletonListComponent } from '../../components/skeleton-list/skeleton-list';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-establishment-list',
  standalone: true,
  imports: [CommonModule, SkeletonListComponent, FormsModule, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './establishment-list.html'
})
export class EstablishmentListComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private titleService = inject(Title);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private analytics = inject(AnalyticsService);
  public itinerary = inject(ItineraryService);
  protected readonly String = String;

  title = '';
  type: EstablishmentType = 'RESTAURANT';
  selectedCategory = signal('Todos');
  searchQuery = signal('');
  private allEstablishments = signal<Establishment[]>([]);
  establishments = computed(() => {
    const category = this.selectedCategory().toLowerCase();
    const items = this.allEstablishments();

    if (category === 'todos') {
      return items;
    }

    return items.filter(establishment =>
      (establishment.foodType || establishment.type || '').toLowerCase().includes(category)
    );
  });
  loading = signal(true);
  categories = computed(() => {
    const values = this.allEstablishments()
      .map(establishment => establishment.foodType || establishment.type)
      .filter((category): category is string => Boolean(category))
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    return ['Todos', ...Array.from(new Set(values))];
  });

  private searchSubject = new Subject<string>();

  ngOnInit() {
    const path = this.route.snapshot.url[0]?.path;
    this.type = path === 'restaurants' ? 'RESTAURANT' : 'HOTEL';
    this.title = this.type === 'HOTEL' ? 'Hospedagem' : 'Gastronomia';
    this.titleService.setTitle(`${this.title} em Noronha - SisTur`);
    this.analytics.pageView(`/${path || 'restaurants'}`, 'PAGE', path || 'restaurants');
    this.loadData();

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.loadData();
    });
  }

  loadData() {
    this.loading.set(true);
    this.cdr.markForCheck();

    this.api.getEstablishments(this.type, 'Todos', this.searchQuery())
      .pipe(finalize(() => {
        this.loading.set(false);
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (res: any) => {
          this.allEstablishments.set(res.data?.content || []);
        }
      });
  }

  onSearchChange(term: string) {
    this.searchSubject.next(term);
  }

  filterByCategory(cat: string) {
    this.selectedCategory.set(cat);
    this.loadData();
  }

  viewDetails(est: Establishment) {
    this.analytics.conversion('ESTABLISHMENT', 'DETAIL_OPEN', est.id, `/establishments/${est.id}`);
    this.router.navigate(['/establishments', est.id]);
  }

  goToMap() {
    this.analytics.conversion('ESTABLISHMENT', 'MAP_CLICK', this.type, `/${this.type === 'HOTEL' ? 'hotels' : 'restaurants'}`);
    this.router.navigate(['/map']);
  }

  openCategoryInGoogle() {
    const category = this.type === 'HOTEL' ? 'HOTEL' : 'RESTAURANT';
    const label = this.type === 'HOTEL' ? 'Hospedagem' : 'Restaurantes';
    const query = this.type === 'HOTEL'
      ? 'hoteis pousadas Fernando de Noronha'
      : 'restaurantes Fernando de Noronha';

    this.analytics.googleCategoryClick(category, label, `/${this.type === 'HOTEL' ? 'hotels' : 'restaurants'}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank', 'noopener');
  }

  findOnMap(est: Establishment) {
    this.analytics.conversion('ESTABLISHMENT', 'MAP_CLICK', est.id, `/establishments/${est.id}`);
    this.router.navigate(['/map'], { queryParams: { id: est.id, type: est.type } });
  }

  openGoogleService(est: Establishment) {
    const query = encodeURIComponent(`${est.name} ${est.location || 'Fernando de Noronha'}`);
    this.analytics.googleServiceClick('ESTABLISHMENT', est.id, est.name, `/establishments/${est.id}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener');
  }

  toggleItinerary(est: Establishment) {
    const wasAdded = this.itinerary.isInItinerary(est.id, est.type);
    this.itinerary.toggleItem({
      id: est.id,
      type: est.type as any,
      name: est.name,
      image: est.photoUrl,
      location: est.location
    });
    this.analytics.conversion('ESTABLISHMENT', wasAdded ? 'ITINERARY_REMOVE' : 'ITINERARY_ADD', est.id, `/establishments/${est.id}`);
  }
}

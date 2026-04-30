import { Component, ChangeDetectionStrategy, DestroyRef, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
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
  establishments = signal<Establishment[]>([]);
  loading = signal(true);
  categories = ['Todos', 'Gastronomia', 'Hospedagem', 'Lazer', 'Compras', 'Natureza'];

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

    this.api.getEstablishments(this.type, this.selectedCategory(), this.searchQuery())
      .pipe(finalize(() => {
        this.loading.set(false);
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (res: any) => {
          this.establishments.set(res.data?.content || []);
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

  findOnMap(est: Establishment) {
    this.analytics.conversion('ESTABLISHMENT', 'MAP_CLICK', est.id, `/establishments/${est.id}`);
    this.router.navigate(['/map'], { queryParams: { id: est.id, type: est.type } });
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

import { Component, ChangeDetectionStrategy, OnInit, computed, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { ItineraryService } from '../../services/itinerary.service';
import { AnalyticsService } from '../../services/analytics.service';
import { Establishment, EstablishmentType } from '../../models/tourism.models';
import { SkeletonListComponent } from '../../components/skeleton-list/skeleton-list';
import { openExternalLink } from '../../utils/external-link';

type EstablishmentListCategory = 'RESTAURANT' | 'HOTEL' | 'CONVENIENCE';

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
  private analytics = inject(AnalyticsService);
  public itinerary = inject(ItineraryService);
  protected readonly String = String;

  title = '';
  subtitle = '';
  searchPlaceholder = 'Buscar por nome...';
  pagePath = 'restaurants';
  mapCategory: EstablishmentListCategory = 'RESTAURANT';
  type: EstablishmentType = 'RESTAURANT';
  private establishmentTypes: EstablishmentType[] = ['RESTAURANT', 'BAR'];
  selectedCategory = signal('Todos');
  searchQuery = signal('');
  private allEstablishments = signal<Establishment[]>([]);
  establishments = computed(() => {
    const category = this.selectedCategory().toLowerCase();
    const query = this.normalize(this.searchQuery());
    const items = this.allEstablishments();

    return items.filter(establishment => {
      const matchesCategory = category === 'todos' ||
        (establishment.foodType || establishment.type || '').toLowerCase().includes(category);
      const haystack = this.normalize([
        establishment.name,
        establishment.description,
        establishment.foodType,
        establishment.type,
        establishment.location
      ].filter(Boolean).join(' '));
      return matchesCategory && (!query || haystack.includes(query));
    });
  });
  loading = signal(true);
  errorMessage = signal('');
  categories = computed(() => {
    const values = this.allEstablishments()
      .map(establishment => establishment.foodType || establishment.type)
      .filter((category): category is string => Boolean(category))
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    return ['Todos', ...Array.from(new Set(values))];
  });

  ngOnInit() {
    const path = this.route.snapshot.url[0]?.path || 'restaurants';
    this.configurePage(path);
    this.titleService.setTitle(`${this.title} em Noronha - SisTur`);
    this.analytics.pageView(`/${this.pagePath}`, 'PAGE', this.pagePath);
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.cdr.markForCheck();

    this.errorMessage.set('');
    this.api.getMapEstablishments(this.establishmentTypes)
      .pipe(finalize(() => {
        this.loading.set(false);
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: res => this.allEstablishments.set(res.data || []),
        error: () => {
          this.allEstablishments.set([]);
          this.errorMessage.set('Não foi possível carregar os locais agora. Tente novamente em instantes.');
        }
      });
  }

  onSearchChange(term: string) {
    this.searchQuery.set(term);
  }

  filterByCategory(cat: string) {
    this.selectedCategory.set(cat);
  }

  viewDetails(est: Establishment) {
    this.analytics.conversion('ESTABLISHMENT', 'DETAIL_OPEN', est.id, `/${this.pagePath}/${est.id}`);
    this.router.navigate([`/${this.pagePath}`, est.id]);
  }

  goToMap() {
    this.analytics.conversion('ESTABLISHMENT', 'MAP_CLICK', this.mapCategory, `/${this.pagePath}`);
    this.router.navigate(['/map'], { queryParams: { category: this.mapCategory } });
  }

  openCategoryInGoogle() {
    const config: Record<EstablishmentListCategory, { label: string; query: string }> = {
      RESTAURANT: { label: 'Restaurantes', query: 'restaurantes bares Fernando de Noronha' },
      HOTEL: { label: 'Hospedagem', query: 'hoteis pousadas resorts Fernando de Noronha' },
      CONVENIENCE: { label: 'Conveniências', query: 'mercados farmacias posto feira servicos Fernando de Noronha' }
    };
    const target = config[this.mapCategory];

    this.analytics.googleCategoryClick(this.mapCategory, target.label, `/${this.pagePath}`);
    openExternalLink(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(target.query)}`);
  }

  findOnMap(est: Establishment) {
    this.analytics.conversion('ESTABLISHMENT', 'MAP_CLICK', est.id, `/${this.pagePath}/${est.id}`);
    this.router.navigate(['/map'], { queryParams: { id: est.id, type: est.type } });
  }

  openGoogleService(est: Establishment) {
    this.analytics.googleServiceClick('ESTABLISHMENT', est.id, est.name, `/${this.pagePath}/${est.id}`);
    if (est.googleMapsUrl) {
      openExternalLink(est.googleMapsUrl);
      return;
    }

    const params = new URLSearchParams({
      api: '1',
      query: `${est.name}, Fernando de Noronha`
    });
    if (est.googlePlaceId) {
      params.set('query_place_id', est.googlePlaceId);
    }
    openExternalLink(`https://www.google.com/maps/search/?${params.toString()}`);
  }

  toggleItinerary(est: Establishment) {
    const type = this.itineraryType(est.type);
    const wasAdded = this.itinerary.isInItinerary(est.id, type);
    this.itinerary.toggleItem({
      id: est.id,
      type,
      name: est.name,
      image: est.photoUrl,
      location: est.location
    });
    this.analytics.conversion('ESTABLISHMENT', wasAdded ? 'ITINERARY_REMOVE' : 'ITINERARY_ADD', est.id, `/${this.pagePath}/${est.id}`);
  }

  googleActionTitle(): string {
    return this.mapCategory === 'CONVENIENCE'
      ? 'Ver informações no Google'
      : 'Reservar/Comprar no Google';
  }

  convenienceIcon(type: EstablishmentType): string {
    const icons: Partial<Record<EstablishmentType, string>> = {
      GAS_STATION: 'pi pi-car',
      MARKET: 'pi pi-shopping-cart',
      FAIR: 'pi pi-shopping-bag',
      PHARMACY: 'pi pi-plus-circle'
    };
    return icons[type] || 'pi pi-map-marker';
  }

  establishmentTypeLabel(type: EstablishmentType): string {
    const labels: Partial<Record<EstablishmentType, string>> = {
      CONVENIENCE: 'Serviço essencial',
      GAS_STATION: 'Posto de combustível',
      MARKET: 'Mercado',
      FAIR: 'Feira local',
      PHARMACY: 'Farmácia'
    };
    return labels[type] || 'Local útil';
  }

  itineraryType(type: EstablishmentType): 'RESTAURANT' | 'HOTEL' | 'HIGHLIGHT' {
    if (['HOTEL', 'POUSADA', 'RESORT'].includes(type)) return 'HOTEL';
    if (['RESTAURANT', 'BAR'].includes(type)) return 'RESTAURANT';
    return 'HIGHLIGHT';
  }

  private configurePage(path: string) {
    this.pagePath = path;

    if (path === 'hotels') {
      this.type = 'HOTEL';
      this.mapCategory = 'HOTEL';
      this.establishmentTypes = ['HOTEL', 'POUSADA', 'RESORT'];
      this.title = 'Hospedagem';
      this.subtitle = 'Hotéis, pousadas e resorts para comparar antes de reservar';
      this.searchPlaceholder = 'Buscar hospedagem...';
      return;
    }

    if (path === 'conveniencias') {
      this.type = 'CONVENIENCE';
      this.mapCategory = 'CONVENIENCE';
      this.establishmentTypes = ['CONVENIENCE', 'GAS_STATION', 'MARKET', 'FAIR', 'PHARMACY'];
      this.title = 'Conveniências';
      this.subtitle = 'Mercados, farmácias, posto, feira e serviços úteis da ilha';
      this.searchPlaceholder = 'Buscar serviço ou local...';
      return;
    }

    this.type = 'RESTAURANT';
    this.mapCategory = 'RESTAURANT';
    this.establishmentTypes = ['RESTAURANT', 'BAR'];
    this.title = 'Gastronomia';
    this.subtitle = 'Restaurantes e bares de Fernando de Noronha';
    this.searchPlaceholder = 'Buscar restaurante ou bar...';
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}

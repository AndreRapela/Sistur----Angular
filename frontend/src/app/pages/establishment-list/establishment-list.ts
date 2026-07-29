import { Component, ChangeDetectionStrategy, OnInit, computed, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { finalize, timeout } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { ItineraryService } from '../../services/itinerary.service';
import { AnalyticsService } from '../../services/analytics.service';
import { GooglePlaceDetails } from '../../services/google-place-details.service';
import { Establishment, EstablishmentType } from '../../models/tourism.models';
import { SkeletonListComponent } from '../../components/skeleton-list/skeleton-list';
import { GooglePlaceEnrichmentDirective } from '../../directives/google-place-enrichment.directive';
import { openExternalLink } from '../../utils/external-link';

type EstablishmentListCategory = 'RESTAURANT' | 'HOTEL' | 'CONVENIENCE';
type EstablishmentSort = 'RECOMMENDED' | 'RATING' | 'PRICE' | 'NAME';

@Component({
  selector: 'app-establishment-list',
  standalone: true,
  imports: [CommonModule, SkeletonListComponent, FormsModule, NgOptimizedImage, GooglePlaceEnrichmentDirective],
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
  protected readonly Math = Math;
  readonly reviewStars = [1, 2, 3, 4, 5];

  title = '';
  subtitle = '';
  searchPlaceholder = 'Buscar por nome...';
  pagePath = 'restaurants';
  mapCategory: EstablishmentListCategory = 'RESTAURANT';
  type: EstablishmentType = 'RESTAURANT';
  private establishmentTypes: EstablishmentType[] = ['RESTAURANT', 'BAR'];
  selectedCategory = signal('Todos');
  sortMode = signal<EstablishmentSort>('RECOMMENDED');
  searchQuery = signal('');
  private allEstablishments = signal<Establishment[]>([]);
  readonly googleDetailsById = signal<Record<number, GooglePlaceDetails>>({});
  establishments = computed(() => {
    const category = this.selectedCategory();
    const query = this.normalize(this.searchQuery());
    const items = this.allEstablishments();
    const googleDetails = this.googleDetailsById();

    const filtered = items.filter(establishment => {
      const matchesCategory = this.matchesCategory(establishment, category);
      const haystack = this.normalize([
        establishment.name,
        establishment.description,
        establishment.foodType,
        establishment.type,
        establishment.location
      ].filter(Boolean).join(' '));
      return matchesCategory && (!query || haystack.includes(query));
    });

    return filtered.sort((first, second) => {
      const firstRating = googleDetails[first.id]?.rating ?? first.rating ?? 0;
      const secondRating = googleDetails[second.id]?.rating ?? second.rating ?? 0;
      const firstReviews = googleDetails[first.id]?.reviewCount ?? first.reviewCount ?? 0;
      const secondReviews = googleDetails[second.id]?.reviewCount ?? second.reviewCount ?? 0;

      if (this.sortMode() === 'RATING') {
        return secondRating - firstRating || secondReviews - firstReviews || first.name.localeCompare(second.name, 'pt-BR');
      }
      if (this.sortMode() === 'PRICE') {
        const firstPrice = first.averagePrice && first.averagePrice > 0 ? first.averagePrice : Number.POSITIVE_INFINITY;
        const secondPrice = second.averagePrice && second.averagePrice > 0 ? second.averagePrice : Number.POSITIVE_INFINITY;
        return firstPrice - secondPrice || secondRating - firstRating;
      }
      if (this.sortMode() === 'NAME') {
        return first.name.localeCompare(second.name, 'pt-BR');
      }

      return this.recommendationScore(second, secondRating, secondReviews) -
        this.recommendationScore(first, firstRating, firstReviews) ||
        first.name.localeCompare(second.name, 'pt-BR');
    });
  });
  loading = signal(true);
  errorMessage = signal('');
  categories = computed(() => {
    if (this.mapCategory === 'HOTEL') return ['Todos', 'Hotéis', 'Pousadas', 'Resorts'];
    if (this.mapCategory === 'CONVENIENCE') return ['Todos', 'Mercados', 'Farmácias', 'Postos', 'Feiras', 'Outros serviços'];

    const cuisines = this.allEstablishments()
      .map(establishment => establishment.foodType)
      .filter((category): category is string => Boolean(category))
      .filter(category => !['RESTAURANT', 'BAR', 'RESTAURANTE'].includes(category.toUpperCase()))
      .filter((category, index, values) => values.findIndex(value => this.normalize(value) === this.normalize(category)) === index)
      .sort((first, second) => first.localeCompare(second, 'pt-BR'))
      .slice(0, 8);
    return ['Todos', 'Restaurantes', 'Bares', ...cuisines];
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
    this.api.getMapEstablishments(this.establishmentTypes, true)
      .pipe(timeout(15000), finalize(() => {
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

  onSortChange(sort: EstablishmentSort) {
    this.sortMode.set(sort);
  }

  viewDetails(est: Establishment) {
    this.analytics.conversion('ESTABLISHMENT', 'DETAIL_OPEN', est.id, `/${this.pagePath}/${est.id}`);
    this.router.navigate([`/${this.pagePath}`, est.id]);
  }

  storeGoogleDetails(establishmentId: number, details: GooglePlaceDetails | null): void {
    if (!details) return;
    this.googleDetailsById.update(current => ({ ...current, [establishmentId]: details }));
  }

  detailsFor(establishmentId: number): GooglePlaceDetails | undefined {
    return this.googleDetailsById()[establishmentId];
  }

  photoUrlFor(establishment: Establishment): string {
    return this.detailsFor(establishment.id)?.photoUrl || establishment.photoUrl || '';
  }

  ratingFor(establishment: Establishment): number | null {
    return this.detailsFor(establishment.id)?.rating ?? establishment.rating ?? null;
  }

  reviewCountFor(establishment: Establishment): number | null {
    return this.detailsFor(establishment.id)?.reviewCount ?? establishment.reviewCount ?? null;
  }

  openingLabelFor(establishment: Establishment): string {
    const details = this.detailsFor(establishment.id);
    const todayHours = details?.todayOpeningHours;
    if (typeof details?.isOpen === 'boolean') {
      return `${details.isOpen ? 'Aberto agora' : 'Fechado agora'}${todayHours ? ` · ${todayHours}` : ''}`;
    }
    return todayHours || establishment.openingHours || 'Horário não publicado no Google';
  }

  priceLabelFor(establishment: Establishment): string {
    if (establishment.priceRange) return establishment.priceRange;
    if (establishment.averagePrice && establishment.averagePrice > 0) {
      return `Média de R$ ${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(establishment.averagePrice)}`;
    }

    const priceLevel = (this.detailsFor(establishment.id)?.priceLevel || '').replace('PRICE_LEVEL_', '');
    const labels: Record<string, string> = {
      FREE: 'Gratuito no Google',
      INEXPENSIVE: 'Faixa econômica no Google',
      MODERATE: 'Faixa moderada no Google',
      EXPENSIVE: 'Faixa alta no Google',
      VERY_EXPENSIVE: 'Faixa premium no Google'
    };
    return labels[priceLevel] || '';
  }

  formatReviewCount(value: number | null): string {
    return value === null ? '' : new Intl.NumberFormat('pt-BR').format(value);
  }

  openPhotoAttribution(details: GooglePlaceDetails, event: Event): void {
    event.stopPropagation();
    openExternalLink(details.photoAttribution?.url);
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
    const liveGoogleUrl = this.detailsFor(est.id)?.googleMapsUrl;
    if (liveGoogleUrl || est.googleMapsUrl) {
      openExternalLink(liveGoogleUrl || est.googleMapsUrl);
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
      image: this.photoUrlFor(est),
      location: est.location
    });
    this.analytics.conversion('ESTABLISHMENT', wasAdded ? 'ITINERARY_REMOVE' : 'ITINERARY_ADD', est.id, `/${this.pagePath}/${est.id}`);
  }

  googleActionTitle(): string {
    return this.googleActionLabel();
  }

  googleActionLabel(): string {
    if (this.mapCategory === 'HOTEL') return 'Comparar e reservar no Google';
    if (this.mapCategory === 'RESTAURANT') return 'Avaliações e reserva no Google';
    return 'Informações atualizadas no Google';
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

  private matchesCategory(establishment: Establishment, category: string): boolean {
    const normalized = this.normalize(category);
    if (normalized === 'todos') return true;

    const typeGroups: Record<string, EstablishmentType[]> = {
      restaurantes: ['RESTAURANT'],
      bares: ['BAR'],
      hoteis: ['HOTEL'],
      pousadas: ['POUSADA'],
      resorts: ['RESORT'],
      mercados: ['MARKET'],
      farmacias: ['PHARMACY'],
      postos: ['GAS_STATION'],
      feiras: ['FAIR'],
      'outros servicos': ['CONVENIENCE']
    };
    const matchingTypes = typeGroups[normalized];
    if (matchingTypes) return matchingTypes.includes(establishment.type);

    return this.normalize(establishment.foodType || '').includes(normalized);
  }

  private recommendationScore(establishment: Establishment, rating: number, reviewCount: number): number {
    const completeness = [
      establishment.description,
      establishment.photoUrl,
      establishment.openingHours,
      establishment.contactNumber,
      establishment.websiteUrl,
      establishment.googleMapsUrl
    ].filter(Boolean).length;
    return rating * 20 + Math.log10(reviewCount + 10) * 9 + completeness * 1.5;
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}

import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { ItineraryService } from '../../services/itinerary.service';
import { AuthService } from '../../services/auth.service';
import { AnalyticsService } from '../../services/analytics.service';
import {
  GooglePlaceDetails,
  GooglePlaceDetailsService
} from '../../services/google-place-details.service';
import { NoronhaWeather, NoronhaWeatherService } from '../../services/noronha-weather.service';
import { Establishment, EstablishmentType } from '../../models/tourism.models';
import { openExternalLink } from '../../utils/external-link';

@Component({
  selector: 'app-establishment-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './establishment-detail.html'
})
export class EstablishmentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly analytics = inject(AnalyticsService);
  private readonly googlePlaces = inject(GooglePlaceDetailsService);
  private readonly weatherService = inject(NoronhaWeatherService);

  readonly authService = inject(AuthService);
  readonly itineraryService = inject(ItineraryService);

  readonly est = signal<Establishment | null>(null);
  readonly googleDetails = signal<GooglePlaceDetails | null>(null);
  readonly weather = signal<NoronhaWeather | null>(null);
  readonly loading = signal(true);
  readonly googleLoading = signal(false);
  readonly errorMessage = signal('');

  readonly isPremium = computed(() => this.authService.currentUser()?.role === 'PREMIUM_TOURIST');
  readonly isFoodVenue = computed(() => ['RESTAURANT', 'BAR'].includes(this.est()?.type || ''));
  readonly rating = computed(() => this.googleDetails()?.rating ?? this.est()?.rating ?? null);
  readonly reviewCount = computed(() => this.googleDetails()?.reviewCount ?? this.est()?.reviewCount ?? null);
  readonly contactNumber = computed(() => this.googleDetails()?.contactNumber || this.est()?.contactNumber || '');
  readonly websiteUrl = computed(() => this.googleDetails()?.websiteUrl || this.est()?.websiteUrl || '');
  readonly googleMapsUrl = computed(() => this.googleDetails()?.googleMapsUrl || this.est()?.googleMapsUrl || '');
  readonly heroPhotoUrl = computed(() => this.googleDetails()?.photoUrl || this.est()?.photoUrl || '');
  readonly backRoute = computed(() => {
    const type = this.est()?.type;
    if (['HOTEL', 'POUSADA', 'RESORT'].includes(type || '')) return '/hotels';
    if (['RESTAURANT', 'BAR'].includes(type || '')) return '/restaurants';
    return '/map';
  });
  readonly openingHours = computed(() => {
    const liveHours = this.googleDetails()?.openingHours;
    if (liveHours?.length) {
      return liveHours;
    }
    return this.est()?.openingHours ? [this.est()!.openingHours!] : [];
  });
  readonly popularDishes = computed(() => this.splitValues(this.est()?.popularDishes));
  readonly amenities = computed(() => this.splitValues(this.est()?.amenities, ','));
  readonly priceLabel = computed(() => this.est()?.priceRange || this.googlePriceLabel(this.googleDetails()?.priceLevel));
  readonly weatherLabel = computed(() => this.formatWeather(this.weather()));
  readonly visitSuggestion = computed(() => this.buildVisitSuggestion());
  readonly tasteSuggestion = computed(() => this.buildTasteSuggestion());
  readonly isSaved = computed(() => {
    const establishment = this.est();
    return Boolean(establishment && this.itineraryService.isInItinerary(establishment.id, this.itineraryType(establishment.type)));
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.params['id']);
    if (!Number.isFinite(id)) {
      this.loading.set(false);
      this.errorMessage.set('Este local não foi encontrado.');
      return;
    }

    this.analytics.pageView(`/establishments/${id}`, 'ESTABLISHMENT', id);
    this.loadWeather();
    this.loadEstablishment(id);
  }

  toggleItinerary(): void {
    const establishment = this.est();
    if (!establishment) return;

    const type = this.itineraryType(establishment.type);
    const wasAdded = this.itineraryService.isInItinerary(establishment.id, type);
    this.itineraryService.toggleItem({
      id: establishment.id,
      type,
      name: establishment.name,
      image: establishment.photoUrl,
      location: establishment.location
    });
    this.analytics.conversion(
      'ESTABLISHMENT',
      wasAdded ? 'ITINERARY_REMOVE' : 'ITINERARY_ADD',
      establishment.id,
      `/establishments/${establishment.id}`
    );
  }

  openContact(): void {
    const establishment = this.est();
    const contact = this.contactNumber();
    if (!establishment || !contact) return;

    this.analytics.conversion('ESTABLISHMENT', 'PHONE_CLICK', establishment.id, `/establishments/${establishment.id}`);
    openExternalLink(`tel:${contact.replace(/[^+\d]/g, '')}`);
  }

  openGoogleDirections(): void {
    const establishment = this.est();
    if (!establishment) return;

    const params = new URLSearchParams({ api: '1', travelmode: 'driving' });
    const placeId = this.googleDetails()?.placeId || establishment.googlePlaceId;
    if (placeId) {
      params.set('destination_place_id', placeId);
    }

    if (establishment.latitude && establishment.longitude) {
      params.set('destination', `${establishment.latitude},${establishment.longitude}`);
    } else {
      params.set('destination', `${establishment.name}, Fernando de Noronha`);
    }

    this.analytics.conversion('ESTABLISHMENT', 'DIRECTIONS_CLICK', establishment.id, `/establishments/${establishment.id}`);
    openExternalLink(`https://www.google.com/maps/dir/?${params.toString()}`);
  }

  openGooglePlace(): void {
    const establishment = this.est();
    if (!establishment) return;

    this.analytics.googleServiceClick('ESTABLISHMENT', establishment.id, establishment.name, `/establishments/${establishment.id}`);
    if (this.googleMapsUrl()) {
      openExternalLink(this.googleMapsUrl());
      return;
    }

    const params = new URLSearchParams({
      api: '1',
      query: `${establishment.name}, Fernando de Noronha`
    });
    const placeId = this.googleDetails()?.placeId || establishment.googlePlaceId;
    if (placeId) {
      params.set('query_place_id', placeId);
    }
    openExternalLink(`https://www.google.com/maps/search/?${params.toString()}`);
  }

  openWebsite(): void {
    const establishment = this.est();
    if (!establishment || !this.websiteUrl()) return;
    this.analytics.conversion('ESTABLISHMENT', 'WEBSITE_CLICK', establishment.id, `/establishments/${establishment.id}`);
    openExternalLink(this.websiteUrl());
  }

  openMenu(): void {
    const establishment = this.est();
    const menuUrl = establishment?.menuUrl;
    if (!establishment || !menuUrl) return;
    this.analytics.conversion('ESTABLISHMENT', 'MENU_CLICK', establishment.id, `/establishments/${establishment.id}`);
    openExternalLink(menuUrl);
  }

  openInstagram(): void {
    const establishment = this.est();
    if (!establishment?.instagramUrl) return;
    this.analytics.conversion('ESTABLISHMENT', 'INSTAGRAM_CLICK', establishment.id, `/establishments/${establishment.id}`);
    openExternalLink(establishment.instagramUrl);
  }

  openDataSource(): void {
    openExternalLink(this.est()?.dataSourceUrl);
  }

  openPhotoAttribution(): void {
    openExternalLink(this.googleDetails()?.photoAttribution?.url);
  }

  typeLabel(type: EstablishmentType): string {
    const labels: Record<EstablishmentType, string> = {
      RESTAURANT: 'Restaurante',
      BAR: 'Bar',
      HOTEL: 'Hotel',
      POUSADA: 'Pousada',
      RESORT: 'Resort',
      CONVENIENCE: 'Conveniência',
      GAS_STATION: 'Posto',
      MARKET: 'Mercado',
      FAIR: 'Feira',
      PHARMACY: 'Farmácia'
    };
    return labels[type] || 'Local';
  }

  formatReviewCount(value: number | null): string {
    return value === null ? '' : new Intl.NumberFormat('pt-BR').format(value);
  }

  formatVerifiedDate(value?: string): string {
    if (!value) return '';
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime())
      ? ''
      : new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(date);
  }

  private loadEstablishment(id: number): void {
    this.loading.set(true);
    this.api.getEstablishmentById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: response => {
          if (!response.data) {
            this.errorMessage.set('Este local não foi encontrado.');
            return;
          }
          this.est.set(response.data);
          void this.loadGoogleDetails(response.data);
        },
        error: () => this.errorMessage.set('Não foi possível carregar as informações deste local.')
      });
  }

  private async loadGoogleDetails(establishment: Establishment): Promise<void> {
    this.googleLoading.set(true);
    try {
      this.googleDetails.set(await this.googlePlaces.getDetails(establishment));
    } finally {
      this.googleLoading.set(false);
    }
  }

  private loadWeather(): void {
    this.weatherService.current()
      .pipe(timeout(3500))
      .subscribe({
        next: weather => this.weather.set(weather),
        error: () => undefined
      });
  }

  private splitValues(value?: string, separator = '|'): string[] {
    return value
      ? value.split(separator).map(item => item.trim()).filter(Boolean)
      : [];
  }

  private itineraryType(type: EstablishmentType): 'RESTAURANT' | 'HOTEL' | 'HIGHLIGHT' {
    if (['HOTEL', 'POUSADA', 'RESORT'].includes(type)) return 'HOTEL';
    if (['RESTAURANT', 'BAR'].includes(type)) return 'RESTAURANT';
    return 'HIGHLIGHT';
  }

  private googlePriceLabel(priceLevel?: string): string {
    const normalized = (priceLevel || '').replace('PRICE_LEVEL_', '');
    const labels: Record<string, string> = {
      FREE: 'Gratuito',
      INEXPENSIVE: 'Faixa econômica no Google',
      MODERATE: 'Faixa moderada no Google',
      EXPENSIVE: 'Faixa alta no Google',
      VERY_EXPENSIVE: 'Faixa premium no Google'
    };
    return labels[normalized] || '';
  }

  private formatWeather(weather: NoronhaWeather | null): string {
    if (!weather) return '';
    const condition = weather.precipitation > 0 || weather.weatherCode >= 51
      ? 'chuva no momento'
      : weather.cloudCover >= 70
        ? 'céu nublado'
        : 'tempo aberto';
    return `${Math.round(weather.temperature)}°C · ${condition}`;
  }

  private buildVisitSuggestion(): string {
    const establishment = this.est();
    if (!establishment) return '';

    const hour = Number(new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Noronha',
      hour: '2-digit',
      hour12: false
    }).format(new Date()));
    const weather = this.weather();
    const rainy = Boolean(weather && (weather.precipitation > 0 || weather.weatherCode >= 51));

    if (rainy && this.isFoodVenue()) {
      return `Com ${this.weatherLabel()}, é uma opção prática para fazer uma pausa entre os passeios. Confirme o horário antes de sair.`;
    }
    if (establishment.type === 'BAR' && hour >= 15 && hour <= 18) {
      return 'Bom momento para chegar com calma e aproveitar o fim da tarde. Em dias concorridos, reserve antes.';
    }
    if (this.isFoodVenue() && hour >= 11 && hour < 15) {
      return 'O horário favorece o almoço. Consulte a lotação e o cardápio do dia antes do deslocamento.';
    }
    if (this.isFoodVenue() && hour >= 18 && hour <= 22) {
      return 'O horário favorece o jantar. Restaurantes mais procurados da ilha costumam exigir reserva.';
    }
    return establishment.bestVisitTime || establishment.weatherAdvice || 'Consulte o funcionamento e combine a visita com os pontos próximos no mapa.';
  }

  private buildTasteSuggestion(): string {
    const establishment = this.est();
    if (!establishment?.foodType) return '';
    const dishes = this.popularDishes().slice(0, 2).join(' e ');
    return dishes
      ? `Combina com quem procura ${establishment.foodType.toLowerCase()}; entre os destaques estão ${dishes}.`
      : `Combina com quem procura ${establishment.foodType.toLowerCase()}.`;
  }
}

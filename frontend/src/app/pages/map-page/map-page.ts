import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { forkJoin, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import * as L from 'leaflet';
import Supercluster from 'supercluster';
import { ApiService } from '../../services/api.service';
import { AnalyticsService } from '../../services/analytics.service';
import { GoogleMapsLoaderService } from '../../services/google-maps-loader.service';
import { GooglePlaceDetailsService } from '../../services/google-place-details.service';
import { ItineraryService } from '../../services/itinerary.service';
import {
  NoronhaWeatherOverview,
  NoronhaWeatherService,
  WeatherSafetyAlert
} from '../../services/noronha-weather.service';
import { openExternalLink } from '../../utils/external-link';
import { NORONHA_MAP_BOOTSTRAP } from './map-bootstrap.data';
import {
  Establishment,
  EstablishmentType,
  Event,
  LocationDTO,
  RouteResponseDTO,
  Tour,
  TouristPoint
} from '../../models/tourism.models';

type MapCategoryId = 'ALL' | 'RESTAURANT' | 'HOTEL' | 'EVENT' | 'TOUR' | 'BEACH' | 'POINT' | 'CONVENIENCE';
type MapSource = 'SISTUR' | 'GOOGLE_PLACES' | 'CURATED';
type LocationState = 'idle' | 'loading' | 'ready' | 'outside' | 'denied';
type MapViewMode = 'STREET' | 'SATELLITE';
type TravelMode = 'WALKING' | 'DRIVING' | 'BICYCLING';
type RouteState = 'idle' | 'locating' | 'routing' | 'ready' | 'estimated' | 'error';

interface MapCategory {
  id: MapCategoryId;
  label: string;
  icon: string;
  googleQueries?: string[];
}

interface MapLocation {
  id: string;
  sourceId?: number | string;
  source: MapSource;
  mapSearchType: MapCategoryId;
  name: string;
  description?: string;
  category?: string;
  location?: string;
  photoUrl?: string | null;
  photoAttributionName?: string;
  photoAttributionUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  averagePrice?: number | null;
  priceRange?: string;
  openingHours?: string;
  contactNumber?: string;
  websiteUrl?: string;
  menuUrl?: string;
  googleMapsUrl?: string;
  googlePlaceId?: string;
  popularDishes?: string;
  bestVisitTime?: string;
  weatherAdvice?: string;
  amenities?: string;
  duration?: string;
  schedule?: string;
  meetingPoint?: string;
  accessType?: string;
  requiresTicket?: boolean;
  requiresGuide?: boolean;
  idealWeather?: string;
}

interface MapClusterPoint {
  locationId: string;
}

type MapBounds = [west: number, south: number, east: number, north: number];
type LabelRect = { left: number; top: number; right: number; bottom: number };

const NORONHA_CENTER = { lat: -3.8495, lng: -32.4310 };
const NORONHA_BOUNDS = {
  north: -3.8050,
  south: -3.9000,
  east: -32.3850,
  west: -32.4900
};
const NORONHA_USER_BOUNDS = {
  north: -3.7950,
  south: -3.9100,
  east: -32.3700,
  west: -32.5000
};
const NORONHA_LEAFLET_BOUNDS: L.LatLngBoundsExpression = [
  [NORONHA_BOUNDS.south, NORONHA_BOUNDS.west],
  [NORONHA_BOUNDS.north, NORONHA_BOUNDS.east]
];
const MAP_ESTABLISHMENT_TYPES: EstablishmentType[] = [
  'RESTAURANT',
  'BAR',
  'HOTEL',
  'POUSADA',
  'RESORT',
  'CONVENIENCE',
  'GAS_STATION',
  'MARKET',
  'FAIR',
  'PHARMACY'
];
const GOOGLE_MAP_STARTUP_BUDGET_MS = 1200;

@Component({
  selector: 'app-map-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-page.html',
  styleUrls: ['./map-page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapCanvas', { static: true }) private mapCanvas!: ElementRef<HTMLDivElement>;

  private api = inject(ApiService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private titleService = inject(Title);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private googleLoader = inject(GoogleMapsLoaderService);
  private googlePlaceDetails = inject(GooglePlaceDetailsService);
  private weather = inject(NoronhaWeatherService);
  private analytics = inject(AnalyticsService);
  public itinerary = inject(ItineraryService);

  private leafletMap?: L.Map;
  private markersLayer = L.layerGroup();
  private routeLayer = L.layerGroup();
  private leafletStreetLayer?: L.TileLayer;
  private leafletImageryLayer?: L.TileLayer;
  private leafletRoadsLayer?: L.TileLayer;
  private leafletLabelsLayer?: L.TileLayer;
  private userLocationMarker?: L.CircleMarker;
  private userAccuracyCircle?: L.Circle;

  private google?: any;
  private googleMap?: any;
  private googleMarkers: any[] = [];
  private googleMapListeners: any[] = [];
  private googleUserMarker?: any;
  private googleUserAccuracyCircle?: any;
  private googleRoutePolylines: any[] = [];
  private watchId?: number;
  private pendingDirections = false;
  private pendingInitialParams: Params = {};
  private googlePlacesCache = new Map<MapCategoryId, MapLocation[]>();
  private googleTextSearchCache = new Map<string, MapLocation[]>();
  private googleTextSearchLocations: MapLocation[] = [];
  private googlePlacesLoadingFor = new Set<MapCategoryId>();
  private searchRequestTimer?: ReturnType<typeof setTimeout>;
  private markerRenderFrame?: number;
  private localSearchFrame?: number;
  private googleSearchRequestId = 0;
  private readonly placeSummaryRequests = new Set<string>();
  private readonly failedResultImages = new Set<string>();
  private satelliteTileErrors = 0;
  private satelliteTilesLoaded = 0;
  private satelliteLoadTimer?: ReturnType<typeof setTimeout>;
  private readonly clusterIndex = new Supercluster<MapClusterPoint, Record<string, never>>({
    minZoom: 0,
    maxZoom: 15,
    minPoints: 2,
    radius: 48,
    nodeSize: 64
  });
  private locationById = new Map<string, MapLocation>();
  private locationCatalog: MapLocation[] = [];
  private locationsByCategory = new Map<MapCategoryId, MapLocation[]>();
  private readonly leafletViewportHandler = () => this.scheduleMarkerRender();

  Math = Math;
  readonly reviewStars = [1, 2, 3, 4, 5];
  activeCategory: MapCategoryId = 'ALL';
  selectedLocation: MapLocation | null = null;
  routeSummary: RouteResponseDTO | null = null;
  routeState: RouteState = 'idle';
  routeNotice = '';
  travelMode: TravelMode = 'DRIVING';
  searchTerm = '';
  mapStatus = 'Carregando mapa...';
  currentZoom = 13;
  zoomGuide = 'Aproxime o mapa para separar os lugares.';
  mapViewMode: MapViewMode = 'STREET';
  satelliteAvailable = true;
  googlePlacesLoading = false;
  locationState: LocationState = 'idle';
  locationMessage = 'Use sua posição para calcular rotas reais.';
  userLocation?: LocationDTO;
  resultImageLimit = 12;
  weatherOverview: NoronhaWeatherOverview | null = null;
  weatherSafeMode = false;

  categories: MapCategory[] = [
    { id: 'ALL', label: 'Tudo', icon: 'pi pi-map' },
    { id: 'RESTAURANT', label: 'Restaurantes', icon: 'pi pi-shop', googleQueries: ['restaurantes em Fernando de Noronha'] },
    { id: 'TOUR', label: 'Passeios', icon: 'pi pi-camera', googleQueries: ['passeios turísticos em Fernando de Noronha', 'agências de turismo em Fernando de Noronha'] },
    { id: 'BEACH', label: 'Praias', icon: 'pi pi-sun', googleQueries: ['praias em Fernando de Noronha', 'baías em Fernando de Noronha'] },
    { id: 'POINT', label: 'Turísticos', icon: 'pi pi-compass', googleQueries: ['pontos turísticos em Fernando de Noronha', 'atrações em Fernando de Noronha'] },
    { id: 'HOTEL', label: 'Hospedagem', icon: 'pi pi-home', googleQueries: ['hotéis e pousadas em Fernando de Noronha'] },
    { id: 'CONVENIENCE', label: 'Conveniências', icon: 'pi pi-shopping-bag', googleQueries: ['postos de combustível em Fernando de Noronha', 'mercados em Fernando de Noronha', 'farmácias em Fernando de Noronha', 'conveniências em Fernando de Noronha', 'feiras em Fernando de Noronha'] },
    { id: 'EVENT', label: 'Eventos', icon: 'pi pi-calendar' }
  ];

  allData: MapLocation[] = NORONHA_MAP_BOOTSTRAP.map(location => ({
    ...location,
    source: 'CURATED' as const
  }));
  filteredData: MapLocation[] = [];
  categoryCounts: Record<MapCategoryId, number> = {
    ALL: 0,
    RESTAURANT: 0,
    HOTEL: 0,
    EVENT: 0,
    TOUR: 0,
    BEACH: 0,
    POINT: 0,
    CONVENIENCE: 0
  };

  ngOnInit() {
    this.titleService.setTitle('Mapa inteligente de Noronha - SisTur');
    this.analytics.pageView('/map', 'PAGE', 'map');
    this.pendingInitialParams = this.activatedRoute.snapshot.queryParams;
    this.applyRoutePreset();
    this.loadAllData();
    this.loadWeatherLens();
  }

  ngAfterViewInit() {
    void this.initMap();
  }

  ngOnDestroy() {
    if (this.searchRequestTimer) {
      clearTimeout(this.searchRequestTimer);
    }

    if (this.markerRenderFrame !== undefined) {
      cancelAnimationFrame(this.markerRenderFrame);
    }

    if (this.localSearchFrame !== undefined) {
      cancelAnimationFrame(this.localSearchFrame);
    }

    if (this.satelliteLoadTimer) {
      clearTimeout(this.satelliteLoadTimer);
    }

    if (this.watchId !== undefined && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
    }

    if (this.leafletMap) {
      this.leafletMap.off('moveend', this.leafletViewportHandler);
      this.leafletMap.remove();
    }

    this.googleMapListeners.forEach(listener => listener.remove());
    this.googleMapListeners = [];
  }

  filterByCategory(type: MapCategoryId) {
    this.activeCategory = type;
    this.resultImageLimit = 12;
    this.selectedLocation = null;
    this.routeSummary = null;
    this.routeState = 'idle';
    this.routeNotice = '';
    this.clearRoute();
    this.analytics.conversion(`CATEGORY_${type}`, 'CATEGORY_FILTER', null, `/map?category=${type}`);
    void this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { category: type === 'ALL' ? null : type, id: null, type: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
    this.updateMarkers();
    this.focusFilteredLocations();
    void this.ensureGooglePlacesForCategory(type);
    void this.ensureGooglePlacesForSearch();
    this.cdr.markForCheck();
  }

  onSearch(event: globalThis.Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.resultImageLimit = 12;
    this.queueLocalSearchUpdate();
    this.queueGoogleTextSearch();
    this.cdr.markForCheck();
  }

  clearSearch() {
    if (!this.searchTerm) {
      return;
    }

    this.searchTerm = '';
    this.resultImageLimit = 12;
    this.googleSearchRequestId++;
    this.googleTextSearchLocations = [];
    this.updateMarkers();
    this.cdr.markForCheck();
  }

  toggleWeatherSafeMode(): void {
    if (!this.weatherNeedsCaution()) return;

    this.weatherSafeMode = !this.weatherSafeMode;
    this.selectedLocation = null;
    this.routeSummary = null;
    this.routeState = 'idle';
    this.routeNotice = '';
    this.clearRoute();
    this.updateMarkers();
    this.focusFilteredLocations();
    this.cdr.markForCheck();
  }

  weatherNeedsCaution(): boolean {
    return Boolean(this.weatherOverview && this.weatherOverview.level !== 'safe');
  }

  weatherLensAlert(): WeatherSafetyAlert | null {
    return this.weatherOverview?.alerts.find(alert => alert.level !== 'safe') || null;
  }

  weatherExposureWarning(location: MapLocation): WeatherSafetyAlert | null {
    if (!this.weatherSafeMode && !this.weatherNeedsCaution()) return null;
    return this.isLocationWeatherExposed(location) ? this.weatherLensAlert() : null;
  }

  selectLocation(location: MapLocation) {
    this.selectedLocation = location;
    this.routeSummary = null;
    this.routeState = 'idle';
    this.routeNotice = '';
    this.clearRoute();
    this.focusLocation(location, 17);
    void this.enrichSelectedLocation(location);
    this.scheduleMarkerRender();
    this.cdr.markForCheck();
  }

  closeLocation() {
    this.selectedLocation = null;
    this.routeSummary = null;
    this.routeState = 'idle';
    this.routeNotice = '';
    this.pendingDirections = false;
    this.clearRoute();
    this.scheduleMarkerRender();
    this.cdr.markForCheck();
  }

  requestUserLocation(focus = true) {
    if (!navigator.geolocation) {
      this.locationState = 'denied';
      this.locationMessage = 'Seu navegador não oferece geolocalização.';
      this.cdr.markForCheck();
      return;
    }

    this.locationState = 'loading';
    this.locationMessage = 'Localizando você...';
    navigator.geolocation.getCurrentPosition(
      position => this.handleLocatedPosition(position, focus),
      error => this.handleLocationError(error),
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 30000 }
    );
  }

  getDirections() {
    if (!this.selectedLocation) {
      return;
    }

    if (!this.hasCoordinates(this.selectedLocation)) {
      this.routeState = 'error';
      this.routeNotice = 'Este local ainda não tem coordenadas verificadas. Use a ficha do Google para navegar pelo nome.';
      this.cdr.markForCheck();
      return;
    }

    if (!this.userLocation) {
      this.pendingDirections = true;
      this.routeState = 'locating';
      this.routeNotice = 'Autorize sua localização para traçar a rota dentro da ilha.';
      this.requestUserLocation(false);
      this.cdr.markForCheck();
      return;
    }

    this.calculateRouteForSelection();
  }

  setTravelMode(mode: TravelMode) {
    if (this.travelMode === mode) return;

    const shouldRecalculate = Boolean(this.routeSummary && this.userLocation && this.selectedLocation);
    this.travelMode = mode;
    this.routeSummary = null;
    this.routeState = 'idle';
    this.routeNotice = '';
    this.clearRoute();

    if (shouldRecalculate) {
      this.calculateRouteForSelection();
    }
    this.cdr.markForCheck();
  }

  travelModeIcon(): string {
    if (this.travelMode === 'WALKING') return 'pi pi-user';
    if (this.travelMode === 'BICYCLING') return 'pi pi-bolt';
    return 'pi pi-car';
  }

  routeActionLabel(): string {
    if (this.routeState === 'locating') return 'Localizando...';
    if (this.routeState === 'routing') return 'Calculando rota...';
    return this.userLocation ? 'Traçar rota' : 'Usar localização';
  }

  openExternalDirections(location: MapLocation | null = this.selectedLocation) {
    this.openDirectionsInGoogleMaps(location);
  }

  distanceLabel(location: MapLocation): string {
    if (!this.userLocation) return '';
    const coordinates = this.coordinatesFor(location);
    if (!coordinates) return '';

    const meters = this.distanceMeters(
      this.userLocation.lat,
      this.userLocation.lng,
      coordinates.lat,
      coordinates.lng
    );
    return meters < 1000 ? `${Math.max(10, Math.round(meters / 10) * 10)} m` : `${(meters / 1000).toFixed(1)} km`;
  }

  openInGoogleMaps(location: MapLocation | null = this.selectedLocation) {
    if (!location) {
      return;
    }

    const url = this.googleServiceUrl(location);
    this.analytics.googleServiceClick(
      this.analyticsTargetType(location),
      this.analyticsTargetId(location),
      location.name,
      `/map?category=${location.mapSearchType}`
    );
    openExternalLink(url);
  }

  openCategoryInGoogle() {
    const query = this.googleCategoryQuery(this.activeCategory);
    this.analytics.googleCategoryClick(this.activeCategory, this.activeCategoryName(), `/map?category=${this.activeCategory}`);
    openExternalLink(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
  }

  openDetails(location: MapLocation | null = this.selectedLocation) {
    if (!location) {
      return;
    }

    if (location.source === 'GOOGLE_PLACES' || location.source === 'CURATED') {
      this.openInGoogleMaps(location);
      return;
    }

    const id = location.sourceId;
    if (!id) {
      return;
    }

    const routes: Record<MapCategoryId, string> = {
      ALL: '/map',
      RESTAURANT: '/restaurants',
      HOTEL: '/hotels',
      EVENT: '/events',
      TOUR: '/tours',
      BEACH: '/pontos-turisticos',
      POINT: '/pontos-turisticos',
      CONVENIENCE: '/conveniencias'
    };

    this.router.navigate([routes[location.mapSearchType], id]);
  }

  togglePlan(location: MapLocation) {
    const type = this.toItineraryType(location);
    const id = location.source === 'GOOGLE_PLACES' ? location.id : (location.sourceId ?? location.id);

    this.itinerary.toggleItem({
      id,
      type,
      name: location.name,
      image: location.photoUrl,
      location: location.location,
      category: location.category,
      latitude: location.latitude ?? undefined,
      longitude: location.longitude ?? undefined
    });
  }

  isInPlan(location: MapLocation): boolean {
    const id = location.source === 'GOOGLE_PLACES' ? location.id : (location.sourceId ?? location.id);
    return this.itinerary.isInItinerary(id, this.toItineraryType(location));
  }

  countForCategory(category: MapCategoryId): number {
    return this.categoryCounts[category];
  }

  sourceLabel(location: MapLocation): string {
    if (location.source === 'GOOGLE_PLACES') return 'Google Places';
    if (location.source === 'CURATED') return 'Guia SisTur';
    return 'SisTur';
  }

  getCategoryIcon(category: MapCategoryId | undefined): string {
    return category ? this.iconForCategory(category) : 'pi pi-map-marker';
  }

  resultImageUrl(location: MapLocation): string {
    return location.photoUrl || '';
  }

  resultImageSource(location: MapLocation): string {
    if (location.photoUrl) {
      return location.photoAttributionName || (location.source === 'GOOGLE_PLACES' ? 'Google' : 'Foto');
    }
    return '';
  }

  resultImageAttributionUrl(location: MapLocation): string {
    if (location.photoUrl) {
      return location.photoAttributionUrl || '';
    }
    return '';
  }

  resultImageFailed(location: MapLocation): boolean {
    return this.failedResultImages.has(location.id);
  }

  onResultImageError(location: MapLocation): void {
    this.failedResultImages.add(location.id);
  }

  onResultListScroll(event: globalThis.Event): void {
    const list = event.currentTarget as HTMLElement;
    const horizontal = list.scrollWidth > list.clientWidth + 8;
    const visibleStart = horizontal
      ? Math.floor(list.scrollLeft / 268)
      : Math.floor(list.scrollTop / 90);
    const desiredLimit = visibleStart + (horizontal ? 5 : 10);
    if (desiredLimit < this.resultImageLimit - 2 || this.resultImageLimit >= this.filteredData.length) return;

    this.resultImageLimit = Math.min(Math.max(this.resultImageLimit + 12, desiredLimit + 6), this.filteredData.length);
    this.cdr.markForCheck();
  }

  activeCategoryName(): string {
    return this.labelForCategory(this.activeCategory);
  }

  setMapView(mode: MapViewMode) {
    if (mode === 'SATELLITE' && !this.satelliteAvailable) return;
    this.mapViewMode = mode;
    if (mode === 'SATELLITE') {
      this.satelliteTileErrors = 0;
      this.satelliteTilesLoaded = 0;
    } else if (this.satelliteLoadTimer) {
      clearTimeout(this.satelliteLoadTimer);
      this.satelliteLoadTimer = undefined;
    }

    if (this.googleMap && this.google) {
      const mapType = mode === 'SATELLITE'
        ? this.google.maps.MapTypeId.HYBRID
        : this.google.maps.MapTypeId.ROADMAP;
      this.googleMap.setMapTypeId(mapType);
    }

    if (this.leafletMap) {
      [this.leafletStreetLayer, this.leafletImageryLayer, this.leafletRoadsLayer, this.leafletLabelsLayer]
        .filter((layer): layer is L.TileLayer => Boolean(layer))
        .forEach(layer => this.leafletMap?.removeLayer(layer));

      if (mode === 'SATELLITE') {
        this.leafletImageryLayer?.addTo(this.leafletMap);
        this.leafletRoadsLayer?.addTo(this.leafletMap);
        this.leafletLabelsLayer?.addTo(this.leafletMap);
        this.scheduleSatelliteLoadFallback();
      } else {
        this.leafletStreetLayer?.addTo(this.leafletMap);
      }
    }

    this.mapStatus = mode === 'SATELLITE'
      ? 'Satélite com ruas e pontos locais ativo'
      : 'Mapa detalhado de ruas ativo';
    this.cdr.markForCheck();
  }

  openLocationWebsite(location: MapLocation) {
    if (!location.websiteUrl) return;
    this.analytics.conversion(this.analyticsTargetType(location), 'WEBSITE_CLICK', this.analyticsTargetId(location), '/map');
    openExternalLink(location.websiteUrl);
  }

  openLocationMenu(location: MapLocation) {
    if (!location.menuUrl) return;
    this.analytics.conversion(this.analyticsTargetType(location), 'MENU_CLICK', this.analyticsTargetId(location), '/map');
    openExternalLink(location.menuUrl);
  }

  callLocation(location: MapLocation) {
    if (!location.contactNumber) return;
    const phone = location.contactNumber.replace(/[^\d+]/g, '');
    openExternalLink(`tel:${phone}`);
  }

  compactDetails(value: string | undefined, maxLength = 150): string {
    if (!value) return '';
    const compact = value.replace(/\|/g, ' · ').replace(/\s+/g, ' ').trim();
    return compact.length > maxLength ? `${compact.slice(0, maxLength - 3).trim()}...` : compact;
  }

  private applyRoutePreset() {
    const query = this.pendingInitialParams['q'] || this.pendingInitialParams['search'];
    if (typeof query === 'string') {
      this.searchTerm = query.trim().toLowerCase();
    }

    const category = this.normalizeCategory(this.pendingInitialParams['category'] || this.pendingInitialParams['type']);
    if (category) {
      this.activeCategory = category;
    }

    const travelMode = String(this.pendingInitialParams['mode'] || '').toUpperCase();
    if (['WALKING', 'DRIVING', 'BICYCLING'].includes(travelMode)) {
      this.travelMode = travelMode as TravelMode;
    }
  }

  private async initMap() {
    try {
      const google = await this.withStartupBudget(this.googleLoader.load());
      this.setupGoogleMap(google);
      this.mapStatus = 'Google Maps ativo';
    } catch {
      this.setupLeafletMap();
    }

    this.updateMarkers();
    this.applyInitialSelection(this.pendingInitialParams);
    void this.ensureGooglePlacesForCategory(this.activeCategory);
    void this.ensureGooglePlacesForSearch();
    this.cdr.markForCheck();
  }

  private withStartupBudget<T>(request: Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = window.setTimeout(
        () => reject(new Error('Google Maps excedeu o tempo de inicializacao.')),
        GOOGLE_MAP_STARTUP_BUDGET_MS
      );

      request.then(
        value => {
          window.clearTimeout(timeoutId);
          resolve(value);
        },
        error => {
          window.clearTimeout(timeoutId);
          reject(error);
        }
      );
    });
  }

  private setupGoogleMap(google: any) {
    this.google = google;
    this.googleMap = new google.maps.Map(this.mapCanvas.nativeElement, {
      center: NORONHA_CENTER,
      zoom: 13,
      minZoom: 12,
      maxZoom: 20,
      mapTypeId: this.mapViewMode === 'SATELLITE'
        ? google.maps.MapTypeId.HYBRID
        : google.maps.MapTypeId.ROADMAP,
      backgroundColor: '#e8eaed',
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: true,
      clickableIcons: true,
      gestureHandling: 'greedy',
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_CENTER
      },
      streetViewControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM
      },
      restriction: {
        latLngBounds: NORONHA_BOUNDS,
        strictBounds: false
      }
    });

    this.ngZone.runOutsideAngular(() => {
      this.googleMapListeners.push(
        this.googleMap.addListener('idle', () => this.scheduleMarkerRender())
      );
    });

    this.setMapView(this.mapViewMode);
  }

  private setupLeafletMap() {
    this.leafletMap = L.map(this.mapCanvas.nativeElement, {
      zoomControl: false,
      minZoom: 12,
      maxZoom: 20,
      zoomSnap: 1,
      zoomDelta: 1,
      preferCanvas: true,
      fadeAnimation: false,
      markerZoomAnimation: false,
      maxBounds: NORONHA_LEAFLET_BOUNDS,
      maxBoundsViscosity: 0.8
    }).setView([NORONHA_CENTER.lat, NORONHA_CENTER.lng], 14);

    const tileOptions: L.TileLayerOptions = {
      maxZoom: 20,
      maxNativeZoom: 19,
      updateWhenIdle: true,
      updateWhenZooming: true,
      updateInterval: 120,
      keepBuffer: 2
    };

    this.leafletStreetLayer = L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      { ...tileOptions, className: 'street-map-tiles', attribution: '&copy; OpenStreetMap contributors' }
    );
    this.leafletImageryLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { ...tileOptions, className: 'satellite-map-tiles', attribution: 'Imagens &copy; Esri, Maxar, Earthstar Geographics' }
    )
      .on('tileload', () => this.handleSatelliteTileLoad())
      .on('tileerror', () => this.handleSatelliteTileError());
    this.leafletRoadsLayer = L.tileLayer(
      'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
      { ...tileOptions, attribution: '&copy; Esri' }
    );
    this.leafletLabelsLayer = L.tileLayer(
      'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      { ...tileOptions, attribution: '&copy; Esri' }
    );

    this.setMapView(this.mapViewMode);

    L.control.zoom({ position: 'topright' }).addTo(this.leafletMap);
    this.markersLayer.addTo(this.leafletMap);
    this.routeLayer.addTo(this.leafletMap);
    this.ngZone.runOutsideAngular(() => {
      this.leafletMap?.on('moveend', this.leafletViewportHandler);
    });
  }

  private handleSatelliteTileError() {
    if (
      this.mapViewMode !== 'SATELLITE' ||
      ++this.satelliteTileErrors < 8 ||
      this.satelliteTilesLoaded >= 4
    ) return;

    this.ngZone.run(() => {
      this.satelliteAvailable = false;
      this.setMapView('STREET');
      this.mapStatus = 'Satélite indisponível; mapa detalhado de ruas ativo';
      this.cdr.markForCheck();
    });
  }

  private handleSatelliteTileLoad() {
    this.satelliteTilesLoaded++;
    if (this.satelliteTilesLoaded >= 4 && this.satelliteLoadTimer) {
      clearTimeout(this.satelliteLoadTimer);
      this.satelliteLoadTimer = undefined;
    }
  }

  private scheduleSatelliteLoadFallback() {
    if (this.googleMap || !this.leafletMap) return;
    if (this.satelliteLoadTimer) clearTimeout(this.satelliteLoadTimer);

    this.satelliteLoadTimer = setTimeout(() => {
      this.satelliteLoadTimer = undefined;
      if (this.mapViewMode !== 'SATELLITE' || this.satelliteTilesLoaded >= 4) return;

      this.ngZone.run(() => {
        this.setMapView('STREET');
        this.mapStatus = 'Satélite lento nesta conexão; mapa detalhado de ruas ativo';
        this.cdr.markForCheck();
      });
    }, 2400);
  }

  private loadAllData() {
    forkJoin({
      establishments: this.api.getMapEstablishments(MAP_ESTABLISHMENT_TYPES, true).pipe(
        map(res => res.data || []),
        timeout(7000),
        catchError(() => of([] as Establishment[])),
        map(items => items.map(item => this.establishmentToLocation(item, this.mapCategoryForEstablishment(item.type))))
      ),
      events: this.api.getEvents(undefined, true).pipe(
        map(res => (res.data?.content || []).map(item => this.eventToLocation(item))),
        timeout(7000),
        catchError(() => of([] as MapLocation[]))
      ),
      tours: this.api.getTours(undefined, true).pipe(
        map(res => (res.data?.content || []).map(item => this.tourToLocation(item))),
        timeout(7000),
        catchError(() => of([] as MapLocation[]))
      ),
      points: this.api.getTouristPoints(undefined, undefined, true).pipe(
        map(res => (res.data?.content || []).map(item => this.pointToLocation(item))),
        timeout(7000),
        catchError(() => of([] as MapLocation[]))
      )
    }).subscribe(({ establishments, events, tours, points }) => {
      this.allData = this.dedupeLocations([
        ...this.allData,
        ...establishments,
        ...events,
        ...tours,
        ...points
      ])
        .filter(location => this.isLocationInsideNoronha(location));
      this.updateMarkers();
      this.applyInitialSelection(this.pendingInitialParams);
      this.cdr.markForCheck();
    });
  }

  private loadWeatherLens(): void {
    this.weather.overview().pipe(
      catchError(() => of(null))
    ).subscribe(overview => {
      this.weatherOverview = overview;
      if (!this.weatherNeedsCaution()) {
        this.weatherSafeMode = false;
      }
      this.updateMarkers();
      this.cdr.markForCheck();
    });
  }

  private mapCategoryForEstablishment(type: EstablishmentType): MapCategoryId {
    if (['HOTEL', 'POUSADA', 'RESORT'].includes(type)) return 'HOTEL';
    if (['CONVENIENCE', 'GAS_STATION', 'MARKET', 'FAIR', 'PHARMACY'].includes(type)) return 'CONVENIENCE';
    return 'RESTAURANT';
  }

  private async ensureGooglePlacesForCategory(category: MapCategoryId) {
    const config = this.categories.find(item => item.id === category);
    if (!config?.googleQueries?.length || !this.googleMap || !this.google?.maps?.importLibrary) {
      return;
    }

    if (this.googlePlacesCache.has(category) || this.googlePlacesLoadingFor.has(category)) {
      return;
    }

    this.googlePlacesLoadingFor.add(category);
    this.googlePlacesLoading = true;
    this.cdr.markForCheck();

    try {
      const placesLibrary = await this.google.maps.importLibrary('places');
      const searches = config.googleQueries.map(query =>
        placesLibrary.Place.searchByText({
          textQuery: query,
          fields: ['id', 'displayName', 'primaryTypeDisplayName', 'formattedAddress', 'location', 'rating', 'userRatingCount', 'googleMapsURI', 'businessStatus', 'nationalPhoneNumber', 'websiteURI', 'regularOpeningHours', 'priceLevel', 'photos'],
          locationRestriction: NORONHA_BOUNDS,
          language: 'pt-BR',
          region: 'br',
          maxResultCount: 20
        })
      );

      const responses = await Promise.all(searches);
      const places = responses.flatMap((response: any) => response.places || []);
      const mapped = places
        .map((place: any) => this.googlePlaceToLocation(place, category))
        .filter((place: MapLocation | null): place is MapLocation => Boolean(place))
        .filter((place: MapLocation) => this.isLocationInsideNoronha(place));

      this.googlePlacesCache.set(category, this.dedupeLocations(mapped));
      this.updateMarkers();
    } catch (error) {
      console.warn('Google Places indisponível:', error);
    } finally {
      this.googlePlacesLoadingFor.delete(category);
      this.googlePlacesLoading = this.googlePlacesLoadingFor.size > 0;
      this.cdr.markForCheck();
    }
  }

  private queueGoogleTextSearch() {
    if (this.searchRequestTimer) {
      clearTimeout(this.searchRequestTimer);
    }

    this.searchRequestTimer = setTimeout(() => {
      void this.ensureGooglePlacesForSearch();
    }, 450);
  }

  private queueLocalSearchUpdate() {
    if (this.localSearchFrame !== undefined) {
      cancelAnimationFrame(this.localSearchFrame);
    }

    this.localSearchFrame = requestAnimationFrame(() => {
      this.localSearchFrame = undefined;
      this.updateMarkers();
      this.cdr.markForCheck();
    });
  }

  private async ensureGooglePlacesForSearch() {
    const query = this.searchTerm.trim();
    if (query.length < 3 || !this.googleMap || !this.google?.maps?.importLibrary) {
      if (!query) {
        this.googleTextSearchLocations = [];
        this.updateMarkers();
      }
      return;
    }

    const cacheKey = `${this.activeCategory}:${query}`;
    const requestId = ++this.googleSearchRequestId;
    const cached = this.googleTextSearchCache.get(cacheKey);
    if (cached) {
      this.googleTextSearchLocations = cached;
      this.updateMarkers();
      return;
    }

    this.analytics.conversion(`CATEGORY_${this.activeCategory}`, 'SEARCH', null, `/map?category=${this.activeCategory}&q=${encodeURIComponent(query)}`);
    this.googlePlacesLoading = true;
    this.cdr.markForCheck();

    try {
      const placesLibrary = await this.google.maps.importLibrary('places');
      const categoryLabel = this.activeCategory === 'ALL' ? '' : `${this.labelForCategory(this.activeCategory)} `;
      const response = await placesLibrary.Place.searchByText({
        textQuery: `${categoryLabel}${query} em Fernando de Noronha`,
        fields: ['id', 'displayName', 'primaryTypeDisplayName', 'formattedAddress', 'location', 'rating', 'userRatingCount', 'googleMapsURI', 'businessStatus', 'nationalPhoneNumber', 'websiteURI', 'regularOpeningHours', 'priceLevel', 'photos'],
        locationRestriction: NORONHA_BOUNDS,
        language: 'pt-BR',
        region: 'br',
        maxResultCount: 20
      });

      const targetCategory = this.activeCategory === 'ALL' ? 'POINT' : this.activeCategory;
      const mapped = (response.places || [])
        .map((place: any) => this.googlePlaceToLocation(place, targetCategory))
        .filter((place: MapLocation | null): place is MapLocation => Boolean(place))
        .filter((place: MapLocation) => this.isLocationInsideNoronha(place));

      if (requestId !== this.googleSearchRequestId || cacheKey !== `${this.activeCategory}:${this.searchTerm.trim()}`) {
        return;
      }

      this.googleTextSearchLocations = this.dedupeLocations(mapped);
      this.googleTextSearchCache.set(cacheKey, this.googleTextSearchLocations);
      this.updateMarkers();
    } catch (error) {
      console.warn('Busca no Google Places indisponível:', error);
    } finally {
      this.googlePlacesLoading = this.googlePlacesLoadingFor.size > 0;
      this.cdr.markForCheck();
    }
  }

  private updateMarkers() {
    this.rebuildLocationCatalog();
    const visible = this.getVisibleData();
    this.filteredData = visible;
    this.locationById = new Map(visible.map(location => [location.id, location]));

    const points: Array<Supercluster.PointFeature<MapClusterPoint>> = visible.flatMap(location => {
      const coordinates = this.coordinatesFor(location);
      if (!coordinates) {
        return [];
      }

      return [{
        type: 'Feature' as const,
        properties: { locationId: location.id },
        geometry: {
          type: 'Point' as const,
          coordinates: [coordinates.lng, coordinates.lat]
        }
      }];
    });

    this.clusterIndex.load(points);
    this.scheduleMarkerRender();
  }

  private rebuildLocationCatalog() {
    const googleData = [...this.googlePlacesCache.values()].flat();
    this.locationCatalog = this.dedupeLocations([
      ...this.allData,
      ...googleData,
      ...this.googleTextSearchLocations
    ]);
    this.locationsByCategory.clear();

    this.categories.forEach(category => {
      const locations = category.id === 'ALL'
        ? this.locationCatalog
        : this.locationCatalog.filter(item => item.mapSearchType === category.id);
      this.locationsByCategory.set(category.id, locations);
      this.categoryCounts[category.id] = locations.length;
    });
  }

  private scheduleMarkerRender() {
    if (this.markerRenderFrame !== undefined) {
      return;
    }

    this.markerRenderFrame = requestAnimationFrame(() => {
      this.markerRenderFrame = undefined;
      this.renderMarkersForViewport();
    });
  }

  private renderMarkersForViewport() {
    const view = this.currentMapView();
    if (!view) {
      return;
    }

    this.clearMarkers();
    this.currentZoom = view.zoom;
    this.zoomGuide = view.zoom < 14
      ? 'Visão geral da ilha'
      : view.zoom < 17
        ? 'Lugares separados por área'
        : 'Nomes e estruturas locais';

    const zoom = Math.max(0, Math.min(20, Math.floor(view.zoom)));
    const features = this.clusterIndex.getClusters(view.bounds, zoom);
    const placeFeatures: Array<{ location: MapLocation; lat: number; lng: number }> = [];

    features.forEach(feature => {
      const [lng, lat] = feature.geometry.coordinates;
      if ('cluster' in feature.properties && feature.properties.cluster) {
        this.renderClusterMarker(
          lat,
          lng,
          feature.properties.cluster_id,
          feature.properties.point_count,
          String(feature.properties.point_count_abbreviated)
        );
        return;
      }

      const location = this.locationById.get(feature.properties.locationId);
      if (location) {
        placeFeatures.push({ location, lat, lng });
      }
    });

    const labelsEnabled = view.zoom >= 15;
    const occupiedLabelCells = new Set<string>();
    const acceptedLabelRects: LabelRect[] = [];
    const markerRects = this.leafletMap
      ? placeFeatures.map(({ location, lat, lng }) => {
          const point = this.leafletMap!.latLngToContainerPoint([lat, lng]);
          return {
            id: location.id,
            rect: { left: point.x - 23, top: point.y - 44, right: point.x + 23, bottom: point.y + 5 }
          };
        })
      : [];
    placeFeatures
      .sort((first, second) => this.markerLabelScore(second.location) - this.markerLabelScore(first.location))
      .forEach(({ location, lat, lng }) => {
        const selected = this.selectedLocation?.id === location.id;
        const labelCell = this.labelCellKey(lat, lng, view.zoom);
        const labelRect = this.leafletMap ? this.leafletLabelRect(location, lat, lng) : null;
        const collidesWithLabel = labelRect
          ? acceptedLabelRects.some(rect => this.rectanglesOverlap(labelRect, rect, 4))
          : false;
        const coversMarker = labelRect
          ? markerRects.some(marker => marker.id !== location.id && this.rectanglesOverlap(labelRect, marker.rect, 2))
          : false;
        const showLabel = labelsEnabled && (
          selected || (
            this.leafletMap
              ? !collidesWithLabel && !coversMarker
              : !occupiedLabelCells.has(labelCell)
          )
        );

        if (showLabel) {
          occupiedLabelCells.add(labelCell);
          if (labelRect) {
            acceptedLabelRects.push(labelRect);
          }
        }
        this.renderPlaceMarker(location, lat, lng, showLabel);
      });

    this.cdr.markForCheck();
  }

  private labelCellKey(lat: number, lng: number, zoom: number): string {
    const dimensions = zoom < 16
      ? { lat: 0.0035, lng: 0.009 }
      : zoom < 17
        ? { lat: 0.0017, lng: 0.005 }
        : zoom < 18
          ? { lat: 0.001, lng: 0.003 }
          : zoom < 19
            ? { lat: 0.0006, lng: 0.0016 }
            : zoom < 20
              ? { lat: 0.00035, lng: 0.0009 }
              : { lat: 0.00018, lng: 0.00045 };

    return `${Math.floor(lat / dimensions.lat)}:${Math.floor(lng / dimensions.lng)}`;
  }

  private leafletLabelRect(location: MapLocation, lat: number, lng: number): LabelRect {
    const map = this.leafletMap!;
    const point = map.latLngToContainerPoint([lat, lng]);
    const width = Math.min(210, Math.max(72, this.compactLabel(location.name).length * 7 + 18));
    const onLeft = lng > map.getCenter().lng;

    return onLeft
      ? { left: point.x - 30 - width, top: point.y - 34, right: point.x - 30, bottom: point.y - 4 }
      : { left: point.x + 30, top: point.y - 34, right: point.x + 30 + width, bottom: point.y - 4 };
  }

  private rectanglesOverlap(first: LabelRect, second: LabelRect, padding = 0): boolean {
    return first.left < second.right + padding &&
      first.right > second.left - padding &&
      first.top < second.bottom + padding &&
      first.bottom > second.top - padding;
  }

  private markerLabelScore(location: MapLocation): number {
    if (this.selectedLocation?.id === location.id) {
      return Number.MAX_SAFE_INTEGER;
    }

    const rating = location.rating || 0;
    const reviewWeight = Math.log10((location.reviewCount || 0) + 1);
    const informationWeight = [location.photoUrl, location.openingHours, location.websiteUrl]
      .filter(Boolean).length;
    return rating * 10_000 + reviewWeight * 1_000 + informationWeight * 100 + this.sourcePriority(location.source);
  }

  private renderClusterMarker(
    lat: number,
    lng: number,
    clusterId: number,
    count: number,
    countLabel: string
  ) {
    const size = count >= 50 ? 25 : count >= 10 ? 22 : 19;
    const openCluster = () => this.expandCluster(clusterId, lat, lng);

    if (this.googleMap && this.google) {
      const marker = new this.google.maps.Marker({
        position: { lat, lng },
        map: this.googleMap,
        title: `${count} lugares nesta area`,
        optimized: true,
        zIndex: 500 + count,
        label: {
          text: countLabel,
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: '800'
        },
        icon: {
          path: this.google.maps.SymbolPath.CIRCLE,
          scale: size,
          fillColor: '#1a73e8',
          fillOpacity: 0.94,
          strokeColor: '#ffffff',
          strokeWeight: 3
        }
      });
      marker.addListener('click', openCluster);
      this.googleMarkers.push(marker);
      return;
    }

    if (this.leafletMap) {
      const diameter = size * 2;
      const marker = L.marker([lat, lng], {
        title: `${count} lugares nesta area`,
        icon: L.divIcon({
          html: `<div class="map-cluster" style="--cluster-size:${diameter}px">${this.escapeHtml(countLabel)}</div>`,
          className: 'map-cluster-icon',
          iconSize: [diameter, diameter],
          iconAnchor: [size, size]
        })
      }).on('click', openCluster);
      this.markersLayer.addLayer(marker);
    }
  }

  private renderPlaceMarker(location: MapLocation, lat: number, lng: number, showLabel: boolean) {
    const selected = this.selectedLocation?.id === location.id;

    if (this.googleMap && this.google) {
      const marker = new this.google.maps.Marker({
        position: { lat, lng },
        map: this.googleMap,
        title: location.name,
        optimized: !showLabel,
        zIndex: selected ? 1000 : 100,
        label: showLabel ? {
          text: this.compactLabel(location.name),
          className: 'sistur-google-place-label',
          color: '#202124',
          fontSize: '12px',
          fontWeight: '700'
        } : undefined,
        icon: this.googleMarkerIcon(location.mapSearchType, showLabel, selected)
      });
      marker.addListener('click', () => this.ngZone.run(() => this.selectLocation(location)));
      this.googleMarkers.push(marker);
      return;
    }

    if (this.leafletMap) {
      const labelOnLeft = showLabel && lng > this.leafletMap.getCenter().lng;
      const marker = L.marker([lat, lng], {
        title: location.name,
        riseOnHover: true,
        zIndexOffset: selected ? 1000 : 0,
        icon: this.createLeafletIcon(location, showLabel, selected, labelOnLeft)
      }).on('click', () => this.ngZone.run(() => this.selectLocation(location)));
      this.markersLayer.addLayer(marker);
    }
  }

  private expandCluster(clusterId: number, lat: number, lng: number) {
    let targetZoom = Math.min(18, this.currentZoom + 2);
    try {
      targetZoom = Math.min(18, this.clusterIndex.getClusterExpansionZoom(clusterId));
    } catch {
      // The index may have changed while the user was clicking the cluster.
    }

    if (this.googleMap) {
      this.googleMap.panTo({ lat, lng });
      this.googleMap.setZoom(targetZoom);
      return;
    }

    this.leafletMap?.setView([lat, lng], targetZoom, { animate: true });
  }

  private currentMapView(): { bounds: MapBounds; zoom: number } | null {
    if (this.googleMap) {
      const bounds = this.googleMap.getBounds();
      if (!bounds) {
        return null;
      }

      const southWest = bounds.getSouthWest();
      const northEast = bounds.getNorthEast();
      return {
        bounds: [southWest.lng(), southWest.lat(), northEast.lng(), northEast.lat()],
        zoom: Number(this.googleMap.getZoom() || 14)
      };
    }

    if (this.leafletMap) {
      const bounds = this.leafletMap.getBounds();
      return {
        bounds: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
        zoom: this.leafletMap.getZoom()
      };
    }

    return null;
  }

  private getVisibleData(): MapLocation[] {
    const data = this.getDataForCategory(this.activeCategory);
    const query = this.normalizeSearch(this.searchTerm);
    const filtered = query ? data.filter(item => {
      const haystack = this.normalizeSearch([item.name, item.description, item.location, item.category]
        .filter(Boolean)
        .join(' '));
      return haystack.includes(query);
    }) : [...data];

    const safetyFiltered = this.weatherSafeMode && this.weatherNeedsCaution()
      ? filtered.filter(item => !this.isLocationWeatherExposed(item))
      : filtered;

    return safetyFiltered.sort((first, second) => {
      if (this.userLocation) {
        const firstCoordinates = this.coordinatesFor(first);
        const secondCoordinates = this.coordinatesFor(second);
        const firstDistance = firstCoordinates
          ? this.distanceMeters(this.userLocation.lat, this.userLocation.lng, firstCoordinates.lat, firstCoordinates.lng)
          : Number.POSITIVE_INFINITY;
        const secondDistance = secondCoordinates
          ? this.distanceMeters(this.userLocation.lat, this.userLocation.lng, secondCoordinates.lat, secondCoordinates.lng)
          : Number.POSITIVE_INFINITY;
        if (firstDistance !== secondDistance) return firstDistance - secondDistance;
      }

      const firstScore = (first.rating || 0) * Math.log10((first.reviewCount || 0) + 10);
      const secondScore = (second.rating || 0) * Math.log10((second.reviewCount || 0) + 10);
      return secondScore - firstScore || first.name.localeCompare(second.name, 'pt-BR');
    });
  }

  private getDataForCategory(category: MapCategoryId): MapLocation[] {
    return this.locationsByCategory.get(category) || [];
  }

  private isLocationWeatherExposed(location: MapLocation): boolean {
    if (location.mapSearchType === 'BEACH') {
      return true;
    }

    const subject = this.normalizeSearch([
      location.name,
      location.description,
      location.category,
      location.location,
      location.weatherAdvice,
      location.idealWeather
    ].filter(Boolean).join(' '));
    const exposedTerms = [
      'barco', 'lancha', 'mergulho', 'snorkel', 'trilha', 'pico', 'mirante',
      'costao', 'canoa', 'surf', 'mar aberto', 'naufragio', 'baia'
    ];

    return exposedTerms.some(term => subject.includes(term));
  }

  private clearMarkers() {
    this.markersLayer.clearLayers();
    this.googleMarkers.forEach(marker => marker.setMap(null));
    this.googleMarkers = [];
  }

  private clearRoute() {
    this.routeLayer.clearLayers();
    this.googleRoutePolylines.forEach(polyline => polyline.setMap(null));
    this.googleRoutePolylines = [];
  }

  private clearUserLocationMarker() {
    if (this.googleUserMarker) {
      this.googleUserMarker.setMap(null);
      this.googleUserMarker = undefined;
    }

    if (this.googleUserAccuracyCircle) {
      this.googleUserAccuracyCircle.setMap(null);
      this.googleUserAccuracyCircle = undefined;
    }

    if (this.userLocationMarker && this.leafletMap) {
      this.leafletMap.removeLayer(this.userLocationMarker);
      this.userLocationMarker = undefined;
    }

    if (this.userAccuracyCircle && this.leafletMap) {
      this.leafletMap.removeLayer(this.userAccuracyCircle);
      this.userAccuracyCircle = undefined;
    }
  }

  private handleLocatedPosition(position: GeolocationPosition, focus: boolean) {
    this.updateUserLocation(position, focus);

    if (this.locationState === 'ready') {
      this.startLocationWatch();
      this.updateMarkers();
      if (this.pendingDirections) {
        this.pendingDirections = false;
        this.calculateRouteForSelection();
      }
      return;
    }

    if (this.pendingDirections) {
      this.pendingDirections = false;
      this.routeState = 'error';
      this.routeNotice = 'A rota interna funciona quando você está em Noronha. Para planejar antes da viagem, abra a navegação no Google.';
    }
  }

  private handleLocationError(error: GeolocationPositionError) {
    this.locationState = 'denied';
    this.pendingDirections = false;
    this.routeState = this.routeState === 'locating' ? 'error' : this.routeState;

    if (error.code === error.PERMISSION_DENIED) {
      this.locationMessage = 'Permita a localização do navegador para calcular rotas.';
    } else if (error.code === error.TIMEOUT) {
      this.locationMessage = 'O GPS demorou a responder. Tente novamente em uma área aberta.';
    } else {
      this.locationMessage = 'Não foi possível obter sua posição agora.';
    }
    this.routeNotice = this.routeState === 'error' ? `${this.locationMessage} Você ainda pode abrir a navegação externa.` : this.routeNotice;
    this.cdr.markForCheck();
  }

  private startLocationWatch() {
    if (this.watchId !== undefined || !navigator.geolocation) return;

    this.watchId = navigator.geolocation.watchPosition(
      position => this.updateUserLocation(position, false),
      () => undefined,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  }

  private updateUserLocation(position: GeolocationPosition, focus: boolean) {
    const { latitude, longitude, accuracy } = position.coords;
    if (!this.isInsideBounds(latitude, longitude, NORONHA_USER_BOUNDS)) {
      this.userLocation = undefined;
      this.locationState = 'outside';
      this.locationMessage = 'Você está fora de Noronha; use o Google para planejar o trajeto antes da viagem.';
      this.clearUserLocationMarker();
      this.cdr.markForCheck();
      return;
    }

    this.userLocation = { lat: latitude, lng: longitude, name: 'Sua localização' };
    this.locationState = 'ready';
    this.locationMessage = 'Sua posição está ativa para rotas e lugares próximos.';

    if (this.googleMap && this.google) {
      const center = { lat: latitude, lng: longitude };
      if (this.googleUserMarker) {
        this.googleUserMarker.setPosition(center);
      } else {
        this.googleUserMarker = new this.google.maps.Marker({
          position: center,
          map: this.googleMap,
          title: 'Sua localização',
          icon: {
            path: this.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#1a73e8',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
          }
        });
      }

      if (this.googleUserAccuracyCircle) {
        this.googleUserAccuracyCircle.setCenter(center);
        this.googleUserAccuracyCircle.setRadius(accuracy);
      } else {
        this.googleUserAccuracyCircle = new this.google.maps.Circle({
          map: this.googleMap,
          center,
          radius: accuracy,
          fillColor: '#1a73e8',
          fillOpacity: 0.1,
          strokeColor: '#1a73e8',
          strokeOpacity: 0.2,
          strokeWeight: 1
        });
      }

      if (focus) {
        this.googleMap.panTo(center);
        this.googleMap.setZoom(15);
      }
    }

    if (this.leafletMap) {
      const latLng: L.LatLngExpression = [latitude, longitude];
      if (this.userLocationMarker) {
        this.userLocationMarker.setLatLng(latLng);
      } else {
        this.userLocationMarker = L.circleMarker(latLng, {
          radius: 8,
          fillColor: '#1a73e8',
          color: '#fff',
          weight: 3,
          fillOpacity: 1
        }).addTo(this.leafletMap);
      }

      if (this.userAccuracyCircle) {
        this.userAccuracyCircle.setLatLng(latLng);
        this.userAccuracyCircle.setRadius(accuracy);
      } else {
        this.userAccuracyCircle = L.circle(latLng, {
          radius: accuracy,
          color: '#1a73e8',
          weight: 1,
          opacity: 0.2,
          fillColor: '#1a73e8',
          fillOpacity: 0.1
        }).addTo(this.leafletMap);
      }

      if (focus) {
        this.leafletMap.setView(latLng, 15);
      }
    }

    this.cdr.markForCheck();
  }

  private calculateRouteForSelection() {
    if (!this.selectedLocation || !this.userLocation || !this.hasCoordinates(this.selectedLocation)) return;

    this.clearRoute();
    this.routeSummary = null;
    this.routeState = 'routing';
    this.routeNotice = 'Calculando o melhor trajeto dentro da ilha...';
    this.cdr.markForCheck();

    if (this.googleMap && this.google?.maps?.importLibrary) {
      void this.calculateGoogleRoute();
      return;
    }

    this.calculateLocalRoute();
  }

  private async calculateGoogleRoute() {
    if (!this.selectedLocation || !this.userLocation || !this.google) {
      return;
    }

    const selectedId = this.selectedLocation.id;
    const requestedMode = this.travelMode;

    try {
      const { Route } = await this.google.maps.importLibrary('routes');
      let destination: any = {
        lat: Number(this.selectedLocation.latitude),
        lng: Number(this.selectedLocation.longitude)
      };

      if (this.selectedLocation.googlePlaceId) {
        const { Place } = await this.google.maps.importLibrary('places');
        destination = new Place({ id: this.selectedLocation.googlePlaceId });
      }

      const { routes } = await Route.computeRoutes({
        origin: { lat: this.userLocation.lat, lng: this.userLocation.lng },
        destination,
        travelMode: requestedMode,
        language: 'pt-BR',
        region: 'br',
        fields: ['path', 'distanceMeters', 'durationMillis']
      });

      if (!routes?.length) throw new Error('Nenhuma rota encontrada.');
      if (this.selectedLocation?.id !== selectedId || this.travelMode !== requestedMode) return;

      const route = routes[0];
      this.googleRoutePolylines = route.createPolylines();
      this.googleRoutePolylines.forEach((polyline: any) => {
        polyline.setOptions({ strokeColor: '#1a73e8', strokeOpacity: 0.92, strokeWeight: 6 });
        polyline.setMap(this.googleMap);
      });

      const bounds = new this.google.maps.LatLngBounds();
      (route.path || []).forEach((point: any) => bounds.extend(point));
      if (!bounds.isEmpty()) {
        this.googleMap.fitBounds(bounds, { top: 90, right: 56, bottom: 260, left: 56 });
      }

      this.routeSummary = {
        distanceMeters: route.distanceMeters || 0,
        durationSeconds: Math.round((route.durationMillis || 0) / 1000),
        difficulty: this.routeDifficulty(route.distanceMeters || 0, requestedMode),
        estimatedCalories: this.routeCalories(route.distanceMeters || 0, requestedMode),
        optimizedWaypoints: [],
        polyline: '',
        routeSource: 'GOOGLE_ROUTES',
        estimated: false,
        travelMode: requestedMode
      };
      this.routeState = 'ready';
      this.routeNotice = 'Rota viária calculada pelo Google para o modo selecionado.';
      this.cdr.markForCheck();
    } catch {
      this.calculateLocalRoute();
    }
  }

  private calculateLocalRoute() {
    if (!this.selectedLocation || !this.userLocation || !this.hasCoordinates(this.selectedLocation)) return;

    const selectedId = this.selectedLocation.id;
    const requestedMode = this.travelMode;
    this.api.calculateRoute({
      travelMode: requestedMode,
      waypoints: [
        this.userLocation,
        {
          lat: Number(this.selectedLocation.latitude),
          lng: Number(this.selectedLocation.longitude),
          name: this.selectedLocation.name
        }
      ]
    }, true).pipe(timeout(5000)).subscribe({
      next: response => {
        if (!response.data || this.selectedLocation?.id !== selectedId || this.travelMode !== requestedMode) return;
        this.routeSummary = response.data;
        this.routeState = 'estimated';
        this.routeNotice = 'Estimativa em linha direta. Para curvas, vias e navegação passo a passo, abra no Google.';
        this.drawLocalRoute(response.data);
        this.cdr.markForCheck();
      },
      error: () => {
        this.routeState = 'error';
        this.routeNotice = 'A rota interna está indisponível nesta conexão. A navegação externa continua disponível.';
        this.cdr.markForCheck();
      }
    });
  }

  private drawLocalRoute(route: RouteResponseDTO) {
    if (!this.leafletMap) return;

    const points = this.decodePolyline(route.polyline);
    if (points.length < 2) return;

    const polyline = L.polyline(points, {
      color: '#1a73e8',
      weight: 5,
      opacity: 0.9,
      dashArray: '9 7',
      lineCap: 'round'
    });
    this.routeLayer.addLayer(polyline);
    this.leafletMap.fitBounds(polyline.getBounds(), { paddingTopLeft: [36, 90], paddingBottomRight: [36, 230] });
  }

  private focusLocation(location: MapLocation, zoom = 15) {
    if (!this.hasCoordinates(location)) {
      return;
    }

    const center = { lat: Number(location.latitude), lng: Number(location.longitude) };
    if (this.googleMap) {
      this.googleMap.panTo(center);
      this.googleMap.setZoom(zoom);
      return;
    }

    if (this.leafletMap) {
      this.leafletMap.setView([center.lat, center.lng], zoom);
    }
  }

  private focusFilteredLocations(maxZoom = 14.5) {
    const coordinates = this.filteredData
      .map(location => this.coordinatesFor(location))
      .filter((coordinate): coordinate is { lat: number; lng: number } => Boolean(coordinate));

    if (!coordinates.length) return;
    if (coordinates.length === 1) {
      const [coordinate] = coordinates;
      if (this.googleMap) {
        this.googleMap.panTo(coordinate);
        this.googleMap.setZoom(Math.min(15, maxZoom));
      } else {
        this.leafletMap?.setView([coordinate.lat, coordinate.lng], Math.min(15, maxZoom));
      }
      return;
    }

    if (this.googleMap && this.google) {
      const bounds = new this.google.maps.LatLngBounds();
      coordinates.forEach(coordinate => bounds.extend(coordinate));
      this.googleMap.fitBounds(bounds, { top: 76, right: 48, bottom: 48, left: 48 });
      this.google.maps.event.addListenerOnce(this.googleMap, 'idle', () => {
        if (Number(this.googleMap?.getZoom() || 0) > maxZoom) {
          this.googleMap.setZoom(maxZoom);
        }
      });
      return;
    }

    if (this.leafletMap) {
      const bounds = L.latLngBounds(coordinates.map(coordinate => [coordinate.lat, coordinate.lng] as L.LatLngTuple));
      this.leafletMap.fitBounds(bounds, { padding: [48, 48], maxZoom });
    }
  }

  private async enrichSelectedLocation(location: MapLocation): Promise<void> {
    if (location.source === 'GOOGLE_PLACES' || this.placeSummaryRequests.has(location.id)) return;

    this.placeSummaryRequests.add(location.id);
    try {
      const details = await this.googlePlaceDetails.getSummary({
        name: location.name,
        googlePlaceId: location.googlePlaceId,
        googleQuery: [location.name, location.location, 'Fernando de Noronha'].filter(Boolean).join(', ')
      });
      if (!details || (!location.googlePlaceId && !this.placeNamesMatch(location.name, details.name))) return;

      const hasPreciseCoordinates = details.latitude !== undefined &&
        details.longitude !== undefined &&
        this.isInsideBounds(details.latitude, details.longitude, NORONHA_BOUNDS);
      const updates: Partial<MapLocation> = {
        photoUrl: details.photoUrl,
        photoAttributionName: details.photoAttribution?.name,
        photoAttributionUrl: details.photoAttribution?.url,
        latitude: hasPreciseCoordinates ? details.latitude : undefined,
        longitude: hasPreciseCoordinates ? details.longitude : undefined,
        rating: details.rating,
        reviewCount: details.reviewCount,
        openingHours: details.openingHours?.join(' | '),
        contactNumber: details.contactNumber,
        websiteUrl: details.websiteUrl,
        googleMapsUrl: details.googleMapsUrl,
        googlePlaceId: details.placeId,
        location: details.formattedAddress
      };

      const key = this.locationDedupeKey(location);
      const candidates = [
        ...this.allData,
        ...this.googleTextSearchLocations,
        ...[...this.googlePlacesCache.values()].flat()
      ].filter(candidate => this.locationDedupeKey(candidate) === key);
      [location, ...candidates].forEach(candidate => {
        (Object.keys(updates) as Array<keyof MapLocation>).forEach(field => {
          if (this.hasValue(updates[field])) {
            (candidate as any)[field] = updates[field];
          }
        });
      });

      this.failedResultImages.delete(location.id);
      this.updateMarkers();
      if (this.selectedLocation?.id === location.id) {
        this.selectedLocation = location;
        this.focusLocation(location, 17);
      }
      this.cdr.markForCheck();
    } finally {
      this.placeSummaryRequests.delete(location.id);
    }
  }

  private placeNamesMatch(expected: string, actual: string): boolean {
    const expectedSlug = this.slug(expected);
    const actualSlug = this.slug(actual);
    return expectedSlug === actualSlug ||
      (Math.min(expectedSlug.length, actualSlug.length) >= 6 &&
        (expectedSlug.includes(actualSlug) || actualSlug.includes(expectedSlug)));
  }

  private applyInitialSelection(params: Params) {
    const id = params['id'];
    const type = this.normalizeCategory(params['type']);
    if (!id || !type) {
      return;
    }

    const found = this.allData.find(item =>
      String(item.sourceId) === String(id) &&
      item.mapSearchType === type
    );

    if (found) {
      this.selectLocation(found);
    }
  }

  private establishmentToLocation(item: Establishment, category: MapCategoryId): MapLocation {
    return {
      id: `SISTUR-${category}-${item.id}`,
      sourceId: item.id,
      source: 'SISTUR',
      mapSearchType: category,
      name: item.name,
      description: item.description,
      category: item.foodType || this.labelForCategory(category),
      location: item.location,
      photoUrl: item.photoUrl,
      latitude: this.toNumber(item.latitude),
      longitude: this.toNumber(item.longitude),
      rating: item.rating,
      reviewCount: item.reviewCount,
      averagePrice: item.averagePrice,
      priceRange: item.priceRange,
      openingHours: item.openingHours,
      contactNumber: item.contactNumber,
      websiteUrl: item.websiteUrl,
      menuUrl: item.menuUrl,
      popularDishes: item.popularDishes,
      bestVisitTime: item.bestVisitTime,
      weatherAdvice: item.weatherAdvice,
      amenities: item.amenities,
      googleMapsUrl: item.googleMapsUrl,
      googlePlaceId: item.googlePlaceId
    };
  }

  private eventToLocation(item: Event): MapLocation {
    return {
      id: `SISTUR-EVENT-${item.id}`,
      sourceId: item.id,
      source: 'SISTUR',
      mapSearchType: 'EVENT',
      name: item.title,
      description: item.description,
      category: item.category,
      location: item.location,
      photoUrl: item.photoUrl,
      latitude: this.toNumber(item.latitude),
      longitude: this.toNumber(item.longitude)
    };
  }

  private tourToLocation(item: Tour): MapLocation {
    return {
      id: `SISTUR-TOUR-${item.id}`,
      sourceId: item.id,
      source: 'SISTUR',
      mapSearchType: 'TOUR',
      name: item.name,
      description: item.description,
      category: item.category,
      location: item.partnership,
      photoUrl: item.photoUrl,
      latitude: this.toNumber(item.latitude),
      longitude: this.toNumber(item.longitude),
      rating: item.rating,
      reviewCount: item.reviewCount,
      averagePrice: item.price,
      contactNumber: item.contactNumber,
      websiteUrl: item.sourceUrl || item.bookingUrl,
      googleMapsUrl: item.googleMapsUrl,
      duration: item.duration,
      schedule: item.schedule,
      meetingPoint: item.meetingPoint
    };
  }

  private pointToLocation(item: TouristPoint): MapLocation {
    const category = this.pointMapCategory(item);
    return {
      id: `SISTUR-${category}-${item.id}`,
      sourceId: item.id,
      source: 'SISTUR',
      mapSearchType: category,
      name: item.name,
      description: item.description,
      category: item.category,
      location: item.location,
      photoUrl: item.photoUrl,
      latitude: this.toNumber(item.latitude),
      longitude: this.toNumber(item.longitude),
      bestVisitTime: item.bestTime,
      idealWeather: item.idealWeather,
      accessType: item.accessType,
      requiresTicket: item.requiresTicket,
      requiresGuide: item.requiresGuide
    };
  }

  private googlePlaceToLocation(place: any, category: MapCategoryId): MapLocation | null {
    const lat = typeof place.location?.lat === 'function' ? place.location.lat() : place.location?.lat;
    const lng = typeof place.location?.lng === 'function' ? place.location.lng() : place.location?.lng;
    const name = this.googleText(place.displayName);

    if (!name || lat === undefined || lng === undefined) {
      return null;
    }

    const sourceId = place.id || `${category}-${name}`;
    const photo = place.photos?.[0];
    const photoAttribution = Array.isArray(photo?.authorAttributions)
      ? photo.authorAttributions[0]
      : undefined;
    return {
      id: `GOOGLE-${category}-${sourceId}`,
      sourceId,
      source: 'GOOGLE_PLACES',
      mapSearchType: category,
      name,
      description: `Informações atualizadas pelo Google para ${name}.`,
      category: this.googleText(place.primaryTypeDisplayName) || this.labelForCategory(category),
      location: place.formattedAddress,
      photoUrl: this.googlePhotoUrl(photo),
      photoAttributionName: photoAttribution?.displayName
        ? String(photoAttribution.displayName)
        : undefined,
      photoAttributionUrl: photoAttribution?.uri
        ? String(photoAttribution.uri)
        : undefined,
      latitude: Number(lat),
      longitude: Number(lng),
      rating: typeof place.rating === 'number' ? place.rating : null,
      reviewCount: typeof place.userRatingCount === 'number' ? place.userRatingCount : null,
      priceRange: this.googlePriceRange(place.priceLevel),
      openingHours: this.googleOpeningHours(place.regularOpeningHours),
      contactNumber: place.nationalPhoneNumber ? String(place.nationalPhoneNumber) : undefined,
      websiteUrl: place.websiteURI ? String(place.websiteURI) : undefined,
      googleMapsUrl: place.googleMapsURI ? String(place.googleMapsURI) : undefined,
      googlePlaceId: String(place.id)
    };
  }

  private googleText(value: any): string {
    if (typeof value === 'string') {
      return value;
    }

    if (typeof value?.text === 'string') {
      return value.text;
    }

    return '';
  }

  private googleOpeningHours(value: any): string | undefined {
    const descriptions = value?.weekdayDescriptions;
    return Array.isArray(descriptions) && descriptions.length ? descriptions.join(' | ') : undefined;
  }

  private googlePhotoUrl(photo: any): string | undefined {
    try {
      return typeof photo?.getURI === 'function'
        ? String(photo.getURI({ maxWidth: 720, maxHeight: 480 }))
        : undefined;
    } catch {
      return undefined;
    }
  }

  private googlePriceRange(value: unknown): string | undefined {
    const levels: Record<string, string> = {
      PRICE_LEVEL_FREE: 'Grátis',
      PRICE_LEVEL_INEXPENSIVE: '$',
      PRICE_LEVEL_MODERATE: '$$',
      PRICE_LEVEL_EXPENSIVE: '$$$',
      PRICE_LEVEL_VERY_EXPENSIVE: '$$$$'
    };
    return typeof value === 'string' ? levels[value] : undefined;
  }

  private toNumber(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  private hasCoordinates(location: MapLocation): boolean {
    return Boolean(this.coordinatesFor(location));
  }

  private coordinatesFor(location: MapLocation): { lat: number; lng: number } | null {
    const lat = this.toNumber(location.latitude);
    const lng = this.toNumber(location.longitude);

    if (lat === null || lng === null) {
      return null;
    }

    return { lat, lng };
  }

  private isLocationInsideNoronha(location: MapLocation): boolean {
    const coords = this.coordinatesFor(location);
    return Boolean(coords && this.isInsideBounds(coords.lat, coords.lng, NORONHA_BOUNDS));
  }

  private isInsideBounds(
    lat: number,
    lng: number,
    bounds: { north: number; south: number; east: number; west: number }
  ): boolean {
    return lat >= bounds.south &&
      lat <= bounds.north &&
      lng >= bounds.west &&
      lng <= bounds.east;
  }

  private normalizeCategory(value: unknown): MapCategoryId | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.toUpperCase();
    if (normalized === 'BAR') return 'RESTAURANT';
    if (['POUSADA', 'RESORT', 'LODGING'].includes(normalized)) return 'HOTEL';
    if (['PRAIA', 'PRAIAS', 'BEACH', 'BEACHES', 'BAIA', 'BAÍA', 'SURF'].includes(normalized)) return 'BEACH';
    if (['HIGHLIGHT', 'TOURIST_POINT', 'TOURIST_ATTRACTION'].includes(normalized)) return 'POINT';
    if (['GAS_STATION', 'MARKET', 'FAIR', 'PHARMACY'].includes(normalized)) return 'CONVENIENCE';

    return this.categories.some(category => category.id === normalized)
      ? normalized as MapCategoryId
      : null;
  }

  private toItineraryType(location: MapLocation): 'RESTAURANT' | 'HOTEL' | 'EVENT' | 'TOUR' | 'HIGHLIGHT' {
    if (location.mapSearchType === 'RESTAURANT') return 'RESTAURANT';
    if (location.mapSearchType === 'HOTEL') return 'HOTEL';
    if (location.mapSearchType === 'EVENT') return 'EVENT';
    if (location.mapSearchType === 'TOUR') return 'TOUR';
    return 'HIGHLIGHT';
  }

  private analyticsTargetType(location: MapLocation): string {
    if (location.source === 'GOOGLE_PLACES') {
      return `GOOGLE_${location.mapSearchType}`;
    }

    if (['RESTAURANT', 'HOTEL', 'CONVENIENCE'].includes(location.mapSearchType)) {
      return 'ESTABLISHMENT';
    }

    if (['BEACH', 'POINT'].includes(location.mapSearchType)) {
      return 'TOURIST_POINT';
    }

    return location.mapSearchType;
  }

  private analyticsTargetId(location: MapLocation): number | string | null {
    return location.sourceId ?? location.id ?? null;
  }

  private googleServiceUrl(location: MapLocation): string {
    if (location.googleMapsUrl) {
      return location.googleMapsUrl;
    }

    const query = [location.name, location.location || 'Fernando de Noronha']
      .filter(Boolean)
      .join(' ');

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  private openDirectionsInGoogleMaps(location: MapLocation | null = this.selectedLocation) {
    if (!location) {
      return;
    }

    this.analytics.conversion(this.analyticsTargetType(location), 'DIRECTIONS_CLICK', this.analyticsTargetId(location), `/map?category=${location.mapSearchType}`);
    openExternalLink(this.googleDirectionsUrl(location));
  }

  private googleDirectionsUrl(location: MapLocation): string {
    const params = new URLSearchParams({ api: '1', travelmode: 'driving' });

    if (this.userLocation) {
      params.set('origin', `${this.userLocation.lat},${this.userLocation.lng}`);
    }

    if (this.hasCoordinates(location)) {
      params.set('destination', `${Number(location.latitude)},${Number(location.longitude)}`);
    } else {
      params.set('destination', [location.name, location.location || 'Fernando de Noronha'].filter(Boolean).join(' '));
    }

    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  private googleCategoryQuery(category: MapCategoryId): string {
    const queries: Record<MapCategoryId, string> = {
      ALL: 'turismo Fernando de Noronha',
      RESTAURANT: 'restaurantes Fernando de Noronha',
      HOTEL: 'hoteis pousadas Fernando de Noronha',
      EVENT: 'eventos Fernando de Noronha',
      TOUR: 'passeios turisticos Fernando de Noronha',
      BEACH: 'praias Fernando de Noronha',
      POINT: 'pontos turisticos praias Fernando de Noronha',
      CONVENIENCE: 'postos mercados farmacias conveniencias feiras Fernando de Noronha'
    };

    return queries[category];
  }

  private pointMapCategory(item: TouristPoint): MapCategoryId {
    const normalized = (item.category || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    return ['PRAIA', 'BAIA', 'MERGULHO', 'SURF'].some(term => normalized.includes(term)) ? 'BEACH' : 'POINT';
  }

  private labelForCategory(category: MapCategoryId): string {
    return this.categories.find(item => item.id === category)?.label || 'Local';
  }

  private googleMarkerIcon(category: MapCategoryId, showLabel = false, selected = false) {
    const color = this.colorForCategory(category);
    return {
      path: this.google.maps.SymbolPath.CIRCLE,
      scale: selected ? 13 : 10,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: selected ? 4 : 3,
      labelOrigin: showLabel ? new this.google.maps.Point(0, -23) : undefined
    };
  }

  private createLeafletIcon(
    location: MapLocation,
    showLabel: boolean,
    selected: boolean,
    labelOnLeft: boolean
  ) {
    const label = showLabel
      ? `<span class="marker-label">${this.escapeHtml(this.compactLabel(location.name))}</span>`
      : '';
    const imageUrl = this.currentZoom >= 15 && !this.resultImageFailed(location)
      ? location.photoUrl || ''
      : '';
    const markerImage = imageUrl
      ? `<img src="${this.escapeHtml(imageUrl)}" alt="" loading="lazy" decoding="async">`
      : '';
    return L.divIcon({
      html: `<div class="map-marker-shell${showLabel ? ' has-label' : ''}${selected ? ' is-selected' : ''}${labelOnLeft ? ' label-left' : ''}"><div class="marker-photo pin-${location.mapSearchType.toLowerCase()}"><i class="${this.iconForCategory(location.mapSearchType)}"></i>${markerImage}<span class="marker-category"><i class="${this.iconForCategory(location.mapSearchType)}"></i></span></div>${label}</div>`,
      className: 'custom-div-icon',
      iconSize: [46, 46],
      iconAnchor: [23, 42]
    });
  }

  private iconForCategory(category: MapCategoryId): string {
    return this.categories.find(item => item.id === category)?.icon || 'pi pi-map-marker';
  }

  private colorForCategory(category: MapCategoryId): string {
    const colors: Record<MapCategoryId, string> = {
      ALL: '#1a73e8',
      RESTAURANT: '#ea4335',
      HOTEL: '#34a853',
      EVENT: '#a142f4',
      TOUR: '#fbbc04',
      BEACH: '#06b6d4',
      POINT: '#1a73e8',
      CONVENIENCE: '#f97316'
    };
    return colors[category];
  }

  private dedupeLocations(locations: MapLocation[]): MapLocation[] {
    const seen = new Map<string, MapLocation>();

    locations.forEach(location => {
      const key = this.locationDedupeKey(location);
      const existing = seen.get(key);

      if (!existing) {
        seen.set(key, location);
        return;
      }

      seen.set(key, this.mergeLocations(existing, location));
    });

    return [...seen.values()];
  }

  private locationDedupeKey(location: MapLocation): string {
    return `${location.mapSearchType}:name:${this.slug(location.name)}`;
  }

  private mergeLocations(existing: MapLocation, incoming: MapLocation): MapLocation {
    const primary = this.sourcePriority(incoming.source) > this.sourcePriority(existing.source)
      ? incoming
      : existing;
    const fallback = primary === incoming ? existing : incoming;
    const merged = { ...fallback, ...primary } as MapLocation;

    (Object.keys(fallback) as Array<keyof MapLocation>).forEach(key => {
      if (!this.hasValue(merged[key]) && this.hasValue(fallback[key])) {
        (merged as any)[key] = fallback[key];
      }
    });

    const candidates = [existing, incoming];
    const coordinateSource = candidates
      .filter(candidate => this.hasCoordinates(candidate))
      .sort((first, second) => this.coordinatePriority(second.source) - this.coordinatePriority(first.source))[0];
    if (coordinateSource) {
      merged.latitude = coordinateSource.latitude;
      merged.longitude = coordinateSource.longitude;
    }

    const googleSource = candidates.find(candidate => candidate.source === 'GOOGLE_PLACES');
    if (googleSource) {
      const liveFields: Array<keyof MapLocation> = [
        'photoUrl',
        'photoAttributionName',
        'photoAttributionUrl',
        'rating',
        'reviewCount',
        'openingHours',
        'contactNumber',
        'websiteUrl',
        'googleMapsUrl',
        'googlePlaceId',
        'location'
      ];
      liveFields.forEach(key => {
        if (this.hasValue(googleSource[key])) {
          (merged as any)[key] = googleSource[key];
        }
      });
      merged.googlePlaceId = googleSource.googlePlaceId || String(googleSource.sourceId || '') || merged.googlePlaceId;
    }

    return merged;
  }

  private hasValue(value: unknown): boolean {
    return value !== undefined && value !== null && value !== '';
  }

  private sourcePriority(source: MapSource): number {
    if (source === 'SISTUR') return 3;
    if (source === 'CURATED') return 2;
    return 1;
  }

  private coordinatePriority(source: MapSource): number {
    if (source === 'GOOGLE_PLACES') return 3;
    if (source === 'CURATED') return 2;
    return 1;
  }

  private routeDifficulty(distanceMeters: number, mode: TravelMode): string {
    if (mode === 'DRIVING') return 'EASY';
    const easyLimit = mode === 'WALKING' ? 4000 : 8000;
    const moderateLimit = mode === 'WALKING' ? 12000 : 20000;
    if (distanceMeters < easyLimit) return 'EASY';
    if (distanceMeters < moderateLimit) return 'MODERATE';
    return 'HARD';
  }

  private routeCalories(distanceMeters: number, mode: TravelMode): number {
    if (mode === 'WALKING') return distanceMeters * 0.05;
    if (mode === 'BICYCLING') return distanceMeters * 0.03;
    return 0;
  }

  private distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const radius = 6_371_000;
    const toRadians = (value: number) => value * Math.PI / 180;
    const startLat = toRadians(lat1);
    const endLat = toRadians(lat2);
    const deltaLat = toRadians(lat2 - lat1);
    const deltaLng = toRadians(lng2 - lng1);
    const haversine = Math.sin(deltaLat / 2) ** 2 +
      Math.cos(startLat) * Math.cos(endLat) * Math.sin(deltaLng / 2) ** 2;
    const normalizedHaversine = Math.min(1, Math.max(0, haversine));
    return radius * 2 * Math.atan2(Math.sqrt(normalizedHaversine), Math.sqrt(1 - normalizedHaversine));
  }

  private decodePolyline(encoded: string): L.LatLngExpression[] {
    if (!encoded) return [];

    const points: L.LatLngExpression[] = [];
    let index = 0;
    let latitude = 0;
    let longitude = 0;

    while (index < encoded.length) {
      const latitudeValue = this.decodePolylineValue(encoded, index);
      index = latitudeValue.nextIndex;
      latitude += latitudeValue.delta;

      const longitudeValue = this.decodePolylineValue(encoded, index);
      index = longitudeValue.nextIndex;
      longitude += longitudeValue.delta;
      points.push([latitude / 100000, longitude / 100000]);
    }

    return points;
  }

  private decodePolylineValue(encoded: string, startIndex: number): { delta: number; nextIndex: number } {
    let index = startIndex;
    let result = 0;
    let shift = 0;
    let byte = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);

    return {
      delta: (result & 1) ? ~(result >> 1) : result >> 1,
      nextIndex: index
    };
  }

  private compactLabel(value: string): string {
    return value.length > 28 ? `${value.slice(0, 27).trim()}...` : value;
  }

  private normalizeSearch(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private slug(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
  }
}

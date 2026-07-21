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
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { merge, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import * as L from 'leaflet';
import Supercluster from 'supercluster';
import { ApiService } from '../../services/api.service';
import { AnalyticsService } from '../../services/analytics.service';
import { GoogleMapsLoaderService } from '../../services/google-maps-loader.service';
import { ItineraryService } from '../../services/itinerary.service';
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
type LocationState = 'idle' | 'loading' | 'ready' | 'denied';

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
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  averagePrice?: number | null;
  openingHours?: string;
  contactNumber?: string;
  websiteUrl?: string;
  googleMapsUrl?: string;
}

interface MapClusterPoint {
  locationId: string;
}

type MapBounds = [west: number, south: number, east: number, north: number];

const NORONHA_CENTER = { lat: -3.8415, lng: -32.4116 };
const NORONHA_BOUNDS = {
  north: -3.8200,
  south: -3.8900,
  east: -32.3850,
  west: -32.4700
};
const NORONHA_USER_BOUNDS = {
  north: -3.8100,
  south: -3.9000,
  east: -32.3700,
  west: -32.4850
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

@Component({
  selector: 'app-map-page',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
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
  private analytics = inject(AnalyticsService);
  public itinerary = inject(ItineraryService);

  private leafletMap?: L.Map;
  private markersLayer = L.layerGroup();
  private routeLayer = L.layerGroup();
  private userLocationMarker?: L.CircleMarker;
  private userAccuracyCircle?: L.Circle;

  private google?: any;
  private googleMap?: any;
  private googleMarkers: any[] = [];
  private googleMapListeners: any[] = [];
  private googleUserMarker?: any;
  private googleUserAccuracyCircle?: any;
  private googleRoutePolyline?: any;
  private directionsService?: any;
  private directionsRenderer?: any;
  private watchId?: number;
  private pendingInitialParams: Params = {};
  private googlePlacesCache = new Map<MapCategoryId, MapLocation[]>();
  private googleTextSearchCache = new Map<string, MapLocation[]>();
  private googleTextSearchLocations: MapLocation[] = [];
  private googlePlacesLoadingFor = new Set<MapCategoryId>();
  private searchRequestTimer?: ReturnType<typeof setTimeout>;
  private markerRenderFrame?: number;
  private localSearchFrame?: number;
  private googleSearchRequestId = 0;
  private readonly clusterIndex = new Supercluster<MapClusterPoint, Record<string, never>>({
    minZoom: 0,
    maxZoom: 16,
    minPoints: 2,
    radius: 54,
    nodeSize: 64
  });
  private locationById = new Map<string, MapLocation>();
  private locationCatalog: MapLocation[] = [];
  private locationsByCategory = new Map<MapCategoryId, MapLocation[]>();
  private readonly leafletViewportHandler = () => this.scheduleMarkerRender();

  Math = Math;
  activeCategory: MapCategoryId = 'ALL';
  selectedLocation: MapLocation | null = null;
  routeSummary: RouteResponseDTO | null = null;
  searchTerm = '';
  mapStatus = 'Carregando mapa...';
  currentZoom = 14;
  zoomGuide = 'Aproxime o mapa para separar os lugares.';
  googlePlacesLoading = false;
  locationState: LocationState = 'idle';
  locationMessage = 'Use sua posição para calcular rotas reais.';
  userLocation?: LocationDTO;

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
    this.routeSummary = null;
    this.clearRoute();
    this.analytics.conversion(`CATEGORY_${type}`, 'CATEGORY_FILTER', null, `/map?category=${type}`);
    this.updateMarkers();
    void this.ensureGooglePlacesForCategory(type);
    void this.ensureGooglePlacesForSearch();
    this.cdr.markForCheck();
  }

  onSearch(event: globalThis.Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.queueLocalSearchUpdate();
    this.queueGoogleTextSearch();
    this.cdr.markForCheck();
  }

  clearSearch() {
    if (!this.searchTerm) {
      return;
    }

    this.searchTerm = '';
    this.googleSearchRequestId++;
    this.googleTextSearchLocations = [];
    this.updateMarkers();
    this.cdr.markForCheck();
  }

  selectLocation(location: MapLocation) {
    this.selectedLocation = location;
    this.routeSummary = null;
    this.clearRoute();
    this.focusLocation(location, 16);
    this.scheduleMarkerRender();
    this.cdr.markForCheck();
  }

  closeLocation() {
    this.selectedLocation = null;
    this.routeSummary = null;
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
      position => this.updateUserLocation(position, focus),
      () => {
        this.locationState = 'denied';
        this.locationMessage = 'Ative o GPS para rotas a partir da sua posição.';
        this.cdr.markForCheck();
      },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 }
    );

    if (this.watchId === undefined) {
      this.watchId = navigator.geolocation.watchPosition(
        position => this.updateUserLocation(position, false),
        () => undefined,
        { enableHighAccuracy: true, maximumAge: 30000 }
      );
    }
  }

  getDirections() {
    if (!this.selectedLocation) {
      return;
    }

    if (!this.userLocation || !this.hasCoordinates(this.selectedLocation)) {
      if (!this.userLocation) {
        this.requestUserLocation(true);
      }
      this.locationMessage = this.hasCoordinates(this.selectedLocation)
        ? 'Sem posicao ativa neste navegador; abrindo rota no Google Maps.'
        : 'Abrindo rota no Google Maps usando o nome do local.';
      this.openDirectionsInGoogleMaps(this.selectedLocation);
      this.cdr.markForCheck();
      return;
    }

    this.clearRoute();

    if (this.googleMap && this.directionsService && this.directionsRenderer) {
      this.calculateGoogleRoute();
      return;
    }

    this.calculateLocalRoute();
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
      RESTAURANT: '/establishments',
      HOTEL: '/establishments',
      EVENT: '/events',
      TOUR: '/tours',
      BEACH: '/pontos-turisticos',
      POINT: '/pontos-turisticos',
      CONVENIENCE: '/establishments'
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

  activeCategoryName(): string {
    return this.labelForCategory(this.activeCategory);
  }

  private applyRoutePreset() {
    const currentPath = this.activatedRoute.snapshot.routeConfig?.path;
    if (currentPath === 'conveniencias') {
      this.activeCategory = 'CONVENIENCE';
    }

    const query = this.pendingInitialParams['q'] || this.pendingInitialParams['search'];
    if (typeof query === 'string') {
      this.searchTerm = query.trim().toLowerCase();
    }

    const category = this.normalizeCategory(this.pendingInitialParams['category'] || this.pendingInitialParams['type']);
    if (category) {
      this.activeCategory = category;
    }
  }

  private async initMap() {
    try {
      const google = await this.googleLoader.load();
      this.setupGoogleMap(google);
      this.mapStatus = 'Google Maps ativo';
    } catch {
      this.setupLeafletMap();
      this.mapStatus = 'Mapa detalhado de Noronha ativo';
    }

    this.updateMarkers();
    this.applyInitialSelection(this.pendingInitialParams);
    void this.ensureGooglePlacesForCategory(this.activeCategory);
    void this.ensureGooglePlacesForSearch();
    this.cdr.markForCheck();
  }

  private setupGoogleMap(google: any) {
    this.google = google;
    this.googleMap = new google.maps.Map(this.mapCanvas.nativeElement, {
      center: NORONHA_CENTER,
      zoom: 14,
      minZoom: 12,
      maxZoom: 20,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      backgroundColor: '#e8eaed',
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: true,
      clickableIcons: true,
      gestureHandling: 'greedy',
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM
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

    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      map: this.googleMap,
      suppressMarkers: true,
      preserveViewport: false,
      polylineOptions: {
        strokeColor: '#1a73e8',
        strokeWeight: 6,
        strokeOpacity: 0.9
      }
    });
  }

  private setupLeafletMap() {
    this.leafletMap = L.map(this.mapCanvas.nativeElement, {
      zoomControl: false,
      minZoom: 12,
      maxZoom: 20,
      preferCanvas: true,
      maxBounds: NORONHA_LEAFLET_BOUNDS,
      maxBoundsViscosity: 0.8
    }).setView([NORONHA_CENTER.lat, NORONHA_CENTER.lng], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 20,
      updateWhenIdle: true,
      updateWhenZooming: false,
      keepBuffer: 2,
      crossOrigin: true
    }).addTo(this.leafletMap);

    L.control.zoom({ position: 'bottomright' }).addTo(this.leafletMap);
    this.markersLayer.addTo(this.leafletMap);
    this.routeLayer.addTo(this.leafletMap);
    this.ngZone.runOutsideAngular(() => {
      this.leafletMap?.on('moveend', this.leafletViewportHandler);
    });
  }

  private loadAllData() {
    merge(
      this.api.getMapEstablishments(MAP_ESTABLISHMENT_TYPES).pipe(
        map(res => res.data || []),
        timeout(7000),
        catchError(() => of([] as Establishment[])),
        map(items => items.map(item => this.establishmentToLocation(item, this.mapCategoryForEstablishment(item.type))))
      ),
      this.api.getEvents().pipe(
        map(res => (res.data?.content || []).map(item => this.eventToLocation(item))),
        timeout(7000),
        catchError(() => of([] as MapLocation[]))
      ),
      this.api.getTours().pipe(
        map(res => (res.data?.content || []).map(item => this.tourToLocation(item))),
        timeout(7000),
        catchError(() => of([] as MapLocation[]))
      ),
      this.api.getTouristPoints().pipe(
        map(res => (res.data?.content || []).map(item => this.pointToLocation(item))),
        timeout(7000),
        catchError(() => of([] as MapLocation[]))
      )
    ).subscribe(group => {
      this.allData = this.dedupeLocations([...this.allData, ...group])
        .filter(location => this.isLocationInsideNoronha(location));
      this.updateMarkers();
      this.applyInitialSelection(this.pendingInitialParams);
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
          fields: ['id', 'displayName', 'formattedAddress', 'location', 'rating', 'googleMapsURI', 'businessStatus'],
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
        fields: ['id', 'displayName', 'formattedAddress', 'location', 'rating', 'googleMapsURI', 'businessStatus'],
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
      ? 'Visao geral da ilha'
      : view.zoom < 17
        ? 'Lugares separados por area'
        : 'Nomes e estruturas locais';

    const zoom = Math.max(0, Math.min(20, Math.floor(view.zoom)));
    const features = this.clusterIndex.getClusters(view.bounds, zoom);
    const showLabels = view.zoom >= 17;

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
        this.renderPlaceMarker(location, lat, lng, showLabels);
      }
    });

    this.cdr.markForCheck();
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
        icon: this.createLeafletIcon(location.mapSearchType, location.name, showLabel, selected, labelOnLeft)
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

    if (!query) {
      return data;
    }

    return data.filter(item => {
      const haystack = this.normalizeSearch([item.name, item.description, item.location, item.category]
        .filter(Boolean)
        .join(' '));
      return haystack.includes(query);
    });
  }

  private getDataForCategory(category: MapCategoryId): MapLocation[] {
    return this.locationsByCategory.get(category) || [];
  }

  private clearMarkers() {
    this.markersLayer.clearLayers();
    this.googleMarkers.forEach(marker => marker.setMap(null));
    this.googleMarkers = [];
  }

  private clearRoute() {
    this.routeLayer.clearLayers();
    if (this.googleRoutePolyline) {
      this.googleRoutePolyline.setMap(null);
      this.googleRoutePolyline = undefined;
    }
    if (this.directionsRenderer) {
      this.directionsRenderer.set('directions', null);
    }
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

  private updateUserLocation(position: GeolocationPosition, focus: boolean) {
    const { latitude, longitude, accuracy } = position.coords;
    if (!this.isInsideBounds(latitude, longitude, NORONHA_USER_BOUNDS)) {
      this.userLocation = undefined;
      this.locationState = 'denied';
      this.locationMessage = 'Sua posicao atual esta fora de Noronha; rotas serao abertas no Google Maps.';
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

  private calculateGoogleRoute() {
    if (!this.selectedLocation || !this.userLocation || !this.google) {
      return;
    }

    this.directionsService.route({
      origin: { lat: this.userLocation.lat, lng: this.userLocation.lng },
      destination: { lat: Number(this.selectedLocation.latitude), lng: Number(this.selectedLocation.longitude) },
      travelMode: this.google.maps.TravelMode.DRIVING
    }).then((response: any) => {
      this.directionsRenderer.setDirections(response);
      const leg = response.routes?.[0]?.legs?.[0];
      this.routeSummary = {
        distanceMeters: leg?.distance?.value || 0,
        durationSeconds: leg?.duration?.value || 0,
        difficulty: 'EASY',
        estimatedCalories: 0,
        optimizedWaypoints: [],
        polyline: ''
      };
      this.cdr.markForCheck();
    }).catch(() => this.calculateLocalRoute());
  }

  private calculateLocalRoute() {
    if (!this.selectedLocation) {
      return;
    }

    this.locationMessage = 'Rota real disponivel pelo Google Maps.';
    this.openDirectionsInGoogleMaps(this.selectedLocation);
    this.cdr.markForCheck();
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
      averagePrice: item.averagePrice,
      openingHours: item.openingHours,
      contactNumber: item.contactNumber,
      websiteUrl: item.websiteUrl,
      googleMapsUrl: item.googleMapsUrl
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
      averagePrice: item.price
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
      longitude: this.toNumber(item.longitude)
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
    return {
      id: `GOOGLE-${category}-${sourceId}`,
      sourceId,
      source: 'GOOGLE_PLACES',
      mapSearchType: category,
      name,
      description: 'Resultado complementar do Google Places.',
      category: this.labelForCategory(category),
      location: place.formattedAddress,
      latitude: Number(lat),
      longitude: Number(lng),
      rating: typeof place.rating === 'number' ? place.rating : null,
      googleMapsUrl: place.googleMapsURI ? String(place.googleMapsURI) : undefined
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
    type: MapCategoryId,
    name: string,
    showLabel: boolean,
    selected: boolean,
    labelOnLeft: boolean
  ) {
    const label = showLabel
      ? `<span class="marker-label">${this.escapeHtml(this.compactLabel(name))}</span>`
      : '';
    return L.divIcon({
      html: `<div class="map-marker-shell${showLabel ? ' has-label' : ''}${selected ? ' is-selected' : ''}${labelOnLeft ? ' label-left' : ''}"><div class="marker-pin pin-${type.toLowerCase()}"><i class="${this.iconForCategory(type)}"></i></div>${label}</div>`,
      className: 'custom-div-icon',
      iconSize: [36, 36],
      iconAnchor: [18, 32]
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
      const key = `${location.mapSearchType}:${this.slug(location.name)}`;
      const existing = seen.get(key);

      if (!existing || this.sourcePriority(location.source) > this.sourcePriority(existing.source)) {
        seen.set(key, location);
      }
    });

    return [...seen.values()];
  }

  private sourcePriority(source: MapSource): number {
    if (source === 'SISTUR') return 3;
    if (source === 'CURATED') return 2;
    return 1;
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

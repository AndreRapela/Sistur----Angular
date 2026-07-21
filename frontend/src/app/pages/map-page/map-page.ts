import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import * as L from 'leaflet';
import { ApiService } from '../../services/api.service';
import { AnalyticsService } from '../../services/analytics.service';
import { GoogleMapsLoaderService } from '../../services/google-maps-loader.service';
import { ItineraryService } from '../../services/itinerary.service';
import {
  Establishment,
  EstablishmentType,
  Event,
  LocationDTO,
  RouteResponseDTO,
  Tour,
  TouristPoint
} from '../../models/tourism.models';

type MapProvider = 'GOOGLE' | 'LEAFLET';
type MapCategoryId = 'ALL' | 'RESTAURANT' | 'HOTEL' | 'EVENT' | 'TOUR' | 'BEACH' | 'POINT' | 'CONVENIENCE';
type MapSource = 'SISTUR' | 'GOOGLE_PLACES';
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

  Math = Math;
  activeCategory: MapCategoryId = 'ALL';
  selectedLocation: MapLocation | null = null;
  routeSummary: RouteResponseDTO | null = null;
  searchTerm = '';
  mapProvider: MapProvider = 'LEAFLET';
  mapStatus = 'Carregando mapa...';
  googlePlacesLoading = false;
  locationState: LocationState = 'idle';
  locationMessage = 'Use sua posição para calcular rotas reais.';
  userLocation?: LocationDTO;

  categories: MapCategory[] = [
    { id: 'ALL', label: 'Tudo', icon: 'pi pi-map' },
    { id: 'RESTAURANT', label: 'Restaurantes', icon: 'pi pi-utensils', googleQueries: ['restaurantes em Fernando de Noronha'] },
    { id: 'TOUR', label: 'Passeios', icon: 'pi pi-camera', googleQueries: ['passeios turísticos em Fernando de Noronha', 'agências de turismo em Fernando de Noronha'] },
    { id: 'BEACH', label: 'Praias', icon: 'pi pi-sun', googleQueries: ['praias em Fernando de Noronha', 'baías em Fernando de Noronha'] },
    { id: 'POINT', label: 'Turísticos', icon: 'pi pi-compass', googleQueries: ['pontos turísticos em Fernando de Noronha', 'atrações em Fernando de Noronha'] },
    { id: 'HOTEL', label: 'Hospedagem', icon: 'pi pi-home', googleQueries: ['hotéis e pousadas em Fernando de Noronha'] },
    { id: 'CONVENIENCE', label: 'Conveniências', icon: 'pi pi-shopping-bag', googleQueries: ['postos de combustível em Fernando de Noronha', 'mercados em Fernando de Noronha', 'farmácias em Fernando de Noronha', 'conveniências em Fernando de Noronha', 'feiras em Fernando de Noronha'] },
    { id: 'EVENT', label: 'Eventos', icon: 'pi pi-calendar' }
  ];

  allData: MapLocation[] = [];
  filteredData: MapLocation[] = [];

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

    if (this.watchId !== undefined && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
    }

    if (this.leafletMap) {
      this.leafletMap.remove();
    }
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
    this.searchTerm = input.value.toLowerCase();
    this.updateMarkers();
    this.queueGoogleTextSearch();
    this.cdr.markForCheck();
  }

  selectLocation(location: MapLocation) {
    this.selectedLocation = location;
    this.routeSummary = null;
    this.clearRoute();
    this.focusLocation(location, 16);
    this.cdr.markForCheck();
  }

  closeLocation() {
    this.selectedLocation = null;
    this.routeSummary = null;
    this.clearRoute();
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
    window.open(url, '_blank', 'noopener');
  }

  openCategoryInGoogle() {
    const query = this.googleCategoryQuery(this.activeCategory);
    this.analytics.googleCategoryClick(this.activeCategory, this.activeCategoryName(), `/map?category=${this.activeCategory}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank', 'noopener');
  }

  openDetails(location: MapLocation | null = this.selectedLocation) {
    if (!location) {
      return;
    }

    if (location.source === 'GOOGLE_PLACES') {
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
    return this.getDataForCategory(category).length;
  }

  sourceLabel(location: MapLocation): string {
    return location.source === 'GOOGLE_PLACES' ? 'Google Places' : 'SisTur';
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
      this.mapProvider = 'GOOGLE';
      this.mapStatus = 'Google Maps ativo';
    } catch {
      this.setupLeafletMap();
      this.mapProvider = 'LEAFLET';
      this.mapStatus = this.googleLoader.isConfigured()
        ? 'Mapa local ativo; Google Maps não carregou.'
        : 'Mapa local ativo; configure googleMapsApiKey para usar Google Maps/Places.';
    }

    this.updateMarkers();
    this.applyInitialSelection(this.pendingInitialParams);
    this.requestUserLocation(false);
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
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: true,
      clickableIcons: true,
      gestureHandling: 'greedy',
      zoomControl: true,
      restriction: {
        latLngBounds: NORONHA_BOUNDS,
        strictBounds: false
      }
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
      maxBounds: NORONHA_LEAFLET_BOUNDS,
      maxBoundsViscosity: 0.8
    }).setView([NORONHA_CENTER.lat, NORONHA_CENTER.lng], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(this.leafletMap);

    L.control.zoom({ position: 'bottomright' }).addTo(this.leafletMap);
    this.markersLayer.addTo(this.leafletMap);
    this.routeLayer.addTo(this.leafletMap);
  }

  private loadAllData() {
    forkJoin({
      establishments: this.api.getMapEstablishments(MAP_ESTABLISHMENT_TYPES).pipe(
        map(res => res.data || []),
        catchError(() => this.loadEstablishmentTypes(MAP_ESTABLISHMENT_TYPES))
      ),
      events: this.api.getEvents().pipe(map(res => res.data?.content || []), catchError(() => of([] as Event[]))),
      tours: this.api.getTours().pipe(map(res => res.data?.content || []), catchError(() => of([] as Tour[]))),
      points: this.api.getTouristPoints().pipe(map(res => res.data?.content || []), catchError(() => of([] as TouristPoint[])))
    }).subscribe(({ establishments, events, tours, points }) => {
      this.allData = this.dedupeLocations([
        ...establishments.map(item => this.establishmentToLocation(item, this.mapCategoryForEstablishment(item.type))),
        ...events.map(item => this.eventToLocation(item)),
        ...tours.map(item => this.tourToLocation(item)),
        ...points.map(item => this.pointToLocation(item))
      ]).filter(location => this.isLocationInsideNoronha(location));
      this.updateMarkers();
      this.applyInitialSelection(this.pendingInitialParams);
      this.cdr.markForCheck();
    });
  }

  private loadEstablishmentTypes(types: EstablishmentType[]) {
    return forkJoin(
      types.map(type =>
        this.api.getEstablishments(type).pipe(
          map(res => res.data?.content || []),
          catchError(() => of([] as Establishment[]))
        )
      )
    ).pipe(map(groups => groups.flat()));
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
    this.clearMarkers();
    const visible = this.getVisibleData();
    this.filteredData = visible;

    visible.forEach(location => {
      if (!this.hasCoordinates(location)) {
        return;
      }

      if (this.googleMap && this.google) {
        const marker = new this.google.maps.Marker({
          position: { lat: Number(location.latitude), lng: Number(location.longitude) },
          map: this.googleMap,
          title: location.name,
          icon: this.googleMarkerIcon(location.mapSearchType)
        });
        marker.addListener('click', () => this.selectLocation(location));
        this.googleMarkers.push(marker);
        return;
      }

      if (this.leafletMap) {
        const marker = L.marker([Number(location.latitude), Number(location.longitude)], {
          icon: this.createLeafletIcon(location.mapSearchType)
        }).on('click', () => this.selectLocation(location));
        this.markersLayer.addLayer(marker);
      }
    });
  }

  private getVisibleData(): MapLocation[] {
    const data = this.getDataForCategory(this.activeCategory);
    const query = this.searchTerm.trim();

    if (!query) {
      return data;
    }

    return data.filter(item => {
      const haystack = [item.name, item.description, item.location, item.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }

  private getDataForCategory(category: MapCategoryId): MapLocation[] {
    const googleData = category === 'ALL'
      ? [...this.googlePlacesCache.values()].flat()
      : (this.googlePlacesCache.get(category) || []);
    const searchData = category === 'ALL'
      ? this.googleTextSearchLocations
      : this.googleTextSearchLocations.filter(item => item.mapSearchType === category);

    const localData = category === 'ALL'
      ? this.allData
      : this.allData.filter(item => item.mapSearchType === category);

    return this.dedupeLocations([...localData, ...googleData, ...searchData]);
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
      websiteUrl: item.websiteUrl
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
    window.open(this.googleDirectionsUrl(location), '_blank', 'noopener');
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

  private googleMarkerIcon(category: MapCategoryId) {
    const color = this.colorForCategory(category);
    return {
      path: this.google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3
    };
  }

  private createLeafletIcon(type: MapCategoryId) {
    return L.divIcon({
      html: `<div class="marker-pin pin-${type.toLowerCase()}"><i class="${this.iconForCategory(type)}"></i></div>`,
      className: 'custom-div-icon',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
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

      if (!existing || existing.source === 'GOOGLE_PLACES') {
        seen.set(key, location);
      }
    });

    return [...seen.values()];
  }

  private slug(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
  }
}

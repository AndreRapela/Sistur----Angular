import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Establishment, Event, Tour, TouristPoint, LocationDTO, RouteResponseDTO } from '../../models/tourism.models';
import * as L from 'leaflet';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-map-page',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './map-page.html',
  styleUrls: ['./map-page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private map!: L.Map;
  private markersLayer = L.layerGroup();
  private routeLayer = L.layerGroup();
  private userLocationMarker?: L.CircleMarker;

  private cdr: ChangeDetectorRef;

  Math = Math;
  activeCategory = 'ALL';
  selectedLocation: any = null;
  routeSummary: RouteResponseDTO | null = null;
  searchTerm = '';

  categories = [
    { id: 'ALL', label: 'Tudo', icon: 'pi pi-map' },
    { id: 'RESTAURANT', label: 'Comer', icon: 'pi pi-utensils' },
    { id: 'HOTEL', label: 'Ficar', icon: 'pi pi-home' },
    { id: 'EVENT', label: 'Eventos', icon: 'pi pi-calendar' },
    { id: 'TOUR', label: 'Passeios', icon: 'pi pi-camera' },
    { id: 'POINT', label: 'Pontos', icon: 'pi pi-compass' }
  ];

  allData: any[] = [];
  filteredData: any[] = [];

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    cdr: ChangeDetectorRef
  ) {
    this.cdr = cdr;
  }

  ngOnInit() {
    this.loadAllData(this.route.snapshot.queryParams);
  }

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnDestroy() {
    if (this.map) this.map.remove();
  }

  private initMap() {
    // Center at Fernando de Noronha
    this.map = L.map('map', { zoomControl: false }).setView([-3.8415, -32.4116], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    this.markersLayer.addTo(this.map);
    this.routeLayer.addTo(this.map);

    this.trackUserLocation();
  }

  closeLocation() {
    this.selectedLocation = null;
    this.routeSummary = null;
    this.routeLayer.clearLayers();
    this.cdr.markForCheck();
  }

  private trackUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        if (this.userLocationMarker) {
          this.userLocationMarker.setLatLng([latitude, longitude]);
        } else {
          this.userLocationMarker = L.circleMarker([latitude, longitude], {
            radius: 8,
            fillColor: '#3b82f6',
            color: '#fff',
            weight: 2,
            fillOpacity: 1
          }).addTo(this.map);
        }
      }, err => console.warn('Geolocation error:', err), { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 });
    }
  }

  private loadAllData(initialParams: Params) {
    forkJoin({
      restaurants: this.api.getEstablishments('RESTAURANT').pipe(map(res => res.data?.content || [])),
      hotels: this.api.getEstablishments('HOTEL').pipe(map(res => res.data?.content || [])),
      events: this.api.getEvents().pipe(map(res => res.data?.content || [])),
      tours: this.api.getTours().pipe(map(res => res.data?.content || [])),
      points: this.api.getTouristPoints().pipe(map(res => res.data?.content || []))
    }).subscribe(({ restaurants, hotels, events, tours, points }) => {
      this.allData = [
        ...restaurants.map(item => ({ ...item, mapSearchType: 'RESTAURANT' })),
        ...hotels.map(item => ({ ...item, mapSearchType: 'HOTEL' })),
        ...events.map(item => ({ ...item, mapSearchType: 'EVENT' })),
        ...tours.map(item => ({ ...item, mapSearchType: 'TOUR' })),
        ...points.map((item: TouristPoint) => ({ ...item, mapSearchType: 'POINT' }))
      ];
      this.filteredData = this.allData;
      this.updateMarkers();
      this.applyInitialSelection(initialParams);
      this.cdr.markForCheck();
    });
  }

  private applyInitialSelection(params: Params) {
    if (!params['id'] || !params['type']) {
      return;
    }

    const found = this.allData.find(item => item.id == params['id'] && item.mapSearchType == params['type']);
    if (found) {
      this.selectedLocation = found;
      this.map.flyTo([found.latitude, found.longitude], 16);
      this.cdr.markForCheck();
    }
  }

  filterByCategory(type: string) {
    this.activeCategory = type;
    this.updateMarkers();
    this.cdr.markForCheck();
  }

  onSearch(event: any) {
    this.searchTerm = event.target.value.toLowerCase();
    this.updateMarkers();
    this.cdr.markForCheck();
  }

  private getVisibleData() {
    const categoryData = this.activeCategory === 'ALL'
      ? this.allData
      : this.allData.filter(item => item.mapSearchType === this.activeCategory);

    const query = this.searchTerm.trim();
    if (!query) {
      return categoryData;
    }

    return categoryData.filter(item =>
      (item.name || item.title || '').toLowerCase().includes(query)
    );
  }

  private updateMarkers() {
    this.markersLayer.clearLayers();

    const dataToUse = this.getVisibleData();
    this.filteredData = dataToUse;

    dataToUse.forEach(item => {
      if (item.latitude && item.longitude) {
        const marker = L.marker([item.latitude, item.longitude], {
          icon: this.createCustomIcon(item.mapSearchType)
        }).on('click', () => {
          this.closeLocation();
          this.selectedLocation = item;
          this.map.panTo([item.latitude, item.longitude]);
        });
        this.markersLayer.addLayer(marker);
      }
    });

    this.cdr.markForCheck();
  }

  private createCustomIcon(type: string) {
    const icons: any = {
      RESTAURANT: 'pi-utensils',
      HOTEL: 'pi-home',
      EVENT: 'pi-calendar',
      TOUR: 'pi-camera',
      POINT: 'pi-compass'
    };

    return L.divIcon({
      html: `<div class="marker-pin pin-${type.toLowerCase()}"><i class="pi ${icons[type]}"></i></div>`,
      className: 'custom-div-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  }

  getDirections() {
    if (!this.selectedLocation) return;
    this.routeLayer.clearLayers();

    if (this.userLocationMarker) {
      const userLatLng = this.userLocationMarker.getLatLng();
      const request = {
        waypoints: [
          { lat: userLatLng.lat, lng: userLatLng.lng, name: 'Sua localização' },
          { lat: Number(this.selectedLocation.latitude), lng: Number(this.selectedLocation.longitude), name: this.selectedLocation.name || this.selectedLocation.title || 'Destino' }
        ] as LocationDTO[],
        travelMode: 'DRIVING'
      };

      this.api.calculateRoute(request).subscribe({
        next: (res) => {
          this.routeSummary = res.data;

          const routePoints = this.routeSummary?.optimizedWaypoints?.length
            ? this.routeSummary.optimizedWaypoints
            : request.waypoints;

          const poly = L.polyline(
            routePoints.map(point => [point.lat, point.lng]),
            { color: '#3b82f6', weight: 6, opacity: 0.8 }
          ).addTo(this.routeLayer);

          this.map.fitBounds(poly.getBounds(), { padding: [50, 50] });
          this.cdr.markForCheck();
        },
        error: (err) => console.error('Erro ao calcular rota', err)
      });

    } else {
      alert('Localização do usuário não detectada. Por favor, ative o GPS.');
    }
  }
}

import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Establishment, Event, Tour } from '../../models/tourism.models';
import * as L from 'leaflet';
import 'leaflet-routing-machine';

@Component({
  selector: 'app-map-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-container-wrapper">
      <div id="map" class="full-screen-map"></div>
      
      <div class="map-overlay-top">
        <div class="search-bar shadow-lg">
          <i class="pi pi-search text-primary"></i>
          <input type="text" placeholder="Para onde você quer ir?" (input)="onSearch($event)">
        </div>
        
        <div class="category-filters-scroll mt-3 scroll-hide">
          @for (cat of categories; track cat.id) {
            <button [class.active]="activeCategory === cat.id"
                    (click)="filterByCategory(cat.id)"
                    class="filter-chip shadow-md">
              <i [class]="cat.icon" [style.color]="activeCategory === cat.id ? 'white' : 'var(--primary)'"></i> 
              {{cat.label}}
            </button>
          }
        </div>
      </div>

      @if (selectedLocation) {
        <div class="map-overlay-bottom">
          <div class="location-detail-card p-4 bounce-in border-0 shadow-2xl">
            <div class="d-flex gap-4">
              <div class="detail-img-wrapper shadow-sm">
                <img [src]="selectedLocation.photoUrl" class="detail-img" alt="">
              </div>
              <div class="flex-grow-1">
                <h3 class="location-name">{{selectedLocation.name || selectedLocation.title}}</h3>
                <p class="text-muted small m-0 d-flex align-items-center gap-1">
                  <i class="pi pi-map-marker text-primary"></i> {{selectedLocation.location}}
                </p>
                <div class="mt-4 d-flex gap-2">
                  <button class="btn-primary-gradient flex-grow-1" (click)="getDirections()">
                    <i class="pi pi-directions mr-2"></i> Como chegar
                  </button>
                  <button class="btn-icon-light" (click)="selectedLocation = null">
                    <i class="pi pi-times"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .map-container-wrapper { position: relative; width: 100%; height: calc(100vh - 65px); }
    .full-screen-map { width: 100%; height: 100%; z-index: 1; }
    
    .map-overlay-top { 
      position: absolute; top: 20px; left: 20px; right: 20px; 
      z-index: 990; pointer-events: none; 
    }
    .search-bar, .category-filters-scroll { pointer-events: auto; }
    
    .search-bar {
      background: rgba(255,255,255,0.95); backdrop-filter: blur(10px);
      border-radius: 20px; padding: 15px 25px;
      display: flex; align-items: center; gap: 12px;
      border: 1px solid rgba(255,255,255,0.3);
    }
    .search-bar input { border: none; outline: none; width: 100%; font-size: 16px; background: transparent; font-weight: 500; }
    
    .category-filters-scroll {
      display: flex; gap: 10px; overflow-x: auto; padding: 5px 0;
      scrollbar-width: none;
    }
    .scroll-hide::-webkit-scrollbar { display: none; }
    
    .filter-chip {
      white-space: nowrap; background: white; border-radius: 14px;
      padding: 10px 18px; border: 1px solid #e2e8f0;
      font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 8px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .filter-chip.active { background: var(--primary); color: white; border-color: var(--primary); transform: translateY(-2px); }
    
    .map-overlay-bottom {
      position: absolute; bottom: 30px; left: 20px; right: 20px;
      z-index: 1000;
    }
    .location-detail-card {
      background: white; border-radius: 24px;
    }
    .detail-img-wrapper { border-radius: 16px; overflow: hidden; width: 90px; height: 90px; }
    .detail-img { width: 100%; height: 100%; object-fit: cover; }
    .location-name { font-weight: 900; font-size: 20px; color: var(--text-main); line-height: 1.2; margin-bottom: 5px; }
    
    .btn-primary-gradient { 
        background: var(--primary); color: white; border: none; border-radius: 14px; 
        padding: 0 20px; height: 48px; font-weight: 700; display: flex; align-items: center; justify-content: center;
    }
    .btn-icon-light { 
        width: 48px; height: 48px; border-radius: 14px; background: #f8fafc; border: 1px solid #e2e8f0; 
        color: #64748b; display: flex; align-items: center; justify-content: center; 
    }

    .bounce-in { animation: bounceIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2); }
    
    @keyframes bounceIn {
      0% { transform: translateY(20px) scale(0.95); opacity: 0; }
      100% { transform: translateY(0) scale(1); opacity: 1; }
    }
  `]
})
export class MapPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private map!: L.Map;
  private markersLayer = L.layerGroup();
  private routingControl: any;
  private userLocationMarker?: L.CircleMarker;
  
  activeCategory = 'ALL';
  selectedLocation: any = null;
  
  categories = [
    { id: 'ALL', label: 'Tudo', icon: 'pi pi-map' },
    { id: 'RESTAURANT', label: 'Comer', icon: 'pi pi-utensils' },
    { id: 'HOTEL', label: 'Ficar', icon: 'pi pi-home' },
    { id: 'EVENT', label: 'Eventos', icon: 'pi pi-calendar' },
    { id: 'TOUR', label: 'Passeios', icon: 'pi pi-camera' }
  ];

  allData: any[] = [];
  filteredData: any[] = [];

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadAllData();
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

    this.trackUserLocation();
  }

  private trackUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition((pos) => {
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
      }, err => console.warn('Geolocation error:', err), { enableHighAccuracy: true });
    }
  }

  private loadAllData() {
    // For simplicity, we fetch everything. In a real app we'd paginate or filter on backend.
    this.api.getEstablishments('RESTAURANT').subscribe(res => this.mergeData(res.data.content, 'RESTAURANT'));
    this.api.getEstablishments('HOTEL').subscribe(res => this.mergeData(res.data.content, 'HOTEL'));
    this.api.getEvents().subscribe(res => this.mergeData(res.data.content, 'EVENT'));
    this.api.getTours().subscribe(res => this.mergeData(res.data.content, 'TOUR'));
  }

  private mergeData(items: any[], type: string) {
    const typedItems = items.map(i => ({ ...i, mapSearchType: type }));
    this.allData = [...this.allData, ...typedItems];
    this.updateMarkers();
    this.checkInitialLocation();
  }

  private checkInitialLocation() {
    this.route.queryParams.subscribe(params => {
      if (params['id'] && params['type']) {
        const found = this.allData.find(i => i.id == params['id'] && i.mapSearchType == params['type']);
        if (found) {
          this.selectedLocation = found;
          this.map.flyTo([found.latitude, found.longitude], 16);
        }
      }
    });
  }

  filterByCategory(type: string) {
    this.activeCategory = type;
    this.updateMarkers();
  }

  onSearch(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredData = this.allData.filter(i => 
      (i.name || i.title).toLowerCase().includes(query)
    );
    this.updateMarkers(true);
  }

  private updateMarkers(isSearch = false) {
    this.markersLayer.clearLayers();
    
    const dataToUse = isSearch ? this.filteredData : 
      (this.activeCategory === 'ALL' ? this.allData : this.allData.filter(i => i.mapSearchType === this.activeCategory));

    dataToUse.forEach(item => {
      if (item.latitude && item.longitude) {
        const marker = L.marker([item.latitude, item.longitude], {
          icon: this.createCustomIcon(item.mapSearchType)
        }).on('click', () => {
          this.selectedLocation = item;
          this.map.panTo([item.latitude, item.longitude]);
        });
        this.markersLayer.addLayer(marker);
      }
    });
  }

  private createCustomIcon(type: string) {
    const icons: any = {
      RESTAURANT: 'pi-utensils',
      HOTEL: 'pi-home',
      EVENT: 'pi-calendar',
      TOUR: 'pi-camera'
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

    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
    }

    if (this.userLocationMarker) {
      const userLatLng = this.userLocationMarker.getLatLng();
      
      // @ts-ignore
      this.routingControl = L.Routing.control({
        waypoints: [
          L.latLng(userLatLng.lat, userLatLng.lng),
          L.latLng(this.selectedLocation.latitude, this.selectedLocation.longitude)
        ],
        lineOptions: {
          styles: [{ color: '#3b82f6', weight: 6, opacity: 0.8 }],
          extendToWaypoints: true,
          missingRouteTolerance: 10
        },
        // @ts-ignore
        router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
        show: false, // Hide instruction panel
        addWaypoints: false,
        draggableWaypoints: false
      }).addTo(this.map);
    } else {
      alert('Localização do usuário não detectada. Por favor, ative o GPS.');
    }
  }
}

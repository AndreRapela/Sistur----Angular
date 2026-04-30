import { Component, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: []
})
export class MapComponent implements OnChanges, AfterViewInit {
  @Input() lat!: number | string;
  @Input() lng!: number | string;
  @Input() destinationName = 'Destino';

  @ViewChild('mapContainer') mapContainer!: ElementRef;
  private map: any;

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.map && (changes['lat'] || changes['lng'])) {
      this.updateRoute();
    }
  }

  private async initMap() {
    if (!this.lat || !this.lng) return;

    // Dinamic import of Leaflet to reduce initial bundle size (Professional optimization)
    const L = await import('leaflet');
    await import('leaflet-routing-machine');

    const destLat = Number(this.lat);
    const destLng = Number(this.lng);

    this.map = L.map(this.mapContainer.nativeElement).setView([destLat, destLng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.updateRoute(L);
  }

  private async updateRoute(L_lib?: any) {
    if (!this.map || !this.lat || !this.lng) return;

    const L = L_lib || await import('leaflet');
    if (!L_lib) await import('leaflet-routing-machine');

    const destLat = Number(this.lat);
    const destLng = Number(this.lng);

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;

          // Clear previous layers/routes if any
          this.map.eachLayer((layer: any) => {
              if (layer && (layer.options?.waypoints || layer._routing)) {
                  this.map.removeLayer(layer);
              }
          });

          // Add Routing with improved UX
          const control = (L as any).Routing.control({
            waypoints: [
              L.latLng(userLat, userLng),
              L.latLng(destLat, destLng)
            ],
            routeWhileDragging: false, // Performance improvement
            show: false,
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            language: 'pt-BR',
            lineOptions: {
              styles: [{ color: '#2563eb', weight: 6, opacity: 0.8 }] // Custom premium line
            },
            createMarker: (i: number, waypoint: any, n: number) => {
                const markerOptions = {
                    draggable: false,
                    icon: L.icon({
                        iconUrl: i === 0 ? 'assets/icons/user-marker.svg' : 'assets/icons/dest-marker.svg',
                        shadowUrl: 'assets/icons/marker-shadow.png',
                        iconSize: [40, 40],
                        iconAnchor: [20, 40],
                        popupAnchor: [0, -40]
                    })
                };
                const marker = L.marker(waypoint.latLng, markerOptions as any);
                if (i === n - 1) {
                  marker.bindPopup(`<div class="font-bold text-slate-800">${this.destinationName}</div>`).openPopup();
                }
                return marker;
            }
          }).addTo(this.map);

          // Add performance listener
          control.on('routesfound', (e: any) => {
            const routes = e.routes;
            const summary = routes[0].summary;
            console.log(`Distância: ${(summary.totalDistance / 1000).toFixed(1)} km, Tempo: ${Math.round(summary.totalTime / 60)} min`);
          });
        },
        () => {
          // Fallback if geolocation fails: just show marker at destination
          if (L) {
            L.marker([destLat, destLng])
              .addTo(this.map)
              .bindPopup(this.destinationName)
              .openPopup();
          }
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 } // Geolocation best practices
      );
    } else {
      // No geolocation support
      if (L) {
        L.marker([destLat, destLng])
          .addTo(this.map)
          .bindPopup(this.destinationName)
          .openPopup();
      }
    }
  }
}

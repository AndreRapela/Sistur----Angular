import { Component, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import 'leaflet-routing-machine';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  template: `<div #mapContainer class="map-container shadow-premium border-round-2xl overflow-hidden" style="height: 350px; width: 100%;"></div>`,
  styles: [`
    .map-container {
      border: 1px solid rgba(0,0,0,0.05);
      z-index: 1;
    }
  `]
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

  private initMap() {
    if (!this.lat || !this.lng) return;

    const destLat = Number(this.lat);
    const destLng = Number(this.lng);

    this.map = L.map(this.mapContainer.nativeElement).setView([destLat, destLng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.updateRoute();
  }

  private updateRoute() {
    if (!this.map || !this.lat || !this.lng) return;

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

          // Add Routing
          (L as any).Routing.control({
            waypoints: [
              L.latLng(userLat, userLng),
              L.latLng(destLat, destLng)
            ],
            routeWhileDragging: true,
            show: false, // Don't show the text instructions by default
            language: 'pt-BR',
            createMarker: (i: number, waypoint: any, n: number) => {
                const markerOptions = {
                    draggable: true,
                    icon: L.icon({
                        iconUrl: i === 0 ? 'assets/user-marker.png' : 'assets/dest-marker.png',
                        shadowUrl: 'assets/marker-shadow.png',
                        iconSize: [32, 32],
                        iconAnchor: [16, 32]
                    })
                };
                return L.marker(waypoint.latLng, markerOptions as any);
            }
          }).addTo(this.map);
        },
        () => {
          // Fallback if geolocation fails: just show marker at destination
          L.marker([destLat, destLng]).addTo(this.map)
            .bindPopup(this.destinationName)
            .openPopup();
        }
      );
    } else {
        L.marker([destLat, destLng]).addTo(this.map)
            .bindPopup(this.destinationName)
            .openPopup();
    }
  }
}

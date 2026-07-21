import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
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

  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private map: any;
  private marker: any;

  ngAfterViewInit() {
    void this.initMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.map && (changes['lat'] || changes['lng'])) {
      void this.updateMarker();
    }
  }

  private async initMap() {
    if (!this.lat || !this.lng) {
      return;
    }

    const L = await import('leaflet');
    const destLat = Number(this.lat);
    const destLng = Number(this.lng);

    this.map = L.map(this.mapContainer.nativeElement, {
      zoomControl: false,
      minZoom: 12,
      maxBounds: [
        [-3.8900, -32.4700],
        [-3.8200, -32.3850]
      ],
      maxBoundsViscosity: 0.8
    }).setView([destLat, destLng], 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    await this.updateMarker(L);
  }

  private async updateMarker(L_lib?: any) {
    if (!this.map || !this.lat || !this.lng) {
      return;
    }

    const L = L_lib || await import('leaflet');
    const destLat = Number(this.lat);
    const destLng = Number(this.lng);

    if (!Number.isFinite(destLat) || !Number.isFinite(destLng)) {
      return;
    }

    if (this.marker) {
      this.map.removeLayer(this.marker);
    }

    this.marker = L.circleMarker([destLat, destLng], {
      radius: 10,
      color: '#ffffff',
      weight: 3,
      fillColor: '#0077b6',
      fillOpacity: 1
    })
      .addTo(this.map)
      .bindPopup(this.destinationName)
      .openPopup();

    this.map.setView([destLat, destLng], 15);
  }
}

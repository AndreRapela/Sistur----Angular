import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { ItineraryService } from '../../services/itinerary.service';
import { AnalyticsService } from '../../services/analytics.service';
import { TouristPoint } from '../../models/tourism.models';
import { touristPointDetails, TouristPointDetailMeta } from '../../data/tourist-point-details';

type TouristPointDetailViewModel = TouristPoint & TouristPointDetailMeta;

@Component({
  selector: 'app-tourist-point-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tourist-point-detail.html'
})
export class TouristPointDetailComponent implements OnInit {
  point = signal<TouristPointDetailViewModel | null>(null);
  loading = signal(true);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private analytics = inject(AnalyticsService);
  public itinerary = inject(ItineraryService);

  gallery = computed(() => {
    const point = this.point();
    if (!point) {
      return [];
    }

    const images = [point.photoUrl, ...(point.imageGallery || [])].filter(Boolean) as string[];
    return Array.from(new Set(images));
  });

  ngOnInit() {
    const id = Number(this.route.snapshot.params['id']);
    this.analytics.pageView(`/pontos-turisticos/${id}`, 'TOURIST_POINT', id);
    this.loadPoint(id);
  }

  loadPoint(id: number) {
    this.loading.set(true);
    this.api.getTouristPointById(id)
      .pipe(finalize(() => {
        this.loading.set(false);
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (res: any) => {
          const base = res.data;
          if (!base) {
            this.router.navigate(['/pontos-turisticos']);
            return;
          }

          const extra = touristPointDetails[id] || touristPointDetails[15];
          this.point.set({
            ...base,
            ...extra
          });
        },
        error: () => this.router.navigate(['/pontos-turisticos'])
      });
  }

  toggleItinerary() {
    const point = this.point();
    if (!point) {
      return;
    }

    const wasAdded = this.itinerary.isInItinerary(point.id, 'HIGHLIGHT');
    this.itinerary.toggleItem({
      id: point.id,
      type: 'HIGHLIGHT',
      name: point.name,
      image: point.photoUrl,
      location: point.location,
      category: point.category,
      bestTime: point.bestTime,
      bestSeason: point.bestSeason,
      idealWeather: point.idealWeather,
      latitude: point.latitude,
      longitude: point.longitude
    });

    this.analytics.conversion('TOURIST_POINT', wasAdded ? 'ITINERARY_REMOVE' : 'ITINERARY_ADD', point.id, `/pontos-turisticos/${point.id}`);
  }

  openMap() {
    const point = this.point();
    if (!point) {
      return;
    }

    this.analytics.conversion('TOURIST_POINT', 'MAP_CLICK', point.id, `/pontos-turisticos/${point.id}`);
    this.router.navigate(['/map'], { queryParams: { id: point.id, type: 'POINT' } });
  }
}

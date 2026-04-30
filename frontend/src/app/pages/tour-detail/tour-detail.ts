import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ItineraryService } from '../../services/itinerary.service';
import { MapComponent } from '../../components/map/map';
import { finalize } from 'rxjs';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-tour-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MapComponent],
  templateUrl: './tour-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TourDetailComponent implements OnInit {
  tour = signal<any>(null);
  loading = signal(true);
  
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private analytics = inject(AnalyticsService);
  public itineraryService = inject(ItineraryService);

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.analytics.pageView(`/tours/${id}`, 'TOUR', id);
    this.api.getTourById(Number(id))
      .pipe(finalize(() => {
        this.loading.set(false);
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (res: any) => {
          if (res.data) {
            this.tour.set(res.data);
          } else {
            this.router.navigate(['/tours']);
          }
        },
        error: () => this.router.navigate(['/tours'])
      });
  }

  toggleItinerary() {
    const tour = this.tour();
    if (!tour) return;

    const wasAdded = this.itineraryService.isInItinerary(tour.id, 'TOUR');
    this.itineraryService.toggleItem({
      id: tour.id,
      type: 'TOUR',
      name: tour.name,
      image: tour.photoUrl,
      location: 'Noronha'
    });
    this.analytics.conversion('TOUR', wasAdded ? 'ITINERARY_REMOVE' : 'ITINERARY_ADD', tour.id, `/tours/${tour.id}`);
  }

  openWhatsApp() {
    const t = this.tour();
    if (!t) return;
    const msg = encodeURIComponent(`Olá! Vi o passeio "${t.name}" no SisTur e gostaria de mais informações.`);
    this.analytics.conversion('TOUR', 'WHATSAPP_CLICK', t.id, `/tours/${t.id}`);
    window.open(`https://wa.me/${t.contactNumber}?text=${msg}`, '_blank');
  }

  openGoogleMaps() {
    const t = this.tour();
    if (!t) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${t.latitude},${t.longitude}`;
    this.analytics.conversion('TOUR', 'MAP_CLICK', t.id, `/tours/${t.id}`);
    window.open(url, '_blank');
  }
}

import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ItineraryService } from '../../services/itinerary.service';
import { MapComponent } from '../../components/map/map';
import { finalize } from 'rxjs';
import { AnalyticsService } from '../../services/analytics.service';
import { openExternalLink } from '../../utils/external-link';
import { Tour } from '../../models/tourism.models';
import {
  GooglePlaceDetails,
  GooglePlaceDetailsService
} from '../../services/google-place-details.service';

@Component({
  selector: 'app-tour-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MapComponent],
  templateUrl: './tour-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TourDetailComponent implements OnInit {
  tour = signal<Tour | null>(null);
  loading = signal(true);
  googleDetails = signal<GooglePlaceDetails | null>(null);
  readonly starPositions = [1, 2, 3, 4, 5];
  readonly itineraryStops = computed(() => this.splitItems(this.tour()?.itinerary));
  readonly includedItems = computed(() => this.splitItems(this.tour()?.includedItems));
  readonly excludedItems = computed(() => this.splitItems(this.tour()?.excludedItems));
  readonly requirements = computed(() => this.splitItems(this.tour()?.requirements));
  
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private analytics = inject(AnalyticsService);
  private googlePlaces = inject(GooglePlaceDetailsService);
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
            const tour = res.data as Tour;
            this.tour.set(tour);
            void this.loadGoogleDetails(tour);
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
    const contactNumber = (t.contactNumber || this.googleDetails()?.contactNumber || '').replace(/\D/g, '');
    if (!contactNumber) return;
    const msg = encodeURIComponent(`Olá! Vi o passeio "${t.name}" no SisTur e gostaria de mais informações.`);
    this.analytics.conversion('TOUR', 'WHATSAPP_CLICK', t.id, `/tours/${t.id}`);
    openExternalLink(`https://wa.me/${contactNumber}?text=${msg}`);
  }

  openGoogleMaps() {
    const t = this.tour();
    if (!t) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${t.latitude},${t.longitude}`;
    this.analytics.conversion('TOUR', 'MAP_CLICK', t.id, `/tours/${t.id}`);
    openExternalLink(url);
  }

  openGoogleService() {
    const t = this.tour();
    if (!t) return;
    const liveGoogleUrl = this.googleDetails()?.googleMapsUrl;
    if (liveGoogleUrl || t.googleMapsUrl) {
      this.analytics.googleServiceClick('TOUR', t.id, t.name, `/tours/${t.id}`);
      openExternalLink(liveGoogleUrl || t.googleMapsUrl!);
      return;
    }

    const query = encodeURIComponent(`${t.name} ${t.partnership || ''} Fernando de Noronha`);
    this.analytics.googleServiceClick('TOUR', t.id, t.name, `/tours/${t.id}`);
    openExternalLink(`https://www.google.com/maps/search/?api=1&query=${query}`);
  }

  openBooking() {
    const t = this.tour();
    if (!t?.bookingUrl) return;
    this.analytics.conversion('TOUR', 'BOOKING_CLICK', t.id, `/tours/${t.id}`);
    openExternalLink(t.bookingUrl);
  }

  openReviews() {
    const t = this.tour();
    if (!t) return;
    const url = this.googleDetails()?.reviewsUrl
      || this.googleDetails()?.googleMapsUrl
      || t.reviewUrl
      || t.googleMapsUrl;
    if (!url) return;
    this.analytics.conversion('TOUR', 'REVIEWS_CLICK', t.id, `/tours/${t.id}`);
    openExternalLink(url);
  }

  openSource() {
    const t = this.tour();
    if (!t?.sourceUrl) return;
    this.analytics.conversion('TOUR', 'SOURCE_CLICK', t.id, `/tours/${t.id}`);
    openExternalLink(t.sourceUrl);
  }

  heroPhoto(): string | null {
    return this.tour()?.photoUrl || this.googleDetails()?.photoUrl || null;
  }

  photoCredit(): string {
    return this.tour()?.photoCredit || this.googleDetails()?.photoAttribution?.name || 'Operadora';
  }

  displayRating(): number | null {
    return this.googleDetails()?.rating ?? this.tour()?.rating ?? null;
  }

  displayReviewCount(): number | null {
    return this.googleDetails()?.reviewCount ?? this.tour()?.reviewCount ?? null;
  }

  displayReviewSource(): string {
    return this.googleDetails() ? 'Google' : (this.tour()?.reviewSource || 'Avaliações');
  }

  hasReviews(): boolean {
    return this.displayRating() != null;
  }

  hasFixedMeetingPoint(): boolean {
    const t = this.tour();
    return Boolean(t?.latitude && t?.longitude && !t.meetingPoint?.toLowerCase().includes('transfer'));
  }

  starIcon(rating: number, position: number): string {
    if (rating >= position) return 'pi pi-star-fill';
    if (rating >= position - 0.5) return 'pi pi-star-half-fill';
    return 'pi pi-star';
  }

  formatReviewCount(count: number | null): string {
    if (count == null) return 'Ver avaliações';
    return `${new Intl.NumberFormat('pt-BR').format(count)} avaliações`;
  }

  private async loadGoogleDetails(tour: Tour): Promise<void> {
    const details = await this.googlePlaces.getDetails({
      name: tour.partnership || tour.name,
      googleQuery: `${tour.partnership || tour.name}, Fernando de Noronha`
    });
    if (details) {
      this.googleDetails.set(details);
    }
  }

  private splitItems(value?: string): string[] {
    return (value || '')
      .split('|')
      .map(item => item.trim())
      .filter(Boolean);
  }
}

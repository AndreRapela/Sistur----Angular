import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef, computed, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ItineraryService } from '../../services/itinerary.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-establishment-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './establishment-detail.html',
})
export class EstablishmentDetailComponent implements OnInit {
  est = signal<any>(null);
  loading = signal(true);
  
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  public authService = inject(AuthService);
  public itineraryService = inject(ItineraryService);
  private analytics = inject(AnalyticsService);

  reviews = signal<any[]>([]);
  isSubmitting = signal(false);
  newReview = { rating: 0, comment: '' };

  isPremium = computed(() => {
    const user = this.authService.currentUser();
    return user?.role === 'PREMIUM_TOURIST';
  });

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.analytics.pageView(`/establishments/${id}`, 'ESTABLISHMENT', id);
    this.loadEstablishment(id);
    this.loadReviews(id);
  }

  toggleItinerary() {
    const establishment = this.est();
    if (!establishment) return;

    const wasAdded = this.itineraryService.isInItinerary(establishment.id, establishment.type);
    this.itineraryService.toggleItem({
      id: establishment.id,
      type: establishment.type,
      name: establishment.name,
      image: establishment.photoUrl,
      location: establishment.location
    });
    this.analytics.conversion('ESTABLISHMENT', wasAdded ? 'ITINERARY_REMOVE' : 'ITINERARY_ADD', establishment.id, `/establishments/${establishment.id}`);
  }

  openWhatsApp() {
    const establishment = this.est();
    if (!establishment?.contactNumber) return;
    const msg = encodeURIComponent(`Olá! Vi o estabelecimento "${establishment.name}" no SisTur e gostaria de mais informações.`);
    this.analytics.conversion('ESTABLISHMENT', 'WHATSAPP_CLICK', establishment.id, `/establishments/${establishment.id}`);
    window.open(`https://wa.me/${establishment.contactNumber}?text=${msg}`, '_blank');
  }

  openGoogleMaps() {
    const establishment = this.est();
    if (!establishment) return;
    this.analytics.conversion('ESTABLISHMENT', 'MAP_CLICK', establishment.id, `/establishments/${establishment.id}`);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${establishment.latitude},${establishment.longitude}`, '_blank');
  }

  openWebsite() {
    const establishment = this.est();
    if (!establishment?.websiteUrl) return;
    this.analytics.conversion('ESTABLISHMENT', 'WEBSITE_CLICK', establishment.id, `/establishments/${establishment.id}`);
    window.open(establishment.websiteUrl, '_blank');
  }

  openInstagram() {
    const establishment = this.est();
    if (!establishment?.instagramUrl) return;
    this.analytics.conversion('ESTABLISHMENT', 'INSTAGRAM_CLICK', establishment.id, `/establishments/${establishment.id}`);
    window.open(establishment.instagramUrl, '_blank');
  }

  loadEstablishment(id: string) {
    this.loading.set(true);
    this.api.getEstablishmentById(Number(id))
      .pipe(finalize(() => {
        this.loading.set(false);
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (res: any) => {
          this.est.set(res.data);
        }
      });
  }

  loadReviews(id: string) {
    this.api.getEstablishmentReviews(Number(id)).subscribe({
      next: (res: any) => {
        this.reviews.set(res.data || []);
        this.cdr.markForCheck();
      }
    });
  }

  submitReview() {
    if (!this.newReview.rating) return;
    this.isSubmitting.set(true);
    const id = this.route.snapshot.params['id'];

    this.api.addEstablishmentReview(Number(id), this.newReview).subscribe({
      next: () => {
        this.newReview = { rating: 0, comment: '' };
        this.loadReviews(id);
        this.isSubmitting.set(false);
        this.analytics.conversion('ESTABLISHMENT', 'REVIEW_SUBMIT', Number(id), `/establishments/${id}`);
      },
      error: () => this.isSubmitting.set(false)
    });
  }
}

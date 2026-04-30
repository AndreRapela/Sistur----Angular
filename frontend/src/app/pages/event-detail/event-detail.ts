import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ItineraryService } from '../../services/itinerary.service';
import { MapComponent } from '../../components/map/map';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MapComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './event-detail.html'
})
export class EventDetailComponent implements OnInit {
  event: any;
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private analytics = inject(AnalyticsService);
  itineraryService = inject(ItineraryService);

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.analytics.pageView(`/events/${id}`, 'EVENT', id);
    this.api.getEventById(Number(id)).subscribe((res: any) => {
      this.event = res.data;
      this.cdr.markForCheck();
    });
  }

  toggleItinerary() {
    const event = this.event;
    if (!event) return;

    const wasAdded = this.itineraryService.isInItinerary(event.id, 'EVENT');
    this.itineraryService.toggleItem({
      id: event.id,
      type: 'EVENT',
      name: event.title,
      image: event.photoUrl,
      location: event.location,
      addedAt: new Date()
    });
    this.analytics.conversion('EVENT', wasAdded ? 'ITINERARY_REMOVE' : 'ITINERARY_ADD', event.id, `/events/${event.id}`);
  }

  openWhatsApp() {
    const event = this.event;
    if (!event?.contactNumber) return;
    const msg = encodeURIComponent(`Olá! Vi o evento "${event.title}" no SisTur e gostaria de mais informações.`);
    this.analytics.conversion('EVENT', 'WHATSAPP_CLICK', event.id, `/events/${event.id}`);
    window.open(`https://wa.me/${event.contactNumber}?text=${msg}`, '_blank');
  }

  openGoogleMaps() {
    const event = this.event;
    if (!event) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`;
    this.analytics.conversion('EVENT', 'MAP_CLICK', event.id, `/events/${event.id}`);
    window.open(url, '_blank');
  }

  openBookingLink() {
    const event = this.event;
    if (!event?.externalBookingUrl) return;
    this.analytics.conversion('EVENT', 'BOOKING_CLICK', event.id, `/events/${event.id}`);
    window.open(event.externalBookingUrl, '_blank');
  }
}

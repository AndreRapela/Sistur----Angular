import { Directive, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { Establishment } from '../models/tourism.models';
import {
  GooglePlaceDetails,
  GooglePlaceDetailsService
} from '../services/google-place-details.service';

@Directive({
  selector: '[appGooglePlaceEnrichment]',
  standalone: true
})
export class GooglePlaceEnrichmentDirective implements OnInit {
  private readonly googlePlaces = inject(GooglePlaceDetailsService);

  @Input({ required: true }) appGooglePlaceEnrichment!: Establishment;
  @Output() googlePlaceLoaded = new EventEmitter<GooglePlaceDetails | null>();

  async ngOnInit(): Promise<void> {
    const details = await this.googlePlaces.getSummary(this.appGooglePlaceEnrichment);
    this.googlePlaceLoaded.emit(details);
  }
}

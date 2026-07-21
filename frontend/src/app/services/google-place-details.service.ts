import { Injectable, inject } from '@angular/core';
import { Establishment } from '../models/tourism.models';
import { GoogleMapsLoaderService } from './google-maps-loader.service';

export interface GooglePlaceDetails {
  placeId: string;
  name: string;
  formattedAddress?: string;
  rating?: number;
  reviewCount?: number;
  googleMapsUrl?: string;
  websiteUrl?: string;
  contactNumber?: string;
  openingHours?: string[];
  priceLevel?: string;
  businessStatus?: string;
  photoUrl?: string;
  photoAttribution?: {
    name: string;
    url?: string;
  };
}

const NORONHA_BOUNDS = {
  north: -3.82,
  south: -3.89,
  east: -32.385,
  west: -32.47
};

@Injectable({ providedIn: 'root' })
export class GooglePlaceDetailsService {
  private readonly loader = inject(GoogleMapsLoaderService);
  private readonly cache = new Map<string, Promise<GooglePlaceDetails | null>>();

  getDetails(establishment: Establishment): Promise<GooglePlaceDetails | null> {
    const cacheKey = establishment.googlePlaceId || this.normalize(establishment.name);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const request = this.fetchDetails(establishment).catch(() => null);
    this.cache.set(cacheKey, request);
    return request;
  }

  private async fetchDetails(establishment: Establishment): Promise<GooglePlaceDetails | null> {
    const google = await this.loader.load();
    const placesLibrary = await google.maps.importLibrary('places');

    if (establishment.googlePlaceId) {
      const place = new placesLibrary.Place({ id: establishment.googlePlaceId });
      await place.fetchFields({ fields: this.detailFields() });
      return this.toDetails(place);
    }

    const response = await placesLibrary.Place.searchByText({
      textQuery: `${establishment.name}, Fernando de Noronha, Pernambuco`,
      fields: this.detailFields(),
      locationRestriction: NORONHA_BOUNDS,
      language: 'pt-BR',
      region: 'br',
      maxResultCount: 3
    });

    const places = response.places || [];
    if (!places.length) {
      return null;
    }

    const expectedName = this.normalize(establishment.name);
    const bestMatch = places.find((place: any) => {
      const candidate = this.normalize(this.googleText(place.displayName));
      return candidate === expectedName || candidate.includes(expectedName) || expectedName.includes(candidate);
    }) || places[0];

    return this.toDetails(bestMatch);
  }

  private detailFields(): string[] {
    return [
      'id',
      'displayName',
      'formattedAddress',
      'location',
      'rating',
      'userRatingCount',
      'googleMapsURI',
      'websiteURI',
      'nationalPhoneNumber',
      'internationalPhoneNumber',
      'regularOpeningHours',
      'priceLevel',
      'businessStatus',
      'photos'
    ];
  }

  private toDetails(place: any): GooglePlaceDetails | null {
    const name = this.googleText(place.displayName);
    if (!place?.id || !name) {
      return null;
    }

    const photo = Array.isArray(place.photos) ? place.photos[0] : undefined;
    const attribution = Array.isArray(photo?.authorAttributions) ? photo.authorAttributions[0] : undefined;

    return {
      placeId: String(place.id),
      name,
      formattedAddress: place.formattedAddress ? String(place.formattedAddress) : undefined,
      rating: typeof place.rating === 'number' ? place.rating : undefined,
      reviewCount: typeof place.userRatingCount === 'number' ? place.userRatingCount : undefined,
      googleMapsUrl: place.googleMapsURI ? String(place.googleMapsURI) : undefined,
      websiteUrl: place.websiteURI ? String(place.websiteURI) : undefined,
      contactNumber: place.internationalPhoneNumber || place.nationalPhoneNumber || undefined,
      openingHours: Array.isArray(place.regularOpeningHours?.weekdayDescriptions)
        ? place.regularOpeningHours.weekdayDescriptions.map(String)
        : undefined,
      priceLevel: place.priceLevel ? String(place.priceLevel) : undefined,
      businessStatus: place.businessStatus ? String(place.businessStatus) : undefined,
      photoUrl: typeof photo?.getURI === 'function'
        ? photo.getURI({ maxWidth: 1600, maxHeight: 900 })
        : undefined,
      photoAttribution: attribution?.displayName
        ? {
            name: String(attribution.displayName),
            url: attribution.uri ? String(attribution.uri) : undefined
          }
        : undefined
    };
  }

  private googleText(value: any): string {
    if (typeof value === 'string') {
      return value;
    }
    return typeof value?.text === 'string' ? value.text : '';
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }
}

import { Injectable, inject } from '@angular/core';
import { GoogleMapsLoaderService } from './google-maps-loader.service';

export interface GooglePlaceLookup {
  name: string;
  googlePlaceId?: string;
  googleQuery?: string;
}

export interface GooglePlaceDetails {
  placeId: string;
  name: string;
  formattedAddress?: string;
  rating?: number;
  reviewCount?: number;
  googleMapsUrl?: string;
  reviewsUrl?: string;
  websiteUrl?: string;
  contactNumber?: string;
  openingHours?: string[];
  todayOpeningHours?: string;
  isOpen?: boolean;
  priceLevel?: string;
  businessStatus?: string;
  photoUrl?: string;
  photoAttribution?: {
    name: string;
    url?: string;
  };
  reviews?: GooglePlaceReview[];
  providerAttributions?: GooglePlaceAttribution[];
}

export interface GooglePlaceReview {
  authorName: string;
  authorUrl?: string;
  authorPhotoUrl?: string;
  rating?: number;
  text?: string;
  relativePublishTime?: string;
  publishTime?: string;
  googleMapsUrl?: string;
}

export interface GooglePlaceAttribution {
  name: string;
  url?: string;
}

const NORONHA_BOUNDS = {
  north: -3.805,
  south: -3.9,
  east: -32.385,
  west: -32.49
};

@Injectable({ providedIn: 'root' })
export class GooglePlaceDetailsService {
  private readonly loader = inject(GoogleMapsLoaderService);
  private readonly summaryCache = new Map<string, Promise<GooglePlaceDetails | null>>();
  private readonly detailCache = new Map<string, Promise<GooglePlaceDetails | null>>();
  private readonly summaryQueue: Array<() => void> = [];
  private activeSummaryRequests = 0;
  private readonly maxConcurrentSummaries = 3;

  getSummary(placeLookup: GooglePlaceLookup): Promise<GooglePlaceDetails | null> {
    const cacheKey = this.cacheKey(placeLookup);
    const detailed = this.detailCache.get(cacheKey);
    if (detailed) {
      return detailed;
    }

    const cached = this.summaryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const request = this.enqueueSummary(() => this.fetchPlace(placeLookup, this.summaryFields(), 960))
      .catch(() => null);
    this.summaryCache.set(cacheKey, request);
    return request;
  }

  getDetails(placeLookup: GooglePlaceLookup): Promise<GooglePlaceDetails | null> {
    const cacheKey = this.cacheKey(placeLookup);
    const cached = this.detailCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const request = this.fetchPlace(placeLookup, this.detailFields(), 1600).catch(() => null);
    this.detailCache.set(cacheKey, request);
    this.summaryCache.set(cacheKey, request);
    return request;
  }

  private cacheKey(placeLookup: GooglePlaceLookup): string {
    return placeLookup.googlePlaceId || this.normalize(placeLookup.googleQuery || placeLookup.name);
  }

  private enqueueSummary<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const run = () => {
        this.activeSummaryRequests++;
        task()
          .then(resolve, reject)
          .finally(() => {
            this.activeSummaryRequests--;
            this.drainSummaryQueue();
          });
      };

      this.summaryQueue.push(run);
      this.drainSummaryQueue();
    });
  }

  private drainSummaryQueue(): void {
    while (this.activeSummaryRequests < this.maxConcurrentSummaries && this.summaryQueue.length) {
      this.summaryQueue.shift()?.();
    }
  }

  private async fetchPlace(
    placeLookup: GooglePlaceLookup,
    fields: string[],
    photoMaxWidth: number
  ): Promise<GooglePlaceDetails | null> {
    const google = await this.loader.load();
    const placesLibrary = await google.maps.importLibrary('places');

    if (placeLookup.googlePlaceId) {
      const place = new placesLibrary.Place({ id: placeLookup.googlePlaceId });
      await place.fetchFields({ fields });
      return this.toDetails(place, photoMaxWidth);
    }

    const response = await placesLibrary.Place.searchByText({
      textQuery: `${placeLookup.googleQuery || placeLookup.name}, Fernando de Noronha, Pernambuco`,
      fields,
      locationRestriction: NORONHA_BOUNDS,
      language: 'pt-BR',
      region: 'br',
      maxResultCount: 3
    });

    const places = response.places || [];
    if (!places.length) {
      return null;
    }

    const expectedName = this.normalize(placeLookup.name);
    const bestMatch = places.find((place: any) => {
      const candidate = this.normalize(this.googleText(place.displayName));
      return candidate === expectedName || candidate.includes(expectedName) || expectedName.includes(candidate);
    }) || places[0];

    return this.toDetails(bestMatch, photoMaxWidth);
  }

  private summaryFields(): string[] {
    return [
      'id',
      'displayName',
      'formattedAddress',
      'location',
      'rating',
      'userRatingCount',
      'googleMapsURI',
      'googleMapsLinks',
      'currentOpeningHours',
      'regularOpeningHours',
      'priceLevel',
      'businessStatus',
      'photos'
    ];
  }

  private detailFields(): string[] {
    return [
      ...this.summaryFields(),
      'websiteURI',
      'nationalPhoneNumber',
      'internationalPhoneNumber',
      'reviews'
    ];
  }

  private toDetails(place: any, photoMaxWidth: number): GooglePlaceDetails | null {
    const name = this.googleText(place.displayName);
    if (!place?.id || !name) {
      return null;
    }

    const photo = Array.isArray(place.photos) ? place.photos[0] : undefined;
    const attribution = Array.isArray(photo?.authorAttributions) ? photo.authorAttributions[0] : undefined;
    const currentHours = place.currentOpeningHours;
    const regularHours = place.regularOpeningHours;
    const openingDescriptions = Array.isArray(currentHours?.weekdayDescriptions)
      ? currentHours.weekdayDescriptions.map(String)
      : Array.isArray(regularHours?.weekdayDescriptions)
        ? regularHours.weekdayDescriptions.map(String)
        : undefined;

    return {
      placeId: String(place.id),
      name,
      formattedAddress: place.formattedAddress ? String(place.formattedAddress) : undefined,
      rating: typeof place.rating === 'number' ? place.rating : undefined,
      reviewCount: typeof place.userRatingCount === 'number' ? place.userRatingCount : undefined,
      googleMapsUrl: place.googleMapsURI ? String(place.googleMapsURI) : undefined,
      reviewsUrl: place.googleMapsLinks?.reviewsURI
        ? String(place.googleMapsLinks.reviewsURI)
        : undefined,
      websiteUrl: place.websiteURI ? String(place.websiteURI) : undefined,
      contactNumber: place.internationalPhoneNumber || place.nationalPhoneNumber || undefined,
      openingHours: openingDescriptions,
      todayOpeningHours: this.todayOpeningHours(openingDescriptions),
      isOpen: typeof currentHours?.openNow === 'boolean' ? currentHours.openNow : undefined,
      priceLevel: place.priceLevel ? String(place.priceLevel) : undefined,
      businessStatus: place.businessStatus ? String(place.businessStatus) : undefined,
      photoUrl: typeof photo?.getURI === 'function'
        ? photo.getURI({ maxWidth: photoMaxWidth, maxHeight: Math.round(photoMaxWidth * 0.75) })
        : undefined,
      photoAttribution: attribution?.displayName
        ? {
            name: String(attribution.displayName),
            url: attribution.uri ? String(attribution.uri) : undefined
          }
        : undefined,
      reviews: this.mapReviews(place.reviews),
      providerAttributions: this.mapAttributions(place.attributions)
    };
  }

  private mapReviews(reviews: any): GooglePlaceReview[] | undefined {
    if (!Array.isArray(reviews)) return undefined;

    const mapped = reviews.slice(0, 5).map(review => {
      const author = review?.authorAttribution;
      return {
        authorName: author?.displayName ? String(author.displayName) : 'Usuário do Google',
        authorUrl: author?.uri ? String(author.uri) : undefined,
        authorPhotoUrl: author?.photoURI ? String(author.photoURI) : undefined,
        rating: typeof review?.rating === 'number' ? review.rating : undefined,
        text: review?.text ? this.googleText(review.text) : undefined,
        relativePublishTime: review?.relativePublishTimeDescription
          ? String(review.relativePublishTimeDescription)
          : undefined,
        publishTime: review?.publishTime instanceof Date
          ? review.publishTime.toISOString()
          : review?.publishTime ? String(review.publishTime) : undefined,
        googleMapsUrl: review?.googleMapsURI ? String(review.googleMapsURI) : undefined
      } satisfies GooglePlaceReview;
    });

    return mapped.filter(review => review.text || review.rating);
  }

  private mapAttributions(attributions: any): GooglePlaceAttribution[] | undefined {
    if (!Array.isArray(attributions)) return undefined;

    const mapped = attributions.map(attribution => ({
      name: String(attribution?.provider || attribution?.displayName || '').trim(),
      url: attribution?.providerURI || attribution?.uri
        ? String(attribution.providerURI || attribution.uri)
        : undefined
    })).filter(attribution => attribution.name);

    return mapped.length ? mapped : undefined;
  }

  private todayOpeningHours(descriptions?: string[]): string | undefined {
    if (!descriptions?.length) return undefined;

    const weekday = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      timeZone: 'America/Noronha'
    }).format(new Date());
    const normalizedWeekday = this.normalize(weekday);

    return descriptions.find(description => this.normalize(description).startsWith(normalizedWeekday));
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

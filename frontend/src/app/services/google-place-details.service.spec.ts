import { TestBed } from '@angular/core/testing';
import { GoogleMapsLoaderService } from './google-maps-loader.service';
import { GooglePlaceDetailsService } from './google-place-details.service';

describe('GooglePlaceDetailsService', () => {
  let service: GooglePlaceDetailsService;
  let searchCalls: number;

  beforeEach(() => {
    searchCalls = 0;
    const place = {
      id: 'place-123',
      displayName: 'Cacimba Bistrô',
      formattedAddress: 'Vila dos Remédios, Fernando de Noronha',
      rating: 4.7,
      userRatingCount: 1855,
      googleMapsURI: 'https://maps.google.com/place-123',
      googleMapsLinks: { reviewsURI: 'https://maps.google.com/place-123/reviews' },
      websiteURI: 'https://example.com',
      internationalPhoneNumber: '+55 81 99999-0000',
      currentOpeningHours: {
        openNow: true,
        weekdayDescriptions: ['segunda-feira: 12:00–23:30', 'terça-feira: 12:00–23:30']
      },
      priceLevel: 'PRICE_LEVEL_EXPENSIVE',
      businessStatus: 'OPERATIONAL',
      photos: [{
        getURI: () => 'https://lh3.googleusercontent.com/photo',
        authorAttributions: [{ displayName: 'Fotógrafa Local', uri: 'https://maps.google.com/author' }]
      }],
      reviews: [{
        authorAttribution: {
          displayName: 'Visitante',
          uri: 'https://maps.google.com/user',
          photoURI: 'https://lh3.googleusercontent.com/avatar'
        },
        rating: 5,
        text: 'Ótima experiência.',
        relativePublishTimeDescription: 'há um mês',
        googleMapsURI: 'https://maps.google.com/review-1'
      }]
    };

    class FakePlace {
      static async searchByText(): Promise<{ places: unknown[] }> {
        searchCalls += 1;
        return { places: [place] };
      }
    }

    TestBed.configureTestingModule({
      providers: [{
        provide: GoogleMapsLoaderService,
        useValue: {
          load: async () => ({
            maps: {
              importLibrary: async () => ({ Place: FakePlace })
            }
          })
        }
      }]
    });
    service = TestBed.inject(GooglePlaceDetailsService);
  });

  it('maps live Google details, photo attribution and visitor reviews', async () => {
    const details = await service.getDetails({ name: 'Cacimba Bistrô' });

    expect(details?.rating).toBe(4.7);
    expect(details?.reviewCount).toBe(1855);
    expect(details?.isOpen).toBe(true);
    expect(details?.openingHours).toEqual(['segunda-feira: 12:00–23:30', 'terça-feira: 12:00–23:30']);
    expect(details?.photoAttribution?.name).toBe('Fotógrafa Local');
    expect(details?.reviews?.[0].authorName).toBe('Visitante');
    expect(details?.reviews?.[0].googleMapsUrl).toBe('https://maps.google.com/review-1');
  });

  it('reuses in-memory details during the same navigation session', async () => {
    await service.getDetails({ name: 'Cacimba Bistrô' });
    await service.getDetails({ name: 'Cacimba Bistrô' });

    expect(searchCalls).toBe(1);
  });
});

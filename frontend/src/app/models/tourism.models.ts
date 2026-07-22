export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface TrackEventRequest {
  targetType: string;
  targetId?: number | string | null;
  targetLabel?: string | null;
  actionType?: string;
  pagePath?: string;
  referrer?: string;
}

export interface RouteOptimizationItemDTO {
  id: string;
  type: string;
  name: string;
  location?: string;
  category?: string;
  bestTime?: string;
  bestSeason?: string;
  idealWeather?: string;
  day?: number;
  time?: string;
  notes?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface RouteOptimizationResponseDTO {
  summary: string;
  aiReasoning: string;
  tips: string[];
  recommendationType: string;
  estimatedDistanceKm: number;
  estimatedDurationMinutes: number;
  difficulty: string;
  optimizedItems: RouteOptimizationItemDTO[];
}

export interface RouteOptimizationRequestDTO {
  items: RouteOptimizationItemDTO[];
  tripStartDate?: string;
  tripEndDate?: string;
  weatherCondition?: string;
  temperatureCelsius?: number;
}

export interface LocationDTO {
  lat: number;
  lng: number;
  name?: string;
}

export interface RouteRequestDTO {
  waypoints: LocationDTO[];
  travelMode?: string;
}

export interface RouteResponseDTO {
  distanceMeters: number;
  durationSeconds: number;
  polyline: string;
  difficulty: string;
  estimatedCalories: number;
  optimizedWaypoints: LocationDTO[];
}

export interface AdminStatsDTO {
  totalUsers: number;
  activeUsersLast30Days: number;
  registrationsLast30Days: number;
  totalRequests: number;
  totalConversions: number;
  accessByEstablishment: Record<string, number>;
  conversionByEstablishment: Record<string, number>;
}

export interface AdminMetricEntryDTO {
  key: string;
  label: string;
  value: number;
  rate: number;
}

export interface AdminDailyMetricDTO {
  date: string;
  value: number;
}

export interface AdminAnalyticsDTO {
  totalUsers: number;
  activeUsersLast30Days: number;
  registrationsLast30Days: number;
  totalRequests: number;
  totalConversions: number;
  requestsLast30Days: number;
  conversionsLast30Days: number;
  googleServiceClicks: number;
  googleCategoryClicks: number;
  itineraryAdds: number;
  detailOpens: number;
  pageViews: number;
  searchEvents: number;
  conversionRate: number;
  googleConversionRate: number;
  categoryDemand: AdminMetricEntryDTO[];
  conversionByCategory: AdminMetricEntryDTO[];
  topGoogleServiceClicks: AdminMetricEntryDTO[];
  topViewedItems: AdminMetricEntryDTO[];
  dailyRegistrations: AdminDailyMetricDTO[];
  dailyGoogleClicks: AdminDailyMetricDTO[];
  dailyRequests: AdminDailyMetricDTO[];
  funnel: Record<string, number>;
}

export interface EstablishmentStatsDTO {
  establishmentId: number;
  establishmentName: string;
  views: number;
  conversions: number;
  whatsappClicks: number;
  mapClicks: number;
  bookingClicks: number;
  websiteClicks: number;
  itineraryAdds: number;
  conversionsByAction: Record<string, number>;
  conversionRate: number;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  photoUrl?: string | null;
  category: string;
  externalBookingUrl?: string;
  latitude: number;
  longitude: number;
  likes?: number;
  shares?: number;
}

export interface Tour {
  id: number;
  name: string;
  description: string;
  category: string;
  photoUrl?: string | null;
  photoCredit?: string;
  price?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  reviewSource?: string;
  reviewUrl?: string;
  partnership: string;
  contactNumber?: string;
  duration?: string;
  schedule?: string;
  meetingPoint?: string;
  itinerary?: string;
  includedItems?: string;
  excludedItems?: string;
  requirements?: string;
  bookingUrl?: string;
  googleMapsUrl?: string;
  sourceUrl?: string;
  dataVerifiedAt?: string;
  latitude: number;
  longitude: number;
  discountDescription?: string; // Ex: "Compre 1 prato principal e ganhe outro"
  premiumOnly?: boolean;        // Se o desconto é exclusivo para PRO/PREMIUM
}

export interface TouristPoint {
  id: number;
  name: string;
  description: string;
  category: string;
  location: string;
  photoUrl?: string | null;
  accessType?: string;
  requiresTicket?: boolean;
  requiresGuide?: boolean;
  bestTime?: string;
  bestSeason?: string;
  historicalContext?: string;
  localContext?: string;
  idealWeather?: string;
  gallery?: string[];
  latitude?: number;
  longitude?: number;
}

export type EstablishmentType =
  | 'RESTAURANT'
  | 'BAR'
  | 'HOTEL'
  | 'POUSADA'
  | 'RESORT'
  | 'CONVENIENCE'
  | 'GAS_STATION'
  | 'MARKET'
  | 'FAIR'
  | 'PHARMACY';

export interface Establishment {
  id: number;
  name: string;
  description: string;
  type: EstablishmentType;
  foodType?: string;
  averagePrice?: number | null;
  rating?: number | null;
  location: string;
  photoUrl?: string | null;
  instagramUrl?: string;
  websiteUrl?: string;
  openingHours?: string;
  contactNumber?: string;
  amenities?: string;
  googlePlaceId?: string;
  googleMapsUrl?: string;
  menuUrl?: string;
  priceRange?: string;
  popularDishes?: string;
  bestVisitTime?: string;
  weatherAdvice?: string;
  reviewCount?: number | null;
  dataSourceUrl?: string;
  dataVerifiedAt?: string;
  discountDescription?: string;
  discountHours?: string;
  isPremiumExclusive?: boolean;
  premiumOnly?: boolean;
  latitude: number;
  longitude: number;
}

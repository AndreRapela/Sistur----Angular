export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface TrackEventRequest {
  targetType: string;
  targetId?: number | string | null;
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
  photoUrl: string;
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
  photoUrl: string;
  price: number;
  partnership: string;
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
  photoUrl: string;
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

export type EstablishmentType = 'RESTAURANT' | 'HOTEL';

export interface Establishment {
  id: number;
  name: string;
  description: string;
  type: string;
  foodType?: string;
  averagePrice: number;
  rating: number;
  location: string;
  photoUrl: string;
  instagramUrl?: string;
  websiteUrl?: string;
  openingHours?: string;
  contactNumber?: string;
  amenities?: string;
  discountDescription?: string;
  discountHours?: string;
  isPremiumExclusive?: boolean;
  premiumOnly?: boolean;
  latitude: number;
  longitude: number;
}

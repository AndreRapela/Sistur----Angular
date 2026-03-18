export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
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
  amenities?: string;
  latitude: number;
  longitude: number;
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Event, Tour, TouristPoint, Establishment, EstablishmentType, Page, ApiResponse, AdminStatsDTO, AdminAnalyticsDTO, EstablishmentStatsDTO, RouteRequestDTO, RouteResponseDTO } from '../models/tourism.models';
import { environment } from '../../environments/environment';
import { SILENT_HTTP_ERROR } from '../interceptors/error.interceptor';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private withPagination(params = new HttpParams(), size = 100): HttpParams {
    return params
      .set('page', '0')
      .set('size', String(size));
  }

  private requestContext(silentError: boolean): HttpContext {
    return new HttpContext().set(SILENT_HTTP_ERROR, silentError);
  }

  getEvents(category?: string, silentError = false): Observable<ApiResponse<Page<Event>>> {
    let params = this.withPagination();
    if (category) params = params.set('category', category);
    return this.http.get<ApiResponse<Page<Event>>>(`${this.apiUrl}/events`, {
      params,
      context: this.requestContext(silentError)
    });
  }

  getEventById(id: number): Observable<ApiResponse<Event>> {
    return this.http.get<ApiResponse<Event>>(`${this.apiUrl}/events/${id}`);
  }

  getTours(category?: string, silentError = false): Observable<ApiResponse<Page<Tour>>> {
    let params = this.withPagination();
    if (category) params = params.set('category', category);
    return this.http.get<ApiResponse<Page<Tour>>>(`${this.apiUrl}/tours`, {
      params,
      context: this.requestContext(silentError)
    });
  }

  getTourById(id: number): Observable<ApiResponse<Tour>> {
    return this.http.get<ApiResponse<Tour>>(`${this.apiUrl}/tours/${id}`);
  }

  getTouristPoints(category?: string, search?: string, silentError = false): Observable<ApiResponse<Page<TouristPoint>>> {
    let params = this.withPagination();
    if (category) params = params.set('category', category);
    if (search) params = params.set('search', search);

    return this.http.get<ApiResponse<Page<TouristPoint>>>(`${this.apiUrl}/tourist-points`, {
      params,
      context: this.requestContext(silentError)
    });
  }

  getTouristPointById(id: number): Observable<ApiResponse<TouristPoint>> {
    return this.http.get<ApiResponse<TouristPoint>>(`${this.apiUrl}/tourist-points/${id}`);
  }

  getEstablishments(type: EstablishmentType, category?: string, search?: string): Observable<ApiResponse<Page<Establishment>>> {
    let params = this.withPagination(new HttpParams().set('type', type));
    if (category && category !== 'Todos') params = params.set('category', category);
    if (search) params = params.set('search', search);

    return this.http.get<ApiResponse<Page<Establishment>>>(`${this.apiUrl}/establishments`, { params });
  }

  getMapEstablishments(types: EstablishmentType[], silentError = false): Observable<ApiResponse<Establishment[]>> {
    let params = new HttpParams();
    types.forEach(type => {
      params = params.append('types', type);
    });

    return this.http.get<ApiResponse<Establishment[]>>(`${this.apiUrl}/establishments/map`, {
      params,
      context: this.requestContext(silentError)
    });
  }

  calculateRoute(request: RouteRequestDTO, silentError = false): Observable<ApiResponse<RouteResponseDTO>> {
    return this.http.post<ApiResponse<RouteResponseDTO>>(`${this.apiUrl}/routes/calculate`, request, {
      context: this.requestContext(silentError)
    });
  }

  getEstablishmentById(id: number, silentError = false): Observable<ApiResponse<Establishment>> {
    return this.http.get<ApiResponse<Establishment>>(`${this.apiUrl}/establishments/${id}`, {
      context: this.requestContext(silentError)
    });
  }

  createEstablishment(data: Partial<Establishment>): Observable<ApiResponse<Establishment>> {
    return this.http.post<ApiResponse<Establishment>>(`${this.apiUrl}/establishments`, data);
  }

  getEstablishmentReviews(id: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/establishments/${id}/reviews`);
  }

  addEstablishmentReview(id: number, review: any): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/establishments/${id}/reviews`, review);
  }

  getAdminStats(): Observable<ApiResponse<AdminStatsDTO>> {
    return this.http.get<ApiResponse<AdminStatsDTO>>(`${this.apiUrl}/admin/stats`);
  }

  getAdminAnalytics(): Observable<ApiResponse<AdminAnalyticsDTO>> {
    return this.http.get<ApiResponse<AdminAnalyticsDTO>>(`${this.apiUrl}/admin/stats/overview`);
  }

  getEstablishmentStats(id: number): Observable<ApiResponse<EstablishmentStatsDTO>> {
    return this.http.get<ApiResponse<EstablishmentStatsDTO>>(`${this.apiUrl}/admin/stats/establishments/${id}`);
  }

  updateEstablishment(id: number, data: Partial<Establishment>): Observable<ApiResponse<Establishment>> {
    return this.http.put<ApiResponse<Establishment>>(`${this.apiUrl}/establishments/${id}`, data);
  }
}

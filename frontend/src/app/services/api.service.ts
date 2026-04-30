import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Event, Tour, TouristPoint, Establishment, EstablishmentType, Page, ApiResponse, AdminStatsDTO, EstablishmentStatsDTO, RouteRequestDTO, RouteResponseDTO } from '../models/tourism.models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getEvents(category?: string): Observable<ApiResponse<Page<Event>>> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    return this.http.get<ApiResponse<Page<Event>>>(`${this.apiUrl}/events`, { params });
  }

  getEventById(id: number): Observable<ApiResponse<Event>> {
    return this.http.get<ApiResponse<Event>>(`${this.apiUrl}/events/${id}`);
  }

  getTours(category?: string): Observable<ApiResponse<Page<Tour>>> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    return this.http.get<ApiResponse<Page<Tour>>>(`${this.apiUrl}/tours`, { params });
  }

  getTourById(id: number): Observable<ApiResponse<Tour>> {
    return this.http.get<ApiResponse<Tour>>(`${this.apiUrl}/tours/${id}`);
  }

  getTouristPoints(category?: string, search?: string): Observable<ApiResponse<Page<TouristPoint>>> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    if (search) params = params.set('search', search);

    return this.http.get<ApiResponse<Page<TouristPoint>>>(`${this.apiUrl}/tourist-points`, { params });
  }

  getTouristPointById(id: number): Observable<ApiResponse<TouristPoint>> {
    return this.http.get<ApiResponse<TouristPoint>>(`${this.apiUrl}/tourist-points/${id}`);
  }

  getEstablishments(type: EstablishmentType, category?: string, search?: string): Observable<ApiResponse<Page<Establishment>>> {
    let params = new HttpParams().set('type', type);
    if (category && category !== 'Todos') params = params.set('category', category);
    if (search) params = params.set('search', search);

    return this.http.get<ApiResponse<Page<Establishment>>>(`${this.apiUrl}/establishments`, { params });
  }

  calculateRoute(request: RouteRequestDTO): Observable<ApiResponse<RouteResponseDTO>> {
    return this.http.post<ApiResponse<RouteResponseDTO>>(`${this.apiUrl}/routes/calculate`, request);
  }

  getEstablishmentById(id: number): Observable<ApiResponse<Establishment>> {
    return this.http.get<ApiResponse<Establishment>>(`${this.apiUrl}/establishments/${id}`);
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

  getEstablishmentStats(id: number): Observable<ApiResponse<EstablishmentStatsDTO>> {
    return this.http.get<ApiResponse<EstablishmentStatsDTO>>(`${this.apiUrl}/admin/stats/establishments/${id}`);
  }

  updateEstablishment(id: number, data: Partial<Establishment>): Observable<ApiResponse<Establishment>> {
    return this.http.put<ApiResponse<Establishment>>(`${this.apiUrl}/establishments/${id}`, data);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Event, Tour, Establishment, EstablishmentType, Page, ApiResponse } from '../models/tourism.models';
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

  getTours(category?: string): Observable<ApiResponse<Page<Tour>>> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    return this.http.get<ApiResponse<Page<Tour>>>(`${this.apiUrl}/tours`, { params });
  }

  getEstablishments(type: EstablishmentType): Observable<ApiResponse<Page<Establishment>>> {
    return this.http.get<ApiResponse<Page<Establishment>>>(`${this.apiUrl}/establishments`, {
      params: new HttpParams().set('type', type)
    });
  }

  calculateRoute(request: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/routes/calculate`, request);
  }
}

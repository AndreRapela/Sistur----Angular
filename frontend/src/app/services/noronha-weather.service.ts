import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';

export interface NoronhaWeather {
  temperature: number;
  apparentTemperature: number;
  precipitation: number;
  weatherCode: number;
  cloudCover: number;
  windSpeed: number;
}

interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    precipitation?: number;
    weather_code?: number;
    cloud_cover?: number;
    wind_speed_10m?: number;
  };
}

@Injectable({ providedIn: 'root' })
export class NoronhaWeatherService {
  private readonly http = inject(HttpClient);
  private request$?: Observable<NoronhaWeather>;

  current(): Observable<NoronhaWeather> {
    if (!this.request$) {
      const params = new HttpParams()
        .set('latitude', '-3.8415')
        .set('longitude', '-32.4116')
        .set('current', 'temperature_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m')
        .set('timezone', 'America/Noronha');

      this.request$ = this.http
        .get<OpenMeteoResponse>('https://api.open-meteo.com/v1/forecast', { params })
        .pipe(
          map(response => {
            const current = response.current || {};
            return {
              temperature: Number(current.temperature_2m ?? 0),
              apparentTemperature: Number(current.apparent_temperature ?? current.temperature_2m ?? 0),
              precipitation: Number(current.precipitation ?? 0),
              weatherCode: Number(current.weather_code ?? 0),
              cloudCover: Number(current.cloud_cover ?? 0),
              windSpeed: Number(current.wind_speed_10m ?? 0)
            };
          }),
          shareReplay({ bufferSize: 1, refCount: false })
        );
    }

    return this.request$;
  }
}

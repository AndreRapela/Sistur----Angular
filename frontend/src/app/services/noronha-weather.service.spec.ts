import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { NoronhaWeatherService } from './noronha-weather.service';

describe('NoronhaWeatherService', () => {
  let service: NoronhaWeatherService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(NoronhaWeatherService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('turns severe forecast data into prioritized safety guidance', async () => {
    const overviewPromise = firstValueFrom(service.overview());
    const request = http.expectOne(`${environment.apiUrl}/weather/noronha`);

    request.flush({
      success: true,
      message: 'ok',
      timestamp: new Date().toISOString(),
      data: {
        fetchedAt: '2026-07-22T02:00:00Z',
        stale: false,
        forecast: {
          current: {
            time: '2026-07-22T00:15',
            temperature_2m: 29,
            apparent_temperature: 37,
            relative_humidity_2m: 78,
            precipitation: 8,
            weather_code: 95,
            cloud_cover: 92,
            wind_speed_10m: 38,
            wind_gusts_10m: 72
          },
          hourly: {
            time: ['2026-07-22T01:00', '2026-07-22T04:00', '2026-07-22T07:00', '2026-07-22T10:00'],
            temperature_2m: [29, 28, 28, 30],
            precipitation_probability: [90, 88, 70, 40],
            weather_code: [95, 82, 63, 2],
            wind_gusts_10m: [72, 68, 55, 40]
          },
          daily: {
            temperature_2m_max: [31],
            temperature_2m_min: [25],
            apparent_temperature_max: [38],
            uv_index_max: [11],
            precipitation_probability_max: [90],
            precipitation_sum: [28],
            wind_gusts_10m_max: [72]
          }
        },
        marine: {
          current: {
            wave_height: 2.8,
            wave_period: 10,
            swell_wave_height: 2.4,
            sea_surface_temperature: 27
          },
          daily: {
            wave_height_max: [3.1]
          }
        }
      }
    });

    const overview = await overviewPromise;
    expect(overview.level).toBe('danger');
    expect(overview.alerts[0].id).toBe('storm');
    expect(overview.alerts.some(alert => alert.id === 'waves')).toBe(true);
    expect(overview.alerts.some(alert => alert.id === 'uv-extreme')).toBe(true);
    expect(overview.marine?.maximumWaveHeight).toBe(3.1);
  });

  it('keeps terrestrial weather usable when the marine provider is unavailable', async () => {
    const overviewPromise = firstValueFrom(service.overview());
    const request = http.expectOne(`${environment.apiUrl}/weather/noronha`);

    request.flush({
      success: true,
      message: 'ok',
      timestamp: new Date().toISOString(),
      data: {
        forecast: {
          current: {
            time: '2026-07-22T08:00',
            temperature_2m: 26,
            apparent_temperature: 28,
            weather_code: 1,
            wind_speed_10m: 18,
            wind_gusts_10m: 25
          },
          hourly: {
            time: ['2026-07-22T08:00'],
            temperature_2m: [26],
            precipitation_probability: [10],
            weather_code: [1],
            wind_gusts_10m: [25]
          },
          daily: {
            temperature_2m_max: [28],
            temperature_2m_min: [24],
            apparent_temperature_max: [30],
            uv_index_max: [6],
            precipitation_probability_max: [10],
            precipitation_sum: [0],
            wind_gusts_10m_max: [25]
          }
        },
        marine: null
      }
    });

    const overview = await overviewPromise;
    expect(overview.level).toBe('safe');
    expect(overview.marine).toBeNull();
    expect(overview.current.condition).toBe('Poucas nuvens');
  });

  it('uses the direct development forecast when the local backend is offline', async () => {
    const overviewPromise = firstValueFrom(service.overview());
    const gatewayRequest = http.expectOne(`${environment.apiUrl}/weather/noronha`);
    gatewayRequest.flush('offline', { status: 503, statusText: 'Service Unavailable' });

    const forecastRequest = http.expectOne(request =>
      request.url === 'https://api.open-meteo.com/v1/forecast' &&
      request.params.get('timezone') === 'America/Noronha'
    );
    const marineRequest = http.expectOne(request =>
      request.url === 'https://marine-api.open-meteo.com/v1/marine' &&
      request.params.get('cell_selection') === 'sea'
    );

    forecastRequest.flush({
      current: {
        time: '2026-08-02T10:00',
        temperature_2m: 27,
        apparent_temperature: 29,
        weather_code: 1,
        wind_speed_10m: 18,
        wind_gusts_10m: 24
      },
      hourly: {
        time: ['2026-08-02T10:00'],
        temperature_2m: [27],
        precipitation_probability: [10],
        weather_code: [1],
        wind_gusts_10m: [24]
      },
      daily: {
        temperature_2m_max: [29],
        temperature_2m_min: [24],
        apparent_temperature_max: [31],
        uv_index_max: [7],
        precipitation_probability_max: [10],
        precipitation_sum: [0],
        wind_gusts_10m_max: [24]
      }
    });
    marineRequest.flush({
      current: {
        wave_height: 1.1,
        wave_period: 8,
        swell_wave_height: 0.9,
        sea_surface_temperature: 27
      },
      daily: { wave_height_max: [1.3] }
    });

    const overview = await overviewPromise;
    expect(overview.delivery).toBe('direct-development');
    expect(overview.current.temperature).toBe(27);
    expect(overview.marine?.maximumWaveHeight).toBe(1.3);
  });
});

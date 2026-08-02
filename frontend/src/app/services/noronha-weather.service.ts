import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/tourism.models';
import { SILENT_HTTP_ERROR } from '../interceptors/error.interceptor';

export type WeatherSafetyLevel = 'safe' | 'attention' | 'warning' | 'danger';

export interface NoronhaWeather {
  temperature: number;
  apparentTemperature: number;
  precipitation: number;
  weatherCode: number;
  cloudCover: number;
  windSpeed: number;
}

export interface WeatherSafetyAlert {
  id: string;
  level: WeatherSafetyLevel;
  icon: string;
  title: string;
  message: string;
  places: string;
}

export interface HourlyWeatherPeriod {
  time: string;
  label: string;
  temperature: number;
  precipitationProbability: number;
  windGust: number;
  weatherCode: number;
  condition: string;
  icon: string;
}

export interface NoronhaWeatherOverview {
  current: NoronhaWeather & {
    time: string;
    relativeHumidity: number;
    windGust: number;
    condition: string;
    icon: string;
  };
  today: {
    maximumTemperature: number;
    minimumTemperature: number;
    maximumApparentTemperature: number;
    uvIndex: number;
    precipitationProbability: number;
    precipitationSum: number;
    maximumWindGust: number;
  };
  marine: {
    waveHeight: number;
    maximumWaveHeight: number;
    wavePeriod: number;
    swellHeight: number;
    seaTemperature: number | null;
  } | null;
  nextHours: HourlyWeatherPeriod[];
  alerts: WeatherSafetyAlert[];
  level: WeatherSafetyLevel;
  statusLabel: string;
  headline: string;
  summary: string;
  fetchedAt: string;
  stale: boolean;
}

interface WeatherGatewayData {
  forecast?: OpenMeteoResponse;
  marine?: OpenMeteoMarineResponse | null;
  fetchedAt?: string;
  stale?: boolean;
}

interface OpenMeteoResponse {
  current?: Record<string, number | string>;
  hourly?: Record<string, Array<number | string | null>>;
  daily?: Record<string, Array<number | string | null>>;
}

interface OpenMeteoMarineResponse {
  current?: Record<string, number | string>;
  daily?: Record<string, Array<number | string | null>>;
}

@Injectable({ providedIn: 'root' })
export class NoronhaWeatherService {
  private readonly http = inject(HttpClient);
  private overviewRequest$?: Observable<NoronhaWeatherOverview>;

  current(): Observable<NoronhaWeather> {
    return this.overview().pipe(map(overview => overview.current));
  }

  overview(forceRefresh = false): Observable<NoronhaWeatherOverview> {
    if (forceRefresh) {
      this.overviewRequest$ = undefined;
    }

    if (!this.overviewRequest$) {
      this.overviewRequest$ = this.http
        .get<ApiResponse<WeatherGatewayData>>(`${environment.apiUrl}/weather/noronha`, {
          context: new HttpContext().set(SILENT_HTTP_ERROR, true)
        })
        .pipe(
          map(response => this.toOverview(response.data || {})),
          shareReplay({ bufferSize: 1, refCount: false })
        );
    }

    return this.overviewRequest$;
  }

  private toOverview(gateway: WeatherGatewayData): NoronhaWeatherOverview {
    const forecast = gateway.forecast || {};
    const current = forecast.current || {};
    const hourly = forecast.hourly || {};
    const daily = forecast.daily || {};
    const currentTime = this.text(current['time']);
    const currentCode = this.number(current['weather_code']);
    const nextHours = this.buildNextHours(hourly, currentTime);
    const marine = this.buildMarine(gateway.marine);

    const today = {
      maximumTemperature: this.arrayNumber(daily['temperature_2m_max']),
      minimumTemperature: this.arrayNumber(daily['temperature_2m_min']),
      maximumApparentTemperature: this.arrayNumber(daily['apparent_temperature_max']),
      uvIndex: this.arrayNumber(daily['uv_index_max']),
      precipitationProbability: this.arrayNumber(daily['precipitation_probability_max']),
      precipitationSum: this.arrayNumber(daily['precipitation_sum']),
      maximumWindGust: this.arrayNumber(daily['wind_gusts_10m_max'])
    };

    const alerts = this.buildAlerts({
      currentCode,
      currentPrecipitation: this.number(current['precipitation']),
      currentWindGust: this.number(current['wind_gusts_10m']),
      nextHours,
      today,
      marine
    });
    const level = this.highestLevel(alerts);
    const primaryAlert = alerts[0];

    return {
      current: {
        time: currentTime,
        temperature: this.number(current['temperature_2m']),
        apparentTemperature: this.number(current['apparent_temperature'], this.number(current['temperature_2m'])),
        relativeHumidity: this.number(current['relative_humidity_2m']),
        precipitation: this.number(current['precipitation']),
        weatherCode: currentCode,
        cloudCover: this.number(current['cloud_cover']),
        windSpeed: this.number(current['wind_speed_10m']),
        windGust: this.number(current['wind_gusts_10m']),
        condition: this.weatherLabel(currentCode),
        icon: this.weatherIcon(currentCode)
      },
      today,
      marine,
      nextHours,
      alerts,
      level,
      statusLabel: this.statusLabel(level),
      headline: primaryAlert?.title || 'Condições sem alerta relevante',
      summary: primaryAlert?.message || 'Ainda assim, confirme a sinalização local antes de entrar no mar ou iniciar trilhas.',
      fetchedAt: gateway.fetchedAt || new Date().toISOString(),
      stale: Boolean(gateway.stale)
    };
  }

  private buildNextHours(hourly: Record<string, Array<number | string | null>>, currentTime: string): HourlyWeatherPeriod[] {
    const times = (hourly['time'] || []).map(value => this.text(value));
    const start = Math.max(times.findIndex(time => !currentTime || time >= currentTime), 0);

    return [0, 3, 6, 9].map(offset => {
      const index = Math.min(start + offset, Math.max(times.length - 1, 0));
      const code = this.arrayNumber(hourly['weather_code'], index);
      const time = times[index] || '';
      return {
        time,
        label: offset === 0 ? 'Agora' : this.hourLabel(time),
        temperature: this.arrayNumber(hourly['temperature_2m'], index),
        precipitationProbability: this.arrayNumber(hourly['precipitation_probability'], index),
        windGust: this.arrayNumber(hourly['wind_gusts_10m'], index),
        weatherCode: code,
        condition: this.weatherLabel(code),
        icon: this.weatherIcon(code)
      };
    }).filter(period => period.time);
  }

  private buildMarine(response?: OpenMeteoMarineResponse | null): NoronhaWeatherOverview['marine'] {
    if (!response?.current) return null;
    return {
      waveHeight: this.number(response.current['wave_height']),
      maximumWaveHeight: this.arrayNumber(response.daily?.['wave_height_max']),
      wavePeriod: this.number(response.current['wave_period']),
      swellHeight: this.number(response.current['swell_wave_height']),
      seaTemperature: response.current['sea_surface_temperature'] == null
        ? null
        : this.number(response.current['sea_surface_temperature'])
    };
  }

  private buildAlerts(input: {
    currentCode: number;
    currentPrecipitation: number;
    currentWindGust: number;
    nextHours: HourlyWeatherPeriod[];
    today: NoronhaWeatherOverview['today'];
    marine: NoronhaWeatherOverview['marine'];
  }): WeatherSafetyAlert[] {
    const alerts: WeatherSafetyAlert[] = [];
    const forecastCodes = [input.currentCode, ...input.nextHours.map(period => period.weatherCode)];
    const maximumGust = Math.max(input.currentWindGust, input.today.maximumWindGust, ...input.nextHours.map(period => period.windGust));
    const maximumRainChance = Math.max(input.today.precipitationProbability, ...input.nextHours.map(period => period.precipitationProbability));
    const stormExpected = forecastCodes.some(code => code >= 95);
    const heavyRainExpected = forecastCodes.some(code => [65, 67, 82, 86].includes(code))
      || input.currentPrecipitation >= 7.5
      || input.today.precipitationSum >= 20;

    if (stormExpected) {
      alerts.push({
        id: 'storm',
        level: 'danger',
        icon: 'pi pi-bolt',
        title: 'Risco de tempestade nas próximas horas',
        message: 'Adie mar, barco, mergulho e trilhas expostas. Procure abrigo seguro e acompanhe os avisos oficiais.',
        places: 'Evite Piquinho, Capim-Açu, costões, mirantes expostos e praias durante descargas elétricas.'
      });
    } else if (heavyRainExpected || (maximumRainChance >= 80 && input.today.precipitationSum >= 10)) {
      alerts.push({
        id: 'rain',
        level: 'warning',
        icon: 'pi pi-cloud',
        title: 'Chuva forte pode alterar o roteiro',
        message: 'Pisos, escadas e trilhas podem ficar escorregadios. Confirme acessos e reduza deslocamentos durante pancadas intensas.',
        places: 'Tenha atenção na escadaria do Sancho, trilhas, encostas, costões e vias com drenagem limitada.'
      });
    } else if (maximumRainChance >= 60) {
      alerts.push({
        id: 'rain-watch',
        level: 'attention',
        icon: 'pi pi-cloud',
        title: 'Há chance de pancadas hoje',
        message: 'Leve proteção para chuva e deixe atividades de mar ou trilhas com margem para mudança de horário.',
        places: 'Confira o céu e a sinalização antes de seguir para trilhas e praias mais isoladas.'
      });
    }

    if (maximumGust >= 70) {
      alerts.push({
        id: 'wind-danger',
        level: 'danger',
        icon: 'pi pi-flag',
        title: 'Rajadas muito fortes previstas',
        message: 'Passeios de barco e permanência em áreas elevadas ou expostas não são recomendados até a condição melhorar.',
        places: 'Evite mirantes, bordas de falésia, Piquinho, embarcações e estruturas leves.'
      });
    } else if (maximumGust >= 50) {
      alerts.push({
        id: 'wind',
        level: 'warning',
        icon: 'pi pi-flag',
        title: 'Vento forte exige atenção',
        message: 'Confirme saídas de barco e mergulho com o operador e mantenha distância segura de bordas e estruturas soltas.',
        places: 'Redobre o cuidado em mirantes, falésias, Porto de Santo Antônio e praias de mar aberto.'
      });
    }

    const waveHeight = Math.max(input.marine?.waveHeight || 0, input.marine?.maximumWaveHeight || 0);
    if (waveHeight >= 2.5) {
      alerts.push({
        id: 'waves',
        level: 'warning',
        icon: 'pi pi-wave-pulse',
        title: 'Mar agitado na previsão regional',
        message: 'Não entre no mar sem avaliação local. Passeios náuticos, mergulho e banho podem ser suspensos por segurança.',
        places: 'Evite costões e praias de mar aberto com bandeira, corrente ou orientação de restrição.'
      });
    } else if (waveHeight >= 1.8) {
      alerts.push({
        id: 'waves-watch',
        level: 'attention',
        icon: 'pi pi-wave-pulse',
        title: 'Ondas pedem cautela',
        message: 'A previsão marítima é regional. Observe bandeiras, correntes e siga as orientações dos guarda-vidas e operadores.',
        places: 'Tenha cuidado extra em costões e praias de mar aberto.'
      });
    }

    if (input.today.uvIndex >= 11) {
      alerts.push({
        id: 'uv-extreme',
        level: 'warning',
        icon: 'pi pi-sun',
        title: 'Radiação UV extrema hoje',
        message: 'Reduza exposição direta, use proteção solar, chapéu, hidratação e faça pausas frequentes à sombra.',
        places: 'Evite trilhas longas e praias sem sombra entre 10h e 15h.'
      });
    } else if (input.today.uvIndex >= 8) {
      alerts.push({
        id: 'uv',
        level: 'attention',
        icon: 'pi pi-sun',
        title: 'Índice UV muito alto',
        message: 'Proteja a pele, leve água e programe pausas à sombra para reduzir o risco de queimadura e insolação.',
        places: 'Prefira trilhas e caminhadas cedo; evite exposição prolongada entre 10h e 15h.'
      });
    }

    if (input.today.maximumApparentTemperature >= 36) {
      alerts.push({
        id: 'heat',
        level: 'warning',
        icon: 'pi pi-sun',
        title: 'Calor e sensação térmica elevados',
        message: 'Hidrate-se antes de sair, reduza esforço no meio do dia e procure atendimento se houver confusão, desmaio ou mal-estar intenso.',
        places: 'Adie Piquinho, Capim-Açu e caminhadas longas para o início da manhã ou fim da tarde.'
      });
    }

    if (!alerts.length) {
      alerts.push({
        id: 'routine',
        level: 'safe',
        icon: 'pi pi-check-circle',
        title: 'Sem sinal de tempo severo no momento',
        message: 'O roteiro pode seguir com os cuidados normais de sol, hidratação e confirmação das condições do mar.',
        places: 'Nenhuma restrição de local foi inferida; a sinalização e a orientação oficial continuam valendo.'
      });
    }

    return alerts.sort((a, b) => this.levelRank(b.level) - this.levelRank(a.level));
  }

  private highestLevel(alerts: WeatherSafetyAlert[]): WeatherSafetyLevel {
    return alerts.reduce<WeatherSafetyLevel>(
      (highest, alert) => this.levelRank(alert.level) > this.levelRank(highest) ? alert.level : highest,
      'safe'
    );
  }

  private statusLabel(level: WeatherSafetyLevel): string {
    return {
      safe: 'Condições favoráveis',
      attention: 'Atenção preventiva',
      warning: 'Atenção redobrada',
      danger: 'Risco elevado'
    }[level];
  }

  private levelRank(level: WeatherSafetyLevel): number {
    return { safe: 0, attention: 1, warning: 2, danger: 3 }[level];
  }

  private weatherLabel(code: number): string {
    if (code === 0) return 'Céu limpo';
    if ([1, 2].includes(code)) return 'Poucas nuvens';
    if (code === 3) return 'Nublado';
    if ([45, 48].includes(code)) return 'Névoa';
    if ([51, 53, 55, 56, 57].includes(code)) return 'Garoa';
    if ([61, 63, 66, 80, 81].includes(code)) return 'Chuva';
    if ([65, 67, 82].includes(code)) return 'Chuva forte';
    if (code >= 95) return 'Tempestade';
    return 'Tempo variável';
  }

  private weatherIcon(code: number): string {
    if (code === 0) return 'pi pi-sun';
    if ([1, 2].includes(code)) return 'pi pi-cloud';
    if (code === 3 || [45, 48].includes(code)) return 'pi pi-cloud';
    if (code >= 95) return 'pi pi-bolt';
    if (code >= 51) return 'pi pi-cloud';
    return 'pi pi-sun';
  }

  private hourLabel(value: string): string {
    return value.length >= 16 ? value.slice(11, 16) : value;
  }

  private number(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private arrayNumber(values: Array<number | string | null> | undefined, index = 0): number {
    return this.number(values?.[index]);
  }

  private text(value: unknown): string {
    return value == null ? '' : String(value);
  }
}

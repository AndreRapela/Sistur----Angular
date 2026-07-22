import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    google?: any;
    sisTurGoogleMapsLoaded?: () => void;
    SISTUR_CONFIG?: {
      googleMapsApiKey?: string;
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsLoaderService {
  private loadPromise?: Promise<any>;

  load(): Promise<any> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return Promise.reject(new Error('Google Maps indisponível fora do navegador.'));
    }

    const apiKey = window.SISTUR_CONFIG?.googleMapsApiKey?.trim()
      || environment.googleMapsApiKey?.trim();
    if (!apiKey) {
      return Promise.reject(new Error('Chave do Google Maps não configurada.'));
    }

    if (window.google?.maps) {
      return Promise.resolve(window.google);
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        this.loadPromise = undefined;
        reject(new Error('Tempo limite ao carregar Google Maps.'));
      }, 4500);

      window.sisTurGoogleMapsLoaded = () => {
        window.clearTimeout(timeoutId);
        resolve(window.google);
      };

      const existingScript = document.querySelector<HTMLScriptElement>('script[data-sistur-google-maps]');
      if (existingScript) {
        existingScript.addEventListener('error', () => reject(new Error('Falha ao carregar Google Maps.')));
        return;
      }

      const params = new URLSearchParams({
        key: apiKey,
        v: 'weekly',
        language: 'pt-BR',
        region: 'BR',
        loading: 'async',
        callback: 'sisTurGoogleMapsLoaded'
      });

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      script.async = true;
      script.defer = true;
      script.setAttribute('data-sistur-google-maps', 'true');
      script.onerror = () => {
        window.clearTimeout(timeoutId);
        this.loadPromise = undefined;
        reject(new Error('Falha ao carregar Google Maps.'));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }
}

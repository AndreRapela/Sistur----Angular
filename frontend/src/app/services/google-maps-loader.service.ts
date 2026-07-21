import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    google?: any;
    sisTurGoogleMapsLoaded?: () => void;
  }
}

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsLoaderService {
  private loadPromise?: Promise<any>;

  isConfigured(): boolean {
    return Boolean(environment.googleMapsApiKey?.trim());
  }

  load(): Promise<any> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return Promise.reject(new Error('Google Maps indisponível fora do navegador.'));
    }

    const apiKey = environment.googleMapsApiKey?.trim();
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
      window.sisTurGoogleMapsLoaded = () => resolve(window.google);

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
        libraries: 'places,geometry',
        callback: 'sisTurGoogleMapsLoaded'
      });

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      script.async = true;
      script.defer = true;
      script.setAttribute('data-sistur-google-maps', 'true');
      script.onerror = () => {
        this.loadPromise = undefined;
        reject(new Error('Falha ao carregar Google Maps.'));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }
}

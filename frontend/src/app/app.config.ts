import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { errorInterceptor } from './interceptors/error.interceptor';
import { authInterceptor } from './interceptors/auth.interceptor';
import { cacheInterceptor } from './interceptors/cache.interceptor';

function optimizedImageLoader(config: ImageLoaderConfig): string {
  if (!config.src) {
    return config.src;
  }

  if (config.src.startsWith('data:') || config.src.startsWith('blob:')) {
    return config.src;
  }

  let url: URL;

  try {
    url = new URL(config.src);
  } catch {
    return config.src;
  }

  if (url.hostname !== 'images.unsplash.com') {
    return config.src;
  }

  if (config.width) {
    url.searchParams.set('w', String(config.width));
  }

  if (config.height) {
    url.searchParams.set('h', String(config.height));
  }

  const loaderParams = (config.loaderParams ?? {}) as { quality?: number; fit?: string };
  url.searchParams.set('auto', 'format');
  url.searchParams.set('fit', loaderParams.fit || 'crop');
  url.searchParams.set('q', String(loaderParams.quality ?? 75));

  return url.toString();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([errorInterceptor, authInterceptor, cacheInterceptor])),
    provideAnimationsAsync(),
    { provide: IMAGE_LOADER, useValue: optimizedImageLoader }
  ]
};

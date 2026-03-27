import { HttpInterceptorFn } from '@angular/common/http';
import { HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs/operators';

// Simple in-memory cache for GET requests
const cache = new Map<string, { data: HttpResponse<any>; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next(req);
  }

  // Don't cache authentication endpoints
  if (req.url.includes('/api/auth') || req.url.includes('/login') || req.url.includes('/register')) {
    return next(req);
  }

  const cachedResponse = cache.get(req.url);

  // Return cached response if still valid
  if (cachedResponse) {
    const now = Date.now();
    if (now - cachedResponse.timestamp < CACHE_DURATION) {
      return next(req).pipe(
        tap(response => {
          if (response instanceof HttpResponse) {
            cache.set(req.url, { data: response.clone(), timestamp: now });
          }
        })
      );
    } else {
      // Cache expired, remove it
      cache.delete(req.url);
    }
  }

  return next(req).pipe(
    tap(response => {
      if (response instanceof HttpResponse) {
        cache.set(req.url, { data: response.clone(), timestamp: Date.now() });
      }
    })
  );
};

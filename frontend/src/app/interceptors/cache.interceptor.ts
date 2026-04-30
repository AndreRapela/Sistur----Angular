import { HttpInterceptorFn } from '@angular/common/http';
import { HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';

// Simple in-memory cache for GET requests
const cache = new Map<string, { data: HttpResponse<any>; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_ENTRIES = 100;

const shouldSkipCache = (url: string) =>
  url.includes('/api/auth') ||
  url.includes('/login') ||
  url.includes('/register') ||
  url.includes('/api/analytics') ||
  url.includes('/api/admin/stats') ||
  url.includes('/reviews');

const evictOldestEntry = () => {
  if (cache.size < MAX_CACHE_ENTRIES) {
    return;
  }

  let oldestKey: string | undefined;
  let oldestTimestamp = Number.POSITIVE_INFINITY;

  for (const [key, value] of cache.entries()) {
    if (value.timestamp < oldestTimestamp) {
      oldestTimestamp = value.timestamp;
      oldestKey = key;
    }
  }

  if (oldestKey) {
    cache.delete(oldestKey);
  }
};

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  // Only cache GET requests
  if (req.method !== 'GET' || shouldSkipCache(req.url)) {
    return next(req);
  }

  const authKey = req.headers.get('Authorization') ?? 'public';
  const cacheKey = `${authKey}::${req.urlWithParams}`;
  const cachedResponse = cache.get(cacheKey);

  // Return cached response if still valid
  if (cachedResponse) {
    const now = Date.now();
    if (now - cachedResponse.timestamp < CACHE_DURATION) {
      return of(cachedResponse.data.clone());
    } else {
      // Cache expired, remove it
      cache.delete(cacheKey);
    }
  }

  return next(req).pipe(
    tap(response => {
      if (response instanceof HttpResponse) {
        evictOldestEntry();
        cache.set(cacheKey, { data: response.clone(), timestamp: Date.now() });
      }
    })
  );
};

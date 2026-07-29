import { HttpInterceptorFn } from '@angular/common/http';
import { HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { finalize, shareReplay, tap } from 'rxjs/operators';

const cache = new Map<string, { data: HttpResponse<any>; timestamp: number }>();
const pendingRequests = new Map<string, Observable<any>>();
const DEFAULT_CACHE_DURATION = 3 * 60 * 1000;
const MAX_CACHE_ENTRIES = 100;

const shouldSkipCache = (url: string) =>
  url.includes('/api/auth') ||
  url.includes('/login') ||
  url.includes('/register') ||
  url.includes('/api/analytics') ||
  url.includes('/api/admin/stats') ||
  url.includes('/reviews');

const isAnalyticsRequest = (url: string) => url.includes('/api/analytics');

const cacheDurationFor = (url: string) => {
  if (url.includes('/gamification/badges')) return 15 * 60 * 1000;
  if (url.includes('/tourist-points') || url.includes('/tours') || url.includes('/events') || url.includes('/establishments')) return 5 * 60 * 1000;
  if (url.includes('/itineraries/feed')) return 60 * 1000;
  return DEFAULT_CACHE_DURATION;
};

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
  if (req.method !== 'GET') {
    if (!isAnalyticsRequest(req.url)) {
      cache.clear();
      pendingRequests.clear();
    }

    return next(req);
  }

  if (shouldSkipCache(req.url)) {
    return next(req);
  }

  const authKey = req.headers.get('Authorization') ?? 'public';
  const cacheKey = `${authKey}::${req.urlWithParams}`;
  const cachedResponse = cache.get(cacheKey);
  const now = Date.now();

  if (cachedResponse) {
    if (now - cachedResponse.timestamp < cacheDurationFor(req.url)) {
      return of(cachedResponse.data.clone());
    }

    cache.delete(cacheKey);
  }

  const pending = pendingRequests.get(cacheKey);
  if (pending) {
    return pending;
  }

  const request$ = next(req).pipe(
    tap(response => {
      if (response instanceof HttpResponse) {
        evictOldestEntry();
        cache.set(cacheKey, { data: response.clone(), timestamp: Date.now() });
      }
    }),
    finalize(() => pendingRequests.delete(cacheKey)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  pendingRequests.set(cacheKey, request$);
  return request$;
};

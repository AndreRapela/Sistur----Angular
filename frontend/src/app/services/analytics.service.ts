import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { TrackEventRequest } from '../models/tourism.models';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private endpoint = `${environment.apiUrl}/analytics/track`;

  track(event: TrackEventRequest) {
    const payload = {
      targetType: event.targetType,
      targetId: event.targetId ?? null,
      targetLabel: event.targetLabel ?? null,
      actionType: event.actionType || 'VIEW',
      pagePath: event.pagePath || this.currentPath(),
      referrer: event.referrer || (typeof document !== 'undefined' ? document.referrer : undefined)
    };

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(this.endpoint, new Blob([JSON.stringify(payload)], { type: 'application/json' }));
      return;
    }

    this.http.post(this.endpoint, payload).subscribe({ error: () => undefined });
  }

  pageView(pagePath: string, targetType: string = 'PAGE', targetId: number | string | null = null) {
    this.track({ targetType, targetId, actionType: 'VIEW', pagePath });
  }

  conversion(targetType: string, actionType: string, targetId: number | string | null, pagePath?: string) {
    this.track({ targetType, targetId, actionType, pagePath });
  }

  googleServiceClick(targetType: string, targetId: number | string | null, targetLabel: string, pagePath?: string) {
    this.track({ targetType, targetId, targetLabel, actionType: 'GOOGLE_SERVICE_CLICK', pagePath });
  }

  googleCategoryClick(category: string, targetLabel: string, pagePath?: string) {
    this.track({ targetType: `CATEGORY_${category}`, targetId: null, targetLabel, actionType: 'GOOGLE_CATEGORY_CLICK', pagePath });
  }

  private currentPath(): string | undefined {
    if (typeof window === 'undefined') {
      return undefined;
    }

    return `${window.location.pathname}${window.location.search}`;
  }
}

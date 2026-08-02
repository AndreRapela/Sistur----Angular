import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
  downlink?: number;
}

@Injectable({ providedIn: 'root' })
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (!route.data?.['preload'] || this.shouldRespectLowBandwidth()) {
      return of(null);
    }

    const delay = Number(route.data['preloadDelay'] ?? 1200);
    return timer(delay).pipe(mergeMap(() => load()));
  }

  private shouldRespectLowBandwidth(): boolean {
    if (typeof navigator === 'undefined') {
      return false;
    }

    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    return Boolean(
      connection?.saveData
      || ['slow-2g', '2g', '3g'].includes(connection?.effectiveType || '')
      || (typeof connection?.downlink === 'number' && connection.downlink < 2)
    );
  }
}

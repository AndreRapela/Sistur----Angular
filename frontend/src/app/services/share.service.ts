import { inject, Injectable } from '@angular/core';
import { openExternalLink } from '../utils/external-link';
import { RuntimeConfigService } from './runtime-config.service';

export interface ShareableItinerary {
  name?: string;
  title?: string;
  shareToken?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ShareService {
  private readonly runtime = inject(RuntimeConfigService);

  shareWhatsApp(itinerary: ShareableItinerary): boolean {
    const url = this.shareUrl(itinerary);
    if (!url) return false;
    const text = `Vem comigo para Noronha! ${this.itineraryName(itinerary)} - ${url}`;
    openExternalLink('https://api.whatsapp.com/send?text=' + encodeURIComponent(text));
    return true;
  }

  shareTwitter(itinerary: ShareableItinerary): boolean {
    const url = this.shareUrl(itinerary);
    if (!url) return false;
    const text = `Vem comigo para Noronha! ${this.itineraryName(itinerary)}`;
    openExternalLink('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url));
    return true;
  }

  async copyLink(itinerary: ShareableItinerary): Promise<boolean> {
    const url = this.shareUrl(itinerary);
    if (!url || !navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(url);
    return true;
  }

  private shareUrl(itinerary: ShareableItinerary): string | null {
    const token = itinerary.shareToken?.trim();
    if (!token) return null;
    const baseUrl = (this.runtime.publicAppUrl || window.location.origin).replace(/\/$/, '');
    return `${baseUrl}/itinerary-shared/${encodeURIComponent(token)}`;
  }

  private itineraryName(itinerary: ShareableItinerary): string {
    return itinerary.name?.trim() || itinerary.title?.trim() || 'Meu roteiro';
  }
}

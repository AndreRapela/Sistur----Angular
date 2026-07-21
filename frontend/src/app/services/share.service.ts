import { Injectable } from '@angular/core';
import { openExternalLink } from '../utils/external-link';

@Injectable({ providedIn: 'root' })
export class ShareService {
  shareWhatsApp(itinerary: any) {
    const url = window.location.origin + '/itinerary-shared/' + (itinerary.shareToken || itinerary.id);
    const text = `Vem comigo para Noronha! ${itinerary.title} - ${url}`;
    openExternalLink('https://api.whatsapp.com/send?text=' + encodeURIComponent(text));
  }

  shareTwitter(itinerary: any) {
     const url = window.location.origin + '/itinerary-shared/' + (itinerary.shareToken || itinerary.id);
     const text = `Vem comigo para Noronha! ${itinerary.title}`;
     openExternalLink('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url));
  }

  async copyLink(itinerary: any): Promise<boolean> {
    const url = window.location.origin + '/itinerary-shared/' + (itinerary.shareToken || itinerary.id);
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }
    return false;
  }
}

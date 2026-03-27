import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ShareService {
  shareWhatsApp(itinerary: any) {
    const url = window.location.origin + '/itinerary-shared/' + itinerary.id;
    const text = `Vem comigo para Noronha! ${itinerary.title} - ${url}`;
    window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(text), '_blank');
  }

  shareTwitter(itinerary: any) {
     const url = window.location.origin + '/itinerary-shared/' + itinerary.id;
     const text = `Vem comigo para Noronha! ${itinerary.title}`;
     window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url), '_blank');
  }

  copyLink(itinerary: any): boolean {
    const url = window.location.origin + '/itinerary-shared/' + itinerary.id;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      return true;
    }
    return false;
  }
}

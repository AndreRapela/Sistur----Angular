import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  readonly apiUrl = this.value('apiUrl');
  readonly supportEmail = this.value('supportEmail');
  readonly supportPhone = this.value('supportPhone');
  readonly supportWhatsapp = this.value('supportWhatsapp').replace(/\D/g, '');
  readonly publicAppUrl = this.value('publicAppUrl');

  get hasSupportChannel(): boolean {
    return Boolean(this.supportEmail || this.supportPhone || this.supportWhatsapp);
  }

  mailto(subject: string, body: string): string | null {
    if (!this.supportEmail) return null;
    return `mailto:${this.supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  whatsapp(message: string): string | null {
    if (!this.supportWhatsapp) return null;
    return `https://wa.me/${this.supportWhatsapp}?text=${encodeURIComponent(message)}`;
  }

  private value(key: keyof NonNullable<Window['SISTUR_CONFIG']>): string {
    if (typeof window === 'undefined') return '';
    return String(window.SISTUR_CONFIG?.[key] || '').trim();
  }
}

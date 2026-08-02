import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { RuntimeConfigService } from './runtime-config.service';
import { ShareService } from './share.service';

describe('ShareService', () => {
  beforeEach(() => {
    window.SISTUR_CONFIG = {
      publicAppUrl: 'https://app.sistur.example/',
      supportWhatsapp: '+55 (81) 99999-0000'
    };
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    window.SISTUR_CONFIG = {};
  });

  it('copies only token-based public links', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText }
    });

    const service = TestBed.inject(ShareService);
    const copied = await service.copyLink({ name: 'Meu Noronha', shareToken: 'public-token' });

    expect(copied).toBe(true);
    expect(writeText).toHaveBeenCalledWith('https://app.sistur.example/itinerary-shared/public-token');
  });

  it('does not fall back to a numeric itinerary id', async () => {
    const service = TestBed.inject(ShareService);

    expect(await service.copyLink({ name: 'Privado' })).toBe(false);
  });

  it('normalizes the configured WhatsApp number', () => {
    const runtime = TestBed.inject(RuntimeConfigService);

    expect(runtime.supportWhatsapp).toBe('5581999990000');
  });
});

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-culture',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container p-4 container-fluid">
      <header class="page-header mb-5 text-center">
        <h1 class="premium-title">Cultura e História</h1>
        <div class="header-divider mx-auto"></div>
        <p class="text-muted mt-3">Mergulhe nas raízes históricos do arquipélago</p>
      </header>

      <section class="mb-5">
        <div class="history-hero p-5 shadow-2xl overflow-hidden position-relative">
          <div class="hero-content">
            <h2 class="hero-title">Nossa Origem</h2>
            <p class="hero-text">Fernando de Noronha foi descoberto em 1503 por Américo Vespúcio. A ilha já testemunhou séculos de história, servindo como presídio nacional e base militar estratégica na 2ª Guerra, antes de se tornar este paraíso protegido pela UNESCO.</p>
          </div>
          <div class="hero-overlay"></div>
        </div>
      </section>

      <section class="curiosities row g-4">
        <div class="col-12"><h3 class="section-label">Você sabia?</h3></div>
        
        <div class="col-12 col-md-6">
          <div class="noronha-card p-4 d-flex align-items-center hover-lift border-0 shadow-sm">
            <div class="icon-avatar bg-blue-50 mr-4">
              <i class="pi pi-info-circle text-primary"></i>
            </div>
            <span class="font-medium text-gray-700">Noronha possui a menor rodovia federal do Brasil, a BR-363, com apenas 7km de extensão.</span>
          </div>
        </div>
        
        <div class="col-12 col-md-6">
          <div class="noronha-card p-4 d-flex align-items-center hover-lift border-0 shadow-sm">
            <div class="icon-avatar bg-emerald-50 mr-4">
              <i class="pi pi-map text-emerald-500"></i>
            </div>
            <span class="font-medium text-gray-700">A Vila dos Remédios é o centro histórico onde o tempo parece passar mais devagar entre as ruínas e o casario.</span>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .premium-title { font-weight: 950; font-size: 36px; color: var(--text-main); letter-spacing: -2px; }
    .header-divider { width: 60px; height: 6px; background: var(--cta); margin-top: 10px; border-radius: 10px; }
    .history-hero { 
        background-image: url('https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f');
        background-size: cover; background-position: center; border-radius: 32px; min-height: 300px;
        display: flex; align-items: center;
    }
    .hero-content { position: relative; z-index: 2; max-width: 600px; color: white; }
    .hero-title { font-weight: 950; font-size: 42px; margin-bottom: 20px; text-shadow: 0 2px 10px rgba(0,0,0,0.3); }
    .hero-text { font-size: 18px; line-height: 1.6; font-weight: 500; text-shadow: 0 1px 5px rgba(0,0,0,0.3); }
    .hero-overlay { position: absolute; inset:0; background: linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 100%); z-index: 1; }
    .section-label { font-weight: 800; font-size: 22px; color: var(--text-main); }
    .icon-avatar { width: 55px; height: 55px; border-radius: 16px; display: flex; align-items: center; justify-content: center; i { font-size: 24px; } }
    .mr-4 { margin-right: 1.5rem; }
    .hover-lift { transition: all 0.3s; &:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.1) !important; } }
    .bg-emerald-50 { background: #ecfdf5; }
  `]
})
export class CultureComponent {}

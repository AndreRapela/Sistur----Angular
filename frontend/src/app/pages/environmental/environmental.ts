import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-environmental',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container p-4 container-fluid">
      <header class="page-header mb-5">
        <h1 class="premium-title">Preservação Ambiental</h1>
        <p class="premium-subtitle"><i class="pi pi-leaf mr-2 text-success"></i> Aprenda a cuidar do paraíso de forma sustentável</p>
      </header>

      <div class="row g-4">
        <div class="col-12 col-md-4">
          <div class="info-card h-100 hover-lift border-left-success">
            <div class="icon-circle mb-4 bg-success-light">
              <i class="pi pi-shield text-success"></i>
            </div>
            <h3 class="card-headline">Regras do Parque</h3>
            <p class="card-text">Fernando de Noronha é um Santuário Ecológico. Respeite as demarcações, nunca alimente os animais e siga as orientações dos guias credenciados.</p>
          </div>
        </div>

        <div class="col-12 col-md-4">
          <div class="info-card h-100 hover-lift border-left-primary">
            <div class="icon-circle mb-4 bg-primary-light">
              <i class="pi pi-water text-primary"></i>
            </div>
            <h3 class="card-headline">Vida Marinha</h3>
            <p class="card-text">Participe das palestras do Projeto TAMAR para aprender sobre a desova das tartarugas e observe o espetáculo matinal dos golfinhos rotadores no mirante.</p>
          </div>
        </div>

        <div class="col-12 col-md-4">
          <div class="info-card h-100 hover-lift border-left-warning">
            <div class="icon-circle mb-4 bg-warning-light">
              <i class="pi pi-map-marker text-warning"></i>
            </div>
            <h3 class="card-headline">Trilhas Monitoradas</h3>
            <p class="card-text">Muitas trilhas exigem agendamento prévio no ICMBio. Planeje seu roteiro com antecedência e garanta sua vaga nos horários de maré baixa.</p>
          </div>
        </div>
      </div>

      <div class="noronha-gradient mt-5 p-5 rounded-3xl text-white shadow-xl">
        <h2 class="font-black text-3xl mb-3">Sua Atitude Importa</h2>
        <p class="opacity-90 font-medium max-w-2xl">Lembre-se: em Fernando de Noronha, nada se leva além de fotos, nada se deixa além de pegadas, nada se mata além do tempo e nada se queima além do sol.</p>
      </div>
    </div>
  `,
  styles: [`
    .premium-title { font-weight: 950; font-size: 34px; color: var(--text-main); letter-spacing: -1.5px; margin: 0; }
    .premium-subtitle { font-size: 16px; color: #64748b; font-weight: 500; margin-top: 5px; }
    .info-card { background: white; border-radius: 24px; padding: 35px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
    .icon-circle { width: 60px; height: 60px; border-radius: 18px; display: flex; align-items: center; justify-content: center; i { font-size: 24px; } }
    .bg-success-light { background: #ecfdf5; }
    .bg-primary-light { background: #f0f9ff; }
    .bg-warning-light { background: #fffbeb; }
    .border-left-success { border-left: 6px solid var(--secondary); }
    .border-left-primary { border-left: 6px solid var(--primary); }
    .border-left-warning { border-left: 6px solid #fbbf24; }
    .card-headline { font-weight: 800; color: var(--text-main); font-size: 22px; margin-bottom: 12px; }
    .card-text { color: #64748b; line-height: 1.6; font-size: 15px; }
    .hover-lift { transition: transform 0.3s ease, box-shadow 0.3s ease; }
    .hover-lift:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
    .rounded-3xl { border-radius: 32px; }
    .max-w-2xl { max-width: 670px; }
  `]
})
export class EnvironmentalComponent {}

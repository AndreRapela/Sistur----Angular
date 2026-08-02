import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

type ParkVisitor = 'BRAZIL' | 'GENERAL';

@Component({
  selector: 'app-travel-essentials',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './travel-essentials.html',
  styleUrl: './travel-essentials.css'
})
export class TravelEssentialsComponent {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  readonly verifiedAt = '29/07/2026';
  readonly days = signal(5);
  readonly includePark = signal(true);
  readonly parkVisitor = signal<ParkVisitor>('BRAZIL');

  private readonly tpaByDays = [
    0, 105.79, 211.59, 317.38, 423.17, 520.50, 596.68, 672.85, 749.02, 825.19,
    901.36, 1028.31, 1176.42, 1345.69, 1536.12, 1747.71, 1980.45, 2234.36,
    2509.42, 2805.64, 3123.02, 3461.56, 3821.26, 4202.12, 4604.13, 5027.31,
    5471.64, 5937.13, 6423.78, 6931.59, 7460.56
  ];

  readonly tpaTotal = computed(() => this.tpaByDays[this.days()]);
  readonly parkPrice = computed(() => this.parkVisitor() === 'BRAZIL' ? 192 : 384);
  readonly estimatedTotal = computed(() => this.tpaTotal() + (this.includePark() ? this.parkPrice() : 0));

  constructor() {
    this.title.setTitle('Antes de viajar | Taxas e regras de Noronha | SisTur');
    this.meta.updateTag({
      name: 'description',
      content: 'Calcule a TPA de Fernando de Noronha e confira ingresso do parque, agendamentos e preparativos para a viagem.'
    });
  }

  changeDays(delta: number): void {
    this.days.set(Math.min(30, Math.max(1, this.days() + delta)));
  }

  setDays(value: string): void {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) this.days.set(Math.min(30, Math.max(1, Math.round(parsed))));
  }

  setParkVisitor(value: ParkVisitor): void {
    this.parkVisitor.set(value);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
}

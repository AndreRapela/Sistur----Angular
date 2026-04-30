import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { AnalyticsService } from '../../services/analytics.service';
import { AdminStatsDTO } from '../../models/tourism.models';

type DashboardStat = {
  label: string;
  value: string;
  trend: number;
  icon: string;
  iconColor: string;
  bgColor: string;
};

type DashboardActivity = {
  id: number;
  user: string;
  action: string;
  target: string;
  time: string;
};

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  private api = inject(ApiService);
  private analytics = inject(AnalyticsService);
  private cdr = inject(ChangeDetectorRef);

  stats: DashboardStat[] = [
    { label: 'Turistas cadastrados', value: '0', trend: 0, icon: 'pi-users', iconColor: 'text-primary', bgColor: 'bg-primary/10' },
    { label: 'Ativos 30 dias', value: '0', trend: 0, icon: 'pi-clock', iconColor: 'text-secondary', bgColor: 'bg-secondary/10' },
    { label: 'Cadastros 30 dias', value: '0', trend: 0, icon: 'pi-user-plus', iconColor: 'text-cta', bgColor: 'bg-cta/10' },
    { label: 'Requisições', value: '0', trend: 0, icon: 'pi-chart-line', iconColor: 'text-nature', bgColor: 'bg-nature/10' },
    { label: 'Conversões', value: '0', trend: 0, icon: 'pi-bolt', iconColor: 'text-amber-600', bgColor: 'bg-amber-50' }
  ];

  activities: DashboardActivity[] = [
    { id: 1, user: 'Noronha', action: 'aguarda dados reais de uso', target: 'carregando métricas', time: 'Agora' }
  ];

  constructor(public auth: AuthService) {}

  ngOnInit() {
    this.analytics.pageView('/admin/dashboard', 'PAGE', 'admin-dashboard');
    this.loadStats();
  }

  private loadStats() {
    this.api.getAdminStats().subscribe({
      next: ({ data }) => {
        if (!data) {
          return;
        }

        this.stats = [
          {
            label: 'Turistas cadastrados',
            value: this.formatNumber(data.totalUsers),
            trend: this.safeTrend(data.activeUsersLast30Days, data.totalUsers),
            icon: 'pi-users',
            iconColor: 'text-primary',
            bgColor: 'bg-primary/10'
          },
          {
            label: 'Ativos 30 dias',
            value: this.formatNumber(data.activeUsersLast30Days),
            trend: this.safeTrend(data.activeUsersLast30Days, data.totalUsers),
            icon: 'pi-clock',
            iconColor: 'text-secondary',
            bgColor: 'bg-secondary/10'
          },
          {
            label: 'Cadastros 30 dias',
            value: this.formatNumber(data.registrationsLast30Days),
            trend: this.safeTrend(data.registrationsLast30Days, data.totalUsers),
            icon: 'pi-user-plus',
            iconColor: 'text-cta',
            bgColor: 'bg-cta/10'
          },
          {
            label: 'Requisições',
            value: this.formatNumber(data.totalRequests),
            trend: this.safeTrend(data.totalRequests, data.totalUsers),
            icon: 'pi-chart-line',
            iconColor: 'text-nature',
            bgColor: 'bg-nature/10'
          },
          {
            label: 'Conversões',
            value: this.formatNumber(data.totalConversions),
            trend: this.safeTrend(data.totalConversions, data.totalRequests || 1),
            icon: 'pi-bolt',
            iconColor: 'text-amber-600',
            bgColor: 'bg-amber-50'
          }
        ];

        this.activities = this.buildActivities(data);
        this.cdr.markForCheck();
      },
      error: () => this.cdr.markForCheck()
    });
  }

  private buildActivities(stats: AdminStatsDTO): DashboardActivity[] {
    const accessItems = Object.entries(stats.accessByEstablishment || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([target, count], index) => ({
        id: index + 1,
        user: target,
        action: 'recebeu',
        target: `${this.formatNumber(count)} acessos`,
        time: 'Últimos 30 dias'
      }));

    const conversionItems = Object.entries(stats.conversionByEstablishment || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([target, count], index) => ({
        id: index + 101,
        user: target,
        action: 'gerou',
        target: `${this.formatNumber(count)} conversões`,
        time: 'Últimos 30 dias'
      }));

    return [...accessItems, ...conversionItems].slice(0, 6);
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('pt-BR').format(value ?? 0);
  }

  private safeTrend(value: number, baseline: number): number {
    if (!baseline) {
      return 0;
    }

    return Math.max(1, Math.min(99, Math.round((value / baseline) * 100)));
  }
}

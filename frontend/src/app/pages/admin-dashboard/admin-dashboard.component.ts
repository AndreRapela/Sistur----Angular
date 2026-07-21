import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { AnalyticsService } from '../../services/analytics.service';
import { AdminAnalyticsDTO, AdminDailyMetricDTO, AdminMetricEntryDTO, AdminStatsDTO } from '../../models/tourism.models';

type DashboardStat = {
  label: string;
  value: string;
  helper: string;
  icon: string;
  tone: string;
  bg: string;
};

type FunnelRow = {
  label: string;
  value: number;
  icon: string;
  tone: string;
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

  stats: DashboardStat[] = [];
  categoryDemand: AdminMetricEntryDTO[] = [];
  conversionByCategory: AdminMetricEntryDTO[] = [];
  topGoogleServiceClicks: AdminMetricEntryDTO[] = [];
  topViewedItems: AdminMetricEntryDTO[] = [];
  dailyRegistrations: AdminDailyMetricDTO[] = [];
  dailyGoogleClicks: AdminDailyMetricDTO[] = [];
  dailyRequests: AdminDailyMetricDTO[] = [];
  funnel: FunnelRow[] = [];

  loading = true;
  errorMessage = '';
  requestsLast30Days = 0;
  conversionsLast30Days = 0;
  conversionRate = 0;
  googleConversionRate = 0;
  Math = Math;

  constructor(public auth: AuthService) {}

  ngOnInit() {
    this.analytics.pageView('/admin/dashboard', 'PAGE', 'admin-dashboard');
    this.loadStats();
  }

  formatNumber(value: number | null | undefined): string {
    return new Intl.NumberFormat('pt-BR').format(value ?? 0);
  }

  formatPercent(value: number | null | undefined): string {
    return `${(value ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  }

  maxValue(items: Array<{ value: number }>): number {
    return Math.max(1, ...items.map(item => item.value || 0));
  }

  barWidth(value: number, max: number): string {
    if (!value || max <= 0) {
      return '0%';
    }

    return `${Math.max(8, Math.round((value / max) * 100))}%`;
  }

  dailyHeight(value: number, max: number): string {
    if (!value || max <= 0) {
      return '4px';
    }

    return `${Math.max(10, Math.round((value / max) * 100))}%`;
  }

  dailyLabel(date: string): string {
    const parts = date.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : date;
  }

  private loadStats() {
    this.loading = true;
    this.errorMessage = '';

    this.api.getAdminAnalytics().subscribe({
      next: ({ data }) => {
        if (data) {
          this.applyOverview(data);
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => this.loadLegacyStats()
    });
  }

  private loadLegacyStats() {
    this.api.getAdminStats().subscribe({
      next: ({ data }) => {
        if (data) {
          this.applyLegacyStats(data);
        }
        this.loading = false;
        this.errorMessage = 'Resumo analítico avançado indisponível; exibindo métricas básicas.';
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Não foi possível carregar as métricas administrativas.';
        this.cdr.markForCheck();
      }
    });
  }

  private applyOverview(data: AdminAnalyticsDTO) {
    this.requestsLast30Days = data.requestsLast30Days;
    this.conversionsLast30Days = data.conversionsLast30Days;
    this.conversionRate = data.conversionRate;
    this.googleConversionRate = data.googleConversionRate;
    this.categoryDemand = data.categoryDemand || [];
    this.conversionByCategory = data.conversionByCategory || [];
    this.topGoogleServiceClicks = data.topGoogleServiceClicks || [];
    this.topViewedItems = data.topViewedItems || [];
    this.dailyRegistrations = data.dailyRegistrations || [];
    this.dailyGoogleClicks = data.dailyGoogleClicks || [];
    this.dailyRequests = data.dailyRequests || [];

    this.stats = [
      {
        label: 'Usuários cadastrados',
        value: this.formatNumber(data.totalUsers),
        helper: `${this.formatNumber(data.registrationsLast30Days)} novos em 30 dias`,
        icon: 'pi-users',
        tone: 'text-blue-600',
        bg: 'bg-blue-50'
      },
      {
        label: 'Ativos 30 dias',
        value: this.formatNumber(data.activeUsersLast30Days),
        helper: `${this.formatNumber(data.requestsLast30Days)} interações recentes`,
        icon: 'pi-clock',
        tone: 'text-emerald-600',
        bg: 'bg-emerald-50'
      },
      {
        label: 'Cliques Google',
        value: this.formatNumber(data.googleServiceClicks + data.googleCategoryClicks),
        helper: `${this.formatPercent(data.googleConversionRate)} das interações`,
        icon: 'pi-google',
        tone: 'text-red-600',
        bg: 'bg-red-50'
      },
      {
        label: 'Conversões',
        value: this.formatNumber(data.conversionsLast30Days),
        helper: `${this.formatPercent(data.conversionRate)} nos últimos 30 dias`,
        icon: 'pi-bolt',
        tone: 'text-amber-600',
        bg: 'bg-amber-50'
      }
    ];

    this.funnel = [
      { label: 'Visualizações', value: data.funnel?.['Visualizacoes'] || 0, icon: 'pi-eye', tone: 'text-slate-600' },
      { label: 'Detalhes abertos', value: data.funnel?.['Aberturas de detalhe'] || 0, icon: 'pi-arrow-right', tone: 'text-blue-600' },
      { label: 'Salvos no roteiro', value: data.funnel?.['Salvos no roteiro'] || 0, icon: 'pi-calendar-plus', tone: 'text-emerald-600' },
      { label: 'Google serviços', value: (data.googleServiceClicks || 0) + (data.googleCategoryClicks || 0), icon: 'pi-external-link', tone: 'text-red-600' }
    ];
  }

  private applyLegacyStats(data: AdminStatsDTO) {
    this.requestsLast30Days = data.totalRequests;
    this.conversionsLast30Days = data.totalConversions;
    this.conversionRate = this.safeRate(data.totalConversions, data.totalRequests);
    this.googleConversionRate = 0;
    this.categoryDemand = [];
    this.conversionByCategory = [];
    this.topGoogleServiceClicks = [];
    this.topViewedItems = Object.entries(data.accessByEstablishment || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value]) => ({ key: label, label, value, rate: this.safeRate(value, data.totalRequests) }));
    this.dailyRegistrations = [];
    this.dailyGoogleClicks = [];
    this.dailyRequests = [];

    this.stats = [
      { label: 'Usuários cadastrados', value: this.formatNumber(data.totalUsers), helper: 'base total', icon: 'pi-users', tone: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Ativos 30 dias', value: this.formatNumber(data.activeUsersLast30Days), helper: 'usuários com atividade', icon: 'pi-clock', tone: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Requisições', value: this.formatNumber(data.totalRequests), helper: 'eventos registrados', icon: 'pi-chart-line', tone: 'text-slate-600', bg: 'bg-slate-100' },
      { label: 'Conversões', value: this.formatNumber(data.totalConversions), helper: this.formatPercent(this.conversionRate), icon: 'pi-bolt', tone: 'text-amber-600', bg: 'bg-amber-50' }
    ];

    this.funnel = [
      { label: 'Visualizações', value: data.totalRequests, icon: 'pi-eye', tone: 'text-slate-600' },
      { label: 'Conversões', value: data.totalConversions, icon: 'pi-bolt', tone: 'text-amber-600' }
    ];
  }

  private safeRate(value: number, total: number): number {
    if (!total) {
      return 0;
    }

    return Math.round((value * 10000) / total) / 100;
  }
}

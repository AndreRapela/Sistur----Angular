import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NoronhaWeatherOverview,
  NoronhaWeatherService
} from '../../services/noronha-weather.service';

@Component({
  selector: 'app-weather-safety',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weather-safety.html',
  styleUrl: './weather-safety.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeatherSafetyComponent implements OnInit {
  private readonly weather = inject(NoronhaWeatherService);
  private readonly destroyRef = inject(DestroyRef);

  readonly overview = signal<NoronhaWeatherOverview | null>(null);
  readonly loading = signal(true);
  readonly expanded = signal(false);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(forceRefresh = false): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.weather.overview(forceRefresh)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: overview => this.overview.set(overview),
        error: () => this.errorMessage.set('Não foi possível atualizar o clima agora. Consulte os avisos oficiais antes de sair.')
      });
  }

  toggleExpanded(): void {
    this.expanded.update(value => !value);
  }
}

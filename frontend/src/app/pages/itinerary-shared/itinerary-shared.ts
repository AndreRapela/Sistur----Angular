import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ItineraryService } from '../../services/itinerary.service';
import { Title } from '@angular/platform-browser';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-itinerary-shared',
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage],
  templateUrl: './itinerary-shared.html'
})
export class ItinerarySharedComponent implements OnInit {
  route = inject(ActivatedRoute);
  itineraryService = inject(ItineraryService);
  titleService = inject(Title);
  toastService = inject(ToastService);

  loading = signal(true);
  error = signal(false);
  errorMessage = signal('Não foi possível carregar este roteiro compartilhado.');
  itinerary = signal<any>(null);

  ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token');
    if (token) {
      this.itineraryService.getSharedItinerary(token).subscribe({
        next: (response: any) => {
          const data = response?.data ?? response;

          if (!data) {
            this.fail('O roteiro compartilhado retornou vazio.');
            return;
          }

          this.itinerary.set(data);
          this.titleService.setTitle(data.name + ' | SisTur Roteiros');
          this.loading.set(false);
        },
        error: (err: any) => {
          this.fail(this.extractErrorMessage(err));
        }
      });
    } else {
      this.fail('Link inválido ou incompleto.');
    }
  }

  private fail(message: string) {
    this.errorMessage.set(message);
    this.error.set(true);
    this.loading.set(false);
  }

  private extractErrorMessage(error: any): string {
    return error?.error?.message
      || error?.message
      || (error?.status === 404 ? 'Roteiro compartilhado não encontrado.' : 'Não foi possível carregar este roteiro.');
  }

  cloneItinerary() {
    const data = this.itinerary();
    if (data && data.items) {
      this.itineraryService.clear();
      data.items.forEach((item: any) => {
         this.itineraryService.toggleItem({
            id: item.referenceId,
            type: item.type,
            name: item.name,
            image: item.image,
            location: item.location,
            day: item.day || 0
         });
      });
      // Navegar para planejador
      window.location.href = '/itinerary';
    }
  }
}


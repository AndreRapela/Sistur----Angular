import { ToastService } from '../../services/toast.service';
import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgOptimizedImage } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { ItineraryService, ItineraryItem } from '../../services/itinerary.service';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { RouteOptimizationRequestDTO, RouteOptimizationResponseDTO } from '../../models/tourism.models';

@Component({
  selector: 'app-itinerary',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DragDropModule, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './itinerary.html',
})
export class ItineraryPageComponent implements OnInit {
  Object = Object;
  step: 'LIST' | 'SETUP' | 'PLANNING' = 'LIST';
  savedItineraries: any[] = [];
  itineraryName = '';
  isPublic = false;
  minDate = new Date().toISOString().split('T')[0];
  startDate = this.minDate;
  endDate = this.minDate;
  weatherCondition = 'SUNNY';
  temperatureCelsius = 29;

  dayKeys = computed(() => {
    return Object.keys(this.itinerary.itemsByDay())
      .map(k => Number(k))
      .sort((a, b) => a - b);
  });

  daysOptions = [
    { label: 'Pendentes', value: 0 },
    { label: 'Dia 1', value: 1 },
    { label: 'Dia 2', value: 2 },
    { label: 'Dia 3', value: 3 },
    { label: 'Dia 4', value: 4 },
    { label: 'Dia 5', value: 5 }];

  constructor(
    public itinerary: ItineraryService,
    private toastService: ToastService,
    private router: Router
  ) {}

  aiRecommendation = signal<RouteOptimizationResponseDTO | null>(null);
  isGeneratingAI = signal(false);
  private readonly http = inject(HttpClient);

  findOnMap(item: ItineraryItem) {
    this.router.navigate(['/map'], {
      queryParams: {
        id: item.id,
        type: item.type,
        focus: true
      }
    });
  }

  generateAISuggestions() {
    if (this.itinerary.items().length === 0) {
      this.toastService.add({ severity: 'warn', summary: 'Atenção', detail: 'Adicione itens ao roteiro primeiro.' });
      return;
    }

    this.isGeneratingAI.set(true);
    const request: RouteOptimizationRequestDTO = {
      items: this.itinerary.items().map(item => ({
        id: String(item.id),
        type: item.type,
        name: item.name,
        location: item.location,
        category: item.category,
        bestTime: item.bestTime,
        bestSeason: item.bestSeason,
        idealWeather: item.idealWeather,
        day: item.day,
        time: item.time,
        notes: item.notes,
        latitude: item.latitude,
        longitude: item.longitude
      })),
      tripStartDate: this.startDate,
      tripEndDate: this.endDate,
      weatherCondition: this.weatherCondition,
      temperatureCelsius: this.temperatureCelsius
    };

    this.http.post<RouteOptimizationResponseDTO>(`${environment.apiUrl}/ai/optimize`, request).subscribe({
      next: (res) => {
        this.aiRecommendation.set(res);
        this.isGeneratingAI.set(false);
        this.toastService.add({ severity: 'success', summary: 'IA Concentrada', detail: 'Sugestões de percurso geradas!' });
      },
      error: () => {
        this.isGeneratingAI.set(false);
        this.toastService.add({ severity: 'error', summary: 'Erro', detail: 'O motor de IA está ocupado. Tente logo mais.' });
      }
    });
  }

  applyAISuggestion() {
    const recommendation = this.aiRecommendation();
    if (!recommendation?.optimizedItems?.length) {
      this.toastService.add({ severity: 'warn', summary: 'Atenção', detail: 'Gere uma sugestão de IA primeiro.' });
      return;
    }

    const currentItems = this.itinerary.items();
    const currentMap = new Map(currentItems.map(item => [`${item.type}:${item.id}`, item]));
    const usedKeys = new Set<string>();

    const reordered = recommendation.optimizedItems
      .map(suggested => {
        const key = `${suggested.type}:${suggested.id}`;
        usedKeys.add(key);
        const current = currentMap.get(key);

        if (!current) {
          return null;
        }

        return {
          ...current,
          day: suggested.day ?? current.day,
          time: suggested.time ?? current.time,
          notes: suggested.notes ?? current.notes,
          location: suggested.location || current.location,
          image: current.image
        } as ItineraryItem;
      })
      .filter(Boolean) as ItineraryItem[];

    const remaining = currentItems.filter(item => !usedKeys.has(`${item.type}:${item.id}`));
    this.itinerary.loadItemsFromArray([...reordered, ...remaining]);
    this.toastService.add({ severity: 'success', summary: 'Ordem aplicada', detail: 'Seu roteiro foi reorganizado pela IA.' });
  }

  ngOnInit() {
    this.itineraryName = localStorage.getItem('sistur_active_itinerary_name') || '';
    if (this.itinerary.items().length > 0) {
      if (!this.itineraryName) this.itineraryName = 'Meu Roteiro';
      this.step = 'PLANNING';
    } else {
      const saved = localStorage.getItem('sistur_saved_itineraries');
      if (saved) {
         this.savedItineraries = JSON.parse(saved);
         if (this.savedItineraries.length > 0) {
             this.step = 'LIST';
         } else {
             this.step = 'SETUP';
         }
      } else {
         this.step = 'SETUP';
      }
    }
  }

  createNew() {
    this.itinerary.clear();
    this.itineraryName = '';
    localStorage.removeItem('sistur_active_itinerary_name');
    this.step = 'SETUP';
  }

  setTimeIfEmpty(item: ItineraryItem) {
    if (!item.time) {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      item.time = `${h}:${m}`;
      this.itinerary.updateItem(item);
    }
  }

  loadItinerary(savedItin: any) {
    this.itineraryName = savedItin.name;
    localStorage.setItem('sistur_active_itinerary_name', savedItin.name);
    // Quick load via service
    this.itinerary.loadItemsFromArray(savedItin.items);
    this.step = 'PLANNING';
  }

  drop(event: CdkDragDrop<any[]>, newDay: number) {
    if (event.previousContainer !== event.container) {
      const item = event.previousContainer.data[event.previousIndex];
      item.day = newDay;
      this.itinerary.updateItem(item);
    } else {
      // Reordering in the same list - optimization possibility using Signals?
      // Since it's sorted only by added/updates, a simple visual update for now:
      const arr = event.container.data;
      const movedItem = arr.splice(event.previousIndex, 1)[0];
      arr.splice(event.currentIndex, 0, movedItem);
      // Wait: _items signal doesn't inherently store intra-day order right now,
      // it would need to save the entire reordered list back to the service to persist
      // We will re-read and set to push changes if we want true intra-day persisting:
      this.itinerary.reorderItems(arr, newDay);
    }
  }

  changeDay(item: any, delta: number) {
    let newDay = (item.day || 0) + delta;
    if (newDay < 0) newDay = 0;
    if (newDay > 15) newDay = 15;
    item.day = newDay;
    this.itinerary.updateItem(item);
  }

  startPlanning() {
    localStorage.setItem('sistur_active_itinerary_name', this.itineraryName);
    this.step = 'PLANNING';
  }

  saveItinerary() {
    let saved = JSON.parse(localStorage.getItem('sistur_saved_itineraries') || '[]');
    const existingIndex = saved.findIndex((i: any) => i.name === this.itineraryName);
    const itinData = {
      name: this.itineraryName,
      items: this.itinerary.items(),
      updatedAt: new Date().toISOString()
    };
    if (existingIndex >= 0) saved[existingIndex] = itinData;
    else saved.push(itinData);
    localStorage.setItem('sistur_saved_itineraries', JSON.stringify(saved));
    this.savedItineraries = saved;

    this.itinerary.saveToServer(this.itineraryName, this.isPublic)?.subscribe({
      next: () => {
        this.toastService.add({ severity: 'success', summary: 'Sucesso!', detail: 'Seu roteiro foi salvo na nuvem.' });
        this.step = 'PLANNING';
      },
      error: () => {
        this.toastService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao salvar online.' });
      }
    });
  }
  printItinerary() {
    window.print();
  }

  clearItinerary() {
    if (confirm('Tem certeza que deseja limpar todo o seu roteiro?')) {
      this.itinerary.clear();
      this.toastService.add({ severity: 'info', summary: 'Limpo', detail: 'Seu roteiro foi limpo.' });
      this.step = 'SETUP';
    }
  }
}

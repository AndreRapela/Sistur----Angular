import { Injectable, signal, computed, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface ItineraryItem {
  id: number | string;
  type: 'RESTAURANT' | 'HOTEL' | 'EVENT' | 'TOUR' | 'HIGHLIGHT';
  name: string;
  image?: string;
  location?: string;
  addedAt: Date;
  day?: number; // 0 = Não definido, 1 = Dia 1, etc.
  time?: string;
  notes?: string;  estimatedCost?: number;}

@Injectable({
  providedIn: 'root'
})
export class ItineraryService {
  private _items = signal<ItineraryItem[]>(this.loadItems());

  items = this._items.asReadonly();

  // Agrupamento por dia computado
  itemsByDay = computed(() => {
    const grouped: { [key: number]: ItineraryItem[] } = {};
    this._items().forEach((item: ItineraryItem) => {
      const day = item.day || 0;
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(item);
    });
    return grouped;
  });

  // Custo total computado
  totalCost = computed(() => {
    return this._items().reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
  });

  private messageService = inject(MessageService);
  private auth = inject(AuthService);
  private http = inject(HttpClient);

  constructor() {}

  private loadItems(): ItineraryItem[] {
    const saved = localStorage.getItem('sistur_itinerary');
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }

  toggleItem(item: Partial<ItineraryItem> & { id: number | string, type: any }) {
    const current = this._items();
    const index = current.findIndex(i => String(i.id) === String(item.id) && i.type === item.type);

    if (index > -1) {
      this._items.set(current.filter((_, i) => i !== index));
      this.messageService.add({ severity: 'info', summary: 'Removido', detail: `${item.name} removido do roteiro` });

      if (this.auth.isAuthenticated()) {
        // Opcional: Implementar DELETE no backend
      }
    } else {
      const newItem: ItineraryItem = {
        id: item.id,
        type: item.type,
        name: item.name || 'Sem nome',
        image: item.image,
        location: item.location,
        addedAt: new Date(),
        day: 0,
        time: '',
        notes: '',
        estimatedCost: 0
      };
      this._items.set([...current, newItem]);
      this.messageService.add({ severity: 'success', summary: 'Adicionado', detail: `${item.name} adicionado ao seu roteiro!` });
    }
    this.save();
  }

  updateItem(updatedItem: ItineraryItem) {
    const current = this._items();
    const index = current.findIndex(i => i.id === updatedItem.id && i.type === updatedItem.type);
    if (index > -1) {
      const newItems = [...current];
      newItems[index] = updatedItem;
      this._items.set(newItems);
      this.save();
    }
  }

  isAdded(id: number | string, type: string): boolean {
    return this._items().some(i => String(i.id) === String(id) && i.type === type);
  }

  clear() {
    this._items.set([]);
    localStorage.removeItem('sistur_itinerary');
  }

  saveToServer(name: string, isPublic: boolean = false) {
    if (!this.auth.isAuthenticated()) {
      this.messageService.add({ severity: 'warn', summary: 'AtenÃ§Ã£o', detail: 'FaÃ§a login para salvar seu roteiro na nuvem' });
      return;
    }

    const payload = {
      name: name,
      isPublic: isPublic,
      items: this._items().map(i => ({
        referenceId: i.id,
        type: i.type,
        name: i.name,
        image: i.image,
        location: i.location,
        day: i.day || 0,
        time: i.time,
        notes: i.notes
      }))
    };

    return this.http.post(`${environment.apiUrl}/itineraries`, payload);
  }

  getSharedItinerary(token: string) {
    return this.http.get<any>(`${environment.apiUrl}/itineraries/share/${token}`);
  }

  private save() {
    localStorage.setItem('sistur_itinerary', JSON.stringify(this._items()));
  }
}



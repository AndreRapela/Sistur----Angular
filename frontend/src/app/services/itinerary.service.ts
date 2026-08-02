import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { environment } from '../../environments/environment';

export type ItineraryItemType = 'RESTAURANT' | 'HOTEL' | 'EVENT' | 'TOUR' | 'HIGHLIGHT' | 'POINT' | 'BEACH' | 'CONVENIENCE';

export interface ItineraryItem {
  id: number | string;
  type: ItineraryItemType;
  name: string;
  image?: string | null;
  location?: string;
  category?: string;
  bestTime?: string;
  bestSeason?: string;
  idealWeather?: string;
  latitude?: number;
  longitude?: number;
  addedAt: Date;
  day?: number;
  time?: string;
  notes?: string;
  estimatedCost?: number;
}

export interface SharedItinerary {
  id: number;
  name: string;
  isPublic: boolean;
  shareToken: string;
  createdAt: string;
  viewCount: number;
  user?: { id: number; name: string; photoUrl?: string | null };
  items: Array<Omit<ItineraryItem, 'id' | 'addedAt'> & { referenceId: string }>;
}

@Injectable({
  providedIn: 'root'
})
export class ItineraryService {
  private toastService = inject(ToastService);
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private _items = signal<ItineraryItem[]>(this.loadItems());

  items = this._items.asReadonly();

  private itemsMap = computed(() => {
    const map = new Map<string, boolean>();
    this._items().forEach(item => {
      map.set(`${item.type}:${item.id}`, true);
    });
    return map;
  });

  itemsByDay = computed(() => {
    const grouped: { [key: number]: ItineraryItem[] } = {};
    this._items().forEach(item => {
      const day = item.day || 0;
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(item);
    });
    return grouped;
  });

  totalCost = computed(() => this._items().reduce((sum, item) => sum + (item.estimatedCost || 0), 0));

  isInItinerary(id: number | string, type: string): boolean {
    return this.itemsMap().has(`${type}:${id}`);
  }

  toggleItem(item: Partial<ItineraryItem> & { id: number | string; type: ItineraryItemType }) {
    const current = this._items();
    const index = current.findIndex(i => String(i.id) === String(item.id) && i.type === item.type);

    if (index > -1) {
      this._items.set(current.filter((_, i) => i !== index));
      this.toastService.add({ severity: 'info', summary: 'Removido', detail: `${item.name} removido do roteiro` });
    } else {
      const newItem: ItineraryItem = {
        id: item.id,
        type: item.type,
        name: item.name || 'Sem nome',
        image: item.image,
        location: item.location,
        category: item.category,
        bestTime: item.bestTime,
        bestSeason: item.bestSeason,
        idealWeather: item.idealWeather,
        latitude: item.latitude,
        longitude: item.longitude,
        addedAt: new Date(),
        day: item.day || 0,
        time: item.time || '',
        notes: item.notes || '',
        estimatedCost: item.estimatedCost || 0
      };
      this._items.set([...current, newItem]);
      this.toastService.add({ severity: 'success', summary: 'Adicionado', detail: `${item.name} adicionado ao seu roteiro!` });
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

  reorderItems(reorderedArray: ItineraryItem[], day: number) {
    const current = this._items();
    const filtered = current.filter(i => (i.day || 0) !== day);
    this._items.set([...filtered, ...reorderedArray]);
    this.save();
  }

  clear() {
    this._items.set([]);
    localStorage.removeItem('sistur_itinerary');
  }

  loadItemsFromArray(items: ItineraryItem[]) {
    this._items.set(items);
    this.save();
  }

  saveToServer(name: string, isPublic = false) {
    if (!this.auth.isAuthenticated()) {
      this.toastService.add({ severity: 'warn', summary: 'Atenção', detail: 'Faça login para salvar seu roteiro na nuvem' });
      return;
    }

    const payload = {
      name,
      isPublic,
      items: this._items().map(i => ({
        referenceId: i.id,
        type: i.type,
        name: i.name,
        image: i.image,
        location: i.location,
        category: i.category,
        latitude: i.latitude,
        longitude: i.longitude,
        day: i.day || 0,
        time: i.time,
        notes: i.notes
      }))
    };

    return this.http.post(`${environment.apiUrl}/itineraries`, payload);
  }

  getSharedItinerary(token: string) {
    return this.http.get<{ data: SharedItinerary }>(`${environment.apiUrl}/itineraries/share/${encodeURIComponent(token)}`);
  }

  private loadItems(): ItineraryItem[] {
    const saved = localStorage.getItem('sistur_itinerary');
    if (!saved) {
      return [];
    }

    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }

  private save() {
    localStorage.setItem('sistur_itinerary', JSON.stringify(this._items()));
  }
}

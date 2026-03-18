import { Injectable, signal, computed, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

export interface ItineraryItem {
  id: number | string;
  type: 'RESTAURANT' | 'HOTEL' | 'EVENT' | 'TOUR' | 'HIGHLIGHT';
  name: string;
  image?: string;
  location?: string;
  addedAt: Date;
  day?: number; // 0 = Não definido, 1 = Dia 1, etc.
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ItineraryService {
  private _items = signal<ItineraryItem[]>(this.loadItems());

  items = this._items.asReadonly();
  
  // Agrupamento por dia computado
  itemsByDay = computed(() => {
    const grouped: { [key: number]: ItineraryItem[] } = {};
    this._items().forEach(item => {
      const day = item.day || 0;
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(item);
    });
    return grouped;
  });

  private messageService = inject(MessageService);

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
    } else {
      const newItem: ItineraryItem = {
        id: item.id,
        type: item.type,
        name: item.name || 'Sem nome',
        image: item.image,
        location: item.location,
        addedAt: new Date(),
        day: 0,
        notes: ''
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

  private save() {
    localStorage.setItem('sistur_itinerary', JSON.stringify(this._items()));
  }
}

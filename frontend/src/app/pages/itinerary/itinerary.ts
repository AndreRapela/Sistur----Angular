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
import {
  ExpenseCategory,
  ReservationType,
  TripWorkspaceSnapshot,
  TripWorkspaceService
} from '../../services/trip-workspace.service';
import { downloadTripCalendar } from '../../utils/trip-calendar';
import { openExternalLink } from '../../utils/external-link';

type TravelParty = 'SOLO' | 'COUPLE' | 'FRIENDS' | 'FAMILY';
type WorkspaceTab = 'PLAN' | 'RESERVATIONS' | 'BUDGET';

interface SavedItinerary {
  name: string;
  items: ItineraryItem[];
  startDate?: string;
  endDate?: string;
  travelParty?: TravelParty;
  isPublic?: boolean;
  workspace?: Partial<TripWorkspaceSnapshot>;
  updatedAt?: string;
}

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
  savedItineraries: SavedItinerary[] = [];
  itineraryName = '';
  isPublic = false;
  minDate = new Date().toISOString().split('T')[0];
  startDate = this.minDate;
  endDate = this.minDate;
  weatherCondition = 'SUNNY';
  temperatureCelsius = 29;
  travelParty: TravelParty = 'COUPLE';
  activeWorkspaceTab = signal<WorkspaceTab>('PLAN');
  compactView = signal(false);
  readonly workspace = inject(TripWorkspaceService);

  expenseDraft = this.emptyExpenseDraft();
  reservationDraft = this.emptyReservationDraft();

  readonly expenseCategories: Array<{ value: ExpenseCategory; label: string; icon: string }> = [
    { value: 'FOOD', label: 'Alimentação', icon: 'pi-shop' },
    { value: 'TOUR', label: 'Passeios', icon: 'pi-compass' },
    { value: 'LODGING', label: 'Hospedagem', icon: 'pi-home' },
    { value: 'TRANSPORT', label: 'Transporte', icon: 'pi-car' },
    { value: 'FEE', label: 'Taxas', icon: 'pi-ticket' },
    { value: 'OTHER', label: 'Outros', icon: 'pi-wallet' }
  ];

  readonly reservationTypes: Array<{ value: ReservationType; label: string; icon: string }> = [
    { value: 'FLIGHT', label: 'Voo', icon: 'pi-send' },
    { value: 'LODGING', label: 'Hospedagem', icon: 'pi-home' },
    { value: 'TOUR', label: 'Passeio', icon: 'pi-compass' },
    { value: 'RESTAURANT', label: 'Restaurante', icon: 'pi-shop' },
    { value: 'TRANSPORT', label: 'Transporte', icon: 'pi-car' },
    { value: 'OTHER', label: 'Outro', icon: 'pi-calendar' }
  ];

  travelPartyOptions: Array<{ label: string; value: TravelParty; icon: string }> = [
    { label: 'Sozinho', value: 'SOLO', icon: 'pi-user' },
    { label: 'Casal', value: 'COUPLE', icon: 'pi-heart-fill' },
    { label: 'Amigos', value: 'FRIENDS', icon: 'pi-users' },
    { label: 'Familia', value: 'FAMILY', icon: 'pi-home' }
  ];

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
    this.travelParty = (localStorage.getItem('sistur_travel_party') as TravelParty | null) || 'COUPLE';
    if (this.itinerary.items().length > 0) {
      if (!this.itineraryName) this.itineraryName = 'Meu Roteiro';
      this.step = 'PLANNING';
    } else {
      this.savedItineraries = this.readSavedItineraries();
      this.step = this.savedItineraries.length > 0 ? 'LIST' : 'SETUP';
    }
  }

  createNew() {
    this.itinerary.clear();
    this.workspace.reset(this.defaultTravelerCount());
    this.itineraryName = '';
    localStorage.removeItem('sistur_active_itinerary_name');
    this.activeWorkspaceTab.set('PLAN');
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

  selectTravelParty(value: TravelParty) {
    this.travelParty = value;
    localStorage.setItem('sistur_travel_party', value);
    this.workspace.setTravelerCount(this.defaultTravelerCount(value));
  }

  loadItinerary(savedItin: SavedItinerary) {
    this.itineraryName = savedItin.name;
    this.startDate = savedItin.startDate || this.minDate;
    this.endDate = savedItin.endDate || this.startDate;
    this.travelParty = savedItin.travelParty || 'COUPLE';
    this.isPublic = !!savedItin.isPublic;
    this.workspace.replace(savedItin.workspace || {
      travelerCount: this.defaultTravelerCount(this.travelParty)
    });
    localStorage.setItem('sistur_active_itinerary_name', savedItin.name);
    // Quick load via service
    this.itinerary.loadItemsFromArray(savedItin.items || []);
    this.step = 'PLANNING';
  }

  deleteSavedItinerary(savedItin: SavedItinerary, event?: Event) {
    event?.stopPropagation();
    const saved = this.savedItineraries.filter(item => item.name !== savedItin.name);
    this.savedItineraries = saved;
    localStorage.setItem('sistur_saved_itineraries', JSON.stringify(saved));
    if (saved.length === 0 && this.itinerary.items().length === 0) {
      this.step = 'SETUP';
    }
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
    this.itineraryName = this.itineraryName.trim().slice(0, 80);
    if (!this.itineraryName) {
      this.toastService.add({ severity: 'warn', summary: 'Nome necessário', detail: 'Dê um nome ao roteiro para continuar.' });
      return;
    }
    localStorage.setItem('sistur_active_itinerary_name', this.itineraryName);
    localStorage.setItem('sistur_travel_party', this.travelParty);
    this.step = 'PLANNING';
  }

  saveItinerary() {
    this.itineraryName = this.itineraryName.trim().slice(0, 80);
    if (!this.itineraryName) {
      this.toastService.add({ severity: 'warn', summary: 'Nome necessário', detail: 'Dê um nome ao roteiro antes de salvar.' });
      return;
    }

    const saved = this.readSavedItineraries();
    const existingIndex = saved.findIndex(item => item.name === this.itineraryName);
    const itinData: SavedItinerary = {
      name: this.itineraryName,
      items: this.itinerary.items(),
      startDate: this.startDate,
      endDate: this.endDate,
      travelParty: this.travelParty,
      isPublic: this.isPublic,
      workspace: this.workspace.snapshot(),
      updatedAt: new Date().toISOString()
    };
    if (existingIndex >= 0) saved[existingIndex] = itinData;
    else saved.push(itinData);
    try {
      localStorage.setItem('sistur_saved_itineraries', JSON.stringify(saved));
    } catch {
      this.toastService.add({ severity: 'error', summary: 'Armazenamento indisponível', detail: 'Não foi possível salvar a cópia offline neste dispositivo.' });
    }
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
    this.activeWorkspaceTab.set('PLAN');
    setTimeout(() => window.print());
  }

  exportCalendar() {
    const hasScheduledItem = this.itinerary.items().some(item => Number(item.day) > 0);
    const hasDatedReservation = this.workspace.workspace().reservations.some(reservation => !!reservation.date);
    if (!hasScheduledItem && !hasDatedReservation) {
      this.toastService.add({ severity: 'warn', summary: 'Nada para exportar', detail: 'Defina um dia para uma parada ou adicione uma reserva com data.' });
      return;
    }

    const exported = downloadTripCalendar({
      tripName: this.itineraryName || 'Roteiro SisTur',
      startDate: this.startDate,
      items: this.itinerary.items(),
      reservations: this.workspace.workspace().reservations
    });

    this.toastService.add(exported
      ? { severity: 'success', summary: 'Calendário pronto', detail: 'O arquivo .ics foi gerado para Google Agenda, Apple Calendar ou Outlook.' }
      : { severity: 'error', summary: 'Não foi possível exportar', detail: 'Tente novamente em um navegador atualizado.' });
  }

  addExpense() {
    if (!this.expenseDraft.description.trim() || Number(this.expenseDraft.amount) <= 0) {
      this.toastService.add({ severity: 'warn', summary: 'Dados incompletos', detail: 'Informe a despesa e um valor maior que zero.' });
      return;
    }

    this.workspace.addExpense(this.expenseDraft);
    this.expenseDraft = this.emptyExpenseDraft();
    this.toastService.add({ severity: 'success', summary: 'Despesa registrada', detail: 'O orçamento da viagem foi atualizado.' });
  }

  addReservation() {
    if (!this.reservationDraft.title.trim() || !this.reservationDraft.date) {
      this.toastService.add({ severity: 'warn', summary: 'Dados incompletos', detail: 'Informe o nome e a data da reserva.' });
      return;
    }

    this.workspace.addReservation(this.reservationDraft);
    this.reservationDraft = this.emptyReservationDraft();
    this.toastService.add({ severity: 'success', summary: 'Reserva organizada', detail: 'Ela ficará privada neste dispositivo.' });
  }

  openReservation(url: string) {
    if (!openExternalLink(url)) {
      this.toastService.add({ severity: 'warn', summary: 'Link inválido', detail: 'Revise o endereço informado para esta reserva.' });
    }
  }

  expenseCategoryLabel(category: ExpenseCategory): string {
    return this.expenseCategories.find(option => option.value === category)?.label || 'Outros';
  }

  expenseCategoryIcon(category: ExpenseCategory): string {
    return this.expenseCategories.find(option => option.value === category)?.icon || 'pi-wallet';
  }

  reservationTypeLabel(type: ReservationType): string {
    return this.reservationTypes.find(option => option.value === type)?.label || 'Outro';
  }

  reservationTypeIcon(type: ReservationType): string {
    return this.reservationTypes.find(option => option.value === type)?.icon || 'pi-calendar';
  }

  clearItinerary() {
    if (confirm('Tem certeza que deseja limpar todo o seu roteiro?')) {
      this.itinerary.clear();
      this.workspace.reset(this.defaultTravelerCount());
      this.toastService.add({ severity: 'info', summary: 'Limpo', detail: 'Seu roteiro foi limpo.' });
      this.step = 'SETUP';
    }
  }

  private emptyExpenseDraft() {
    return {
      description: '',
      category: 'FOOD' as ExpenseCategory,
      amount: 0,
      paidBy: '',
      splitBetween: this.workspace?.workspace().travelerCount || this.defaultTravelerCount(),
      date: this.startDate
    };
  }

  private emptyReservationDraft() {
    return {
      type: 'TOUR' as ReservationType,
      title: '',
      provider: '',
      confirmationCode: '',
      date: this.startDate,
      time: '',
      location: '',
      bookingUrl: '',
      notes: '',
      cost: 0
    };
  }

  private defaultTravelerCount(party: TravelParty = this.travelParty): number {
    if (party === 'SOLO') return 1;
    if (party === 'COUPLE') return 2;
    if (party === 'FAMILY') return 4;
    return 3;
  }

  private readSavedItineraries(): SavedItinerary[] {
    try {
      const parsed = JSON.parse(localStorage.getItem('sistur_saved_itineraries') || '[]');
      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter(item => item && typeof item.name === 'string' && Array.isArray(item.items))
        .slice(0, 100)
        .map(item => ({
          ...item,
          name: item.name.trim().slice(0, 80),
          items: item.items.slice(0, 500)
        }))
        .filter(item => !!item.name);
    } catch {
      return [];
    }
  }
}

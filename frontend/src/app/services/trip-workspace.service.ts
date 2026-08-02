import { Injectable, computed, signal } from '@angular/core';

export type ExpenseCategory = 'FOOD' | 'TOUR' | 'LODGING' | 'TRANSPORT' | 'FEE' | 'OTHER';
export type ReservationType = 'FLIGHT' | 'LODGING' | 'TOUR' | 'RESTAURANT' | 'TRANSPORT' | 'OTHER';

export interface TripExpense {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  paidBy: string;
  splitBetween: number;
  date: string;
  createdAt: string;
}

export interface TripReservation {
  id: string;
  type: ReservationType;
  title: string;
  provider: string;
  confirmationCode: string;
  date: string;
  time: string;
  location: string;
  bookingUrl: string;
  notes: string;
  cost: number;
  createdAt: string;
}

export interface TripWorkspaceSnapshot {
  budget: number;
  travelerCount: number;
  expenses: TripExpense[];
  reservations: TripReservation[];
}

type ExpenseInput = Omit<TripExpense, 'id' | 'createdAt'>;
type ReservationInput = Omit<TripReservation, 'id' | 'createdAt'>;

const STORAGE_KEY = 'sistur_trip_workspace_v1';
const MAX_MONEY_VALUE = 1_000_000;
const EXPENSE_CATEGORIES: ExpenseCategory[] = ['FOOD', 'TOUR', 'LODGING', 'TRANSPORT', 'FEE', 'OTHER'];
const RESERVATION_TYPES: ReservationType[] = ['FLIGHT', 'LODGING', 'TOUR', 'RESTAURANT', 'TRANSPORT', 'OTHER'];

@Injectable({ providedIn: 'root' })
export class TripWorkspaceService {
  private readonly state = signal<TripWorkspaceSnapshot>(this.load());

  readonly workspace = this.state.asReadonly();
  readonly expenseTotal = computed(() => this.roundMoney(
    this.state().expenses.reduce((total, expense) => total + expense.amount, 0)
  ));
  readonly reservationTotal = computed(() => this.roundMoney(
    this.state().reservations.reduce((total, reservation) => total + reservation.cost, 0)
  ));
  readonly committedTotal = computed(() => this.roundMoney(this.expenseTotal() + this.reservationTotal()));
  readonly remainingBudget = computed(() => this.roundMoney(this.state().budget - this.committedTotal()));
  readonly perPerson = computed(() => this.roundMoney(
    this.committedTotal() / Math.max(1, this.state().travelerCount)
  ));
  readonly budgetProgress = computed(() => {
    const budget = this.state().budget;
    return budget > 0 ? Math.min(100, Math.round((this.committedTotal() / budget) * 100)) : 0;
  });

  setBudget(value: number): void {
    this.update({ budget: this.money(value) });
  }

  setTravelerCount(value: number): void {
    this.update({ travelerCount: this.integer(value, 1, 50) });
  }

  addExpense(input: ExpenseInput): TripExpense {
    const expense: TripExpense = {
      id: this.createId(),
      description: this.text(input.description, 120),
      category: this.expenseCategory(input.category),
      amount: this.money(input.amount),
      paidBy: this.text(input.paidBy, 80) || 'Grupo',
      splitBetween: this.integer(input.splitBetween, 1, 50),
      date: this.date(input.date),
      createdAt: new Date().toISOString()
    };

    this.update({ expenses: [expense, ...this.state().expenses] });
    return expense;
  }

  removeExpense(id: string): void {
    this.update({ expenses: this.state().expenses.filter(expense => expense.id !== id) });
  }

  addReservation(input: ReservationInput): TripReservation {
    const reservation: TripReservation = {
      id: this.createId(),
      type: this.reservationType(input.type),
      title: this.text(input.title, 140),
      provider: this.text(input.provider, 100),
      confirmationCode: this.text(input.confirmationCode, 100),
      date: this.date(input.date),
      time: this.time(input.time),
      location: this.text(input.location, 180),
      bookingUrl: this.text(input.bookingUrl, 1000),
      notes: this.text(input.notes, 500),
      cost: this.money(input.cost),
      createdAt: new Date().toISOString()
    };

    this.update({ reservations: [reservation, ...this.state().reservations] });
    return reservation;
  }

  removeReservation(id: string): void {
    this.update({ reservations: this.state().reservations.filter(reservation => reservation.id !== id) });
  }

  replace(snapshot?: Partial<TripWorkspaceSnapshot> | null): void {
    this.state.set(this.normalize(snapshot));
    this.persist();
  }

  reset(travelerCount = 2): void {
    this.replace({ budget: 0, travelerCount, expenses: [], reservations: [] });
  }

  snapshot(): TripWorkspaceSnapshot {
    const current = this.state();
    return {
      budget: current.budget,
      travelerCount: current.travelerCount,
      expenses: current.expenses.map(expense => ({ ...expense })),
      reservations: current.reservations.map(reservation => ({ ...reservation }))
    };
  }

  private update(patch: Partial<TripWorkspaceSnapshot>): void {
    this.state.update(current => ({ ...current, ...patch }));
    this.persist();
  }

  private load(): TripWorkspaceSnapshot {
    if (typeof localStorage === 'undefined') {
      return this.normalize();
    }

    try {
      return this.normalize(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'));
    } catch {
      return this.normalize();
    }
  }

  private normalize(value?: Partial<TripWorkspaceSnapshot> | null): TripWorkspaceSnapshot {
    return {
      budget: this.money(value?.budget ?? 0),
      travelerCount: this.integer(value?.travelerCount ?? 2, 1, 50),
      expenses: Array.isArray(value?.expenses)
        ? value.expenses.slice(0, 300).map(expense => ({
            ...expense,
            id: this.text(expense.id, 100) || this.createId(),
            description: this.text(expense.description, 120),
            category: this.expenseCategory(expense.category),
            amount: this.money(expense.amount),
            paidBy: this.text(expense.paidBy, 80) || 'Grupo',
            splitBetween: this.integer(expense.splitBetween, 1, 50),
            date: this.date(expense.date),
            createdAt: this.text(expense.createdAt, 40) || new Date().toISOString()
          }))
        : [],
      reservations: Array.isArray(value?.reservations)
        ? value.reservations.slice(0, 150).map(reservation => ({
            ...reservation,
            id: this.text(reservation.id, 100) || this.createId(),
            type: this.reservationType(reservation.type),
            title: this.text(reservation.title, 140),
            provider: this.text(reservation.provider, 100),
            confirmationCode: this.text(reservation.confirmationCode, 100),
            date: this.date(reservation.date),
            time: this.time(reservation.time),
            location: this.text(reservation.location, 180),
            bookingUrl: this.text(reservation.bookingUrl, 1000),
            notes: this.text(reservation.notes, 500),
            cost: this.money(reservation.cost),
            createdAt: this.text(reservation.createdAt, 40) || new Date().toISOString()
          }))
        : []
    };
  }

  private persist(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state()));
    } catch {
      // The itinerary remains usable in memory when private mode or quota blocks storage.
    }
  }

  private money(value: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 0;
    return this.roundMoney(Math.min(MAX_MONEY_VALUE, Math.max(0, parsed)));
  }

  private roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private integer(value: number, min: number, max: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : min;
  }

  private text(value: string | null | undefined, maxLength: number): string {
    return String(value || '').trim().slice(0, maxLength);
  }

  private date(value: string): string {
    return /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value : '';
  }

  private time(value: string): string {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '') ? value : '';
  }

  private expenseCategory(value: ExpenseCategory): ExpenseCategory {
    return EXPENSE_CATEGORIES.includes(value) ? value : 'OTHER';
  }

  private reservationType(value: ReservationType): ReservationType {
    return RESERVATION_TYPES.includes(value) ? value : 'OTHER';
  }

  private createId(): string {
    return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

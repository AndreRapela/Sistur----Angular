import { TestBed } from '@angular/core/testing';
import { TripWorkspaceService } from './trip-workspace.service';

describe('TripWorkspaceService', () => {
  let service: TripWorkspaceService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    service = TestBed.inject(TripWorkspaceService);
  });

  it('calculates reservations, expenses and the per-person total', () => {
    service.setBudget(2000);
    service.setTravelerCount(4);
    service.addReservation({
      type: 'LODGING',
      title: 'Pousada',
      provider: 'Hospedagem local',
      confirmationCode: 'ABC123',
      date: '2026-08-10',
      time: '14:00',
      location: 'Vila dos Remédios',
      bookingUrl: 'https://example.com/reserva',
      notes: '',
      cost: 800
    });
    service.addExpense({
      description: 'Jantar',
      category: 'FOOD',
      amount: 200,
      paidBy: 'Ana',
      splitBetween: 4,
      date: '2026-08-10'
    });

    expect(service.reservationTotal()).toBe(800);
    expect(service.expenseTotal()).toBe(200);
    expect(service.committedTotal()).toBe(1000);
    expect(service.remainingBudget()).toBe(1000);
    expect(service.perPerson()).toBe(250);
    expect(service.budgetProgress()).toBe(50);
  });

  it('normalizes unsafe values before persisting a workspace', () => {
    service.replace({
      budget: -50,
      travelerCount: 0,
      expenses: [],
      reservations: []
    });

    expect(service.workspace().budget).toBe(0);
    expect(service.workspace().travelerCount).toBe(1);
    expect(JSON.parse(localStorage.getItem('sistur_trip_workspace_v1') || '{}').travelerCount).toBe(1);
  });
});

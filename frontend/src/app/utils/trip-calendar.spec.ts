import { buildTripCalendar } from './trip-calendar';

describe('trip calendar export', () => {
  it('exports scheduled places and private reservations as valid calendar events', () => {
    const calendar = buildTripCalendar({
      tripName: 'Noronha em família',
      startDate: '2026-08-10',
      generatedAt: new Date('2026-08-01T12:00:00Z'),
      items: [{
        id: 12,
        type: 'BEACH',
        name: 'Baía do Sancho',
        location: 'Parque Nacional',
        addedAt: new Date('2026-08-01T10:00:00Z'),
        day: 2,
        time: '09:30',
        notes: 'Levar água'
      }],
      reservations: [{
        id: 'booking-1',
        type: 'TOUR',
        title: 'Passeio de barco',
        provider: 'Operador local',
        confirmationCode: 'ABC123',
        date: '2026-08-12',
        time: '08:00',
        location: 'Porto',
        bookingUrl: 'https://example.test/reserva',
        notes: 'Chegar cedo',
        cost: 300,
        createdAt: '2026-08-01T10:00:00Z'
      }]
    });

    expect(calendar).toContain('BEGIN:VCALENDAR');
    expect(calendar).toContain('DTSTART:20260811T093000');
    expect(calendar).toContain('SUMMARY:Baía do Sancho');
    expect(calendar).toContain('SUMMARY:Passeio de barco');
    expect(calendar).toContain('Confirmação: ABC123');
    expect(calendar).toContain('END:VCALENDAR');
  });

  it('moves the event end to the next day after 23:00', () => {
    const calendar = buildTripCalendar({
      tripName: 'Noite em Noronha',
      startDate: '2026-08-10',
      items: [{
        id: 9,
        type: 'EVENT',
        name: 'Evento noturno',
        addedAt: new Date('2026-08-01T12:00:00Z'),
        day: 1,
        time: '23:30'
      }],
      reservations: [],
      generatedAt: new Date('2026-08-01T12:00:00Z')
    });

    expect(calendar).toContain('DTSTART:20260810T233000');
    expect(calendar).toContain('DTEND:20260811T003000');
  });
});

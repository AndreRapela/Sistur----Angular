import { ItineraryItem } from '../services/itinerary.service';
import { TripReservation } from '../services/trip-workspace.service';

interface CalendarInput {
  tripName: string;
  startDate: string;
  items: ItineraryItem[];
  reservations: TripReservation[];
  generatedAt?: Date;
}

export function buildTripCalendar(input: CalendarInput): string {
  const stamp = formatUtc(input.generatedAt || new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'PRODID:-//SisTur//Roteiro Noronha//PT-BR',
    `X-WR-CALNAME:${escapeIcs(input.tripName || 'Roteiro SisTur')}`
  ];

  const scheduledItems = input.items.filter(item => Number(item.day) > 0 && isDate(input.startDate));
  scheduledItems.forEach((item, index) => {
    const date = addDays(input.startDate, Math.max(0, Number(item.day) - 1));
    lines.push(...calendarEvent({
      uid: `place-${item.type}-${item.id}-${index}@sistur`,
      stamp,
      date,
      time: item.time || '',
      title: item.name,
      location: item.location || 'Fernando de Noronha',
      description: item.notes || item.category || 'Parada do roteiro SisTur'
    }));
  });

  input.reservations.filter(reservation => isDate(reservation.date)).forEach(reservation => {
    const details = [
      reservation.provider ? `Fornecedor: ${reservation.provider}` : '',
      reservation.confirmationCode ? `Confirmação: ${reservation.confirmationCode}` : '',
      reservation.notes
    ].filter(Boolean).join('\n');

    lines.push(...calendarEvent({
      uid: `reservation-${reservation.id}@sistur`,
      stamp,
      date: reservation.date,
      time: reservation.time,
      title: reservation.title,
      location: reservation.location,
      description: details,
      url: reservation.bookingUrl
    }));
  });

  lines.push('END:VCALENDAR');
  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}

export function downloadTripCalendar(input: CalendarInput): boolean {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return false;

  const content = buildTripCalendar(input);
  const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${fileName(input.tripName || 'roteiro-sistur')}.ics`;
  anchor.click();
  URL.revokeObjectURL(url);
  return true;
}

interface EventInput {
  uid: string;
  stamp: string;
  date: string;
  time: string;
  title: string;
  location?: string;
  description?: string;
  url?: string;
}

function calendarEvent(event: EventInput): string[] {
  const lines = [
    'BEGIN:VEVENT',
    `UID:${escapeIcs(event.uid)}`,
    `DTSTAMP:${event.stamp}`
  ];

  if (isTime(event.time)) {
    lines.push(`DTSTART:${compactDate(event.date)}T${event.time.replace(':', '')}00`);
    const end = addHour(event.date, event.time);
    lines.push(`DTEND:${compactDate(end.date)}T${end.time}00`);
  } else {
    lines.push(`DTSTART;VALUE=DATE:${compactDate(event.date)}`);
    lines.push(`DTEND;VALUE=DATE:${compactDate(addDays(event.date, 1))}`);
  }

  lines.push(`SUMMARY:${escapeIcs(event.title || 'Compromisso da viagem')}`);
  if (event.location) lines.push(`LOCATION:${escapeIcs(event.location)}`);
  if (event.description) lines.push(`DESCRIPTION:${escapeIcs(event.description)}`);
  if (event.url && /^https?:\/\//i.test(event.url)) lines.push(`URL:${escapeIcs(event.url)}`);
  lines.push('END:VEVENT');
  return lines;
}

function escapeIcs(value: string): string {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function foldIcsLine(line: string): string {
  if (line.length <= 73) return line;
  const chunks: string[] = [];
  for (let index = 0; index < line.length; index += 73) {
    chunks.push(`${index === 0 ? '' : ' '}${line.slice(index, index + 73)}`);
  }
  return chunks.join('\r\n');
}

function addDays(dateValue: string, days: number): string {
  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(year, month - 1, day + days, 12, 0, 0);
  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-');
}

function addHour(date: string, time: string): { date: string; time: string } {
  const [hour, minute] = time.split(':').map(Number);
  return {
    date: hour === 23 ? addDays(date, 1) : date,
    time: `${pad((hour + 1) % 24)}${pad(minute)}`
  };
}

function compactDate(date: string): string {
  return date.replace(/-/g, '');
}

function formatUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function isDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || '');
}

function isTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '');
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function fileName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 80) || 'roteiro-sistur';
}

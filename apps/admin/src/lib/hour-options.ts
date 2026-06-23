export const DEFAULT_START_HOUR = '19:00';
export const DEFAULT_END_HOUR = '22:00';

export const HOUR_OPTIONS: { value: string; label: string }[] = Array.from({ length: 24 }, (_, hour) => ({
  value: `${String(hour).padStart(2, '0')}:00`,
  label: new Date(2000, 0, 1, hour).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }),
}));

export function datePart(dtLocal: string): string {
  return dtLocal.slice(0, 10);
}

export function hourPart(dtLocal: string): string {
  return dtLocal.slice(11, 16);
}

export function combineDateHour(date: string, hour: string): string {
  return date && hour ? `${date}T${hour}` : '';
}

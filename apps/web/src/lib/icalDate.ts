export function icalDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
}

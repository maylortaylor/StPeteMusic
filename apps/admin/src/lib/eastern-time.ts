// Converts an ISO timestamp to a value usable in a <input type="datetime-local">,
// displayed in America/New_York local time.
export function toDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const eastern = new Date(d.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${eastern.getFullYear()}-${pad(eastern.getMonth() + 1)}-${pad(eastern.getDate())}T${pad(eastern.getHours())}:${pad(eastern.getMinutes())}`;
}

// Interprets a datetime-local string as Eastern time and returns UTC ISO.
// Uses the sv-SE locale trick to derive the current ET→UTC offset, which handles DST correctly.
export function easternToUtcIso(dtLocal: string): string {
  const asUtc = new Date(dtLocal + 'Z');
  const etStr = asUtc.toLocaleString('sv-SE', { timeZone: 'America/New_York' }).replace(' ', 'T');
  const offsetMs = asUtc.getTime() - new Date(etStr + 'Z').getTime();
  return new Date(asUtc.getTime() + offsetMs).toISOString();
}

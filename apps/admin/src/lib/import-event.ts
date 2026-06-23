export interface ImportEventResult {
  needsManualEntry?: boolean;
  url?: string;
  fbEventId?: string;
  name?: string;
  source?: string;
}

// Shared by eventbrite/page.tsx's Facebook importer and events/page.tsx's
// generic importer — both POST to the same endpoint and only differ in
// whether showOnTickets is set and what they do with the result.
export async function importEventViaApi(
  url: string,
  options: { showOnTickets?: boolean } = {},
): Promise<ImportEventResult> {
  const res = await fetch('/api/events/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, ...(options.showOnTickets ? { showOnTickets: true } : {}) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Import failed');
  return data as ImportEventResult;
}

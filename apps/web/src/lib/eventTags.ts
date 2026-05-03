export const EVENT_TAGS = {
  'live-band':       { label: 'Live Band',          hex: '#FF8C00', textColor: 'white' },
  'dj-dance':        { label: 'DJ / Dance Night',   hex: '#374151', textColor: 'white' },
  'open-mic':        { label: 'Open Mic',           hex: '#F59E0B', textColor: 'black' },
  'community-jam':   { label: 'Community Jam',      hex: '#3B82F6', textColor: 'white' },
  'community-event': { label: 'Community Event',    hex: '#8B5CF6', textColor: 'white' },
  'workshop-class':  { label: 'Workshop / Class',   hex: '#10B981', textColor: 'white' },
} as const;

export type EventTagSlug = keyof typeof EVENT_TAGS;

export function isEventTagSlug(s: string | null | undefined): s is EventTagSlug {
  return s != null && s in EVENT_TAGS;
}

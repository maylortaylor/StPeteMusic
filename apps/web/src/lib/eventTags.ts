export const EVENT_TAGS = {
  'final-friday':   { label: 'Final Friday',           hex: '#FF8C00', textColor: 'white' },
  'community-jam':  { label: 'Community Jam',           hex: '#3B82F6', textColor: 'white' },
  'art-walk':       { label: '2nd Saturday Art Walk',   hex: '#8B5CF6', textColor: 'white' },
  'workshop-class': { label: 'Workshop / Class',        hex: '#10B981', textColor: 'white' },
  'ohc':            { label: 'Open House Conspiracy',   hex: '#374151', textColor: 'white' },
  'community':      { label: 'Community',               hex: '#F59E0B', textColor: 'black' },
} as const;

export type EventTagSlug = keyof typeof EVENT_TAGS;

export function isEventTagSlug(s: string | null | undefined): s is EventTagSlug {
  return s != null && s in EVENT_TAGS;
}

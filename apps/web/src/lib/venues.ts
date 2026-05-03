export const VENUES = {
  'suite-e-studios': {
    name: 'Suite E Studios',
    color: '#FF8C00',
    calendarId: '98a6b333df9c0d145983eab458358c58692344b3436a7c292772019118db6e19@group.calendar.google.com',
  },
  'blueberry-patch': {
    name: 'Blueberry Patch',
    color: '#10B981',
    calendarId: '71e2433f12b9a7ffe5cfa52bb00dba523406043b321fe5f9dcf354476ea08555@group.calendar.google.com',
  },
  'cage-brewing': {
    name: 'Cage Brewing',
    color: '#3B82F6',
    calendarId: 'e0cc088fc8847d4de888142b6d18c69c6de370afaa268432ccae930d6e1b7108@group.calendar.google.com',
  },
  'rubys-elixir': {
    name: "Ruby's Elixir",
    color: '#8B5CF6',
    calendarId: 'ac1f54b2bbdd7ba7e94d95ec6a6090b26af944c614e35e3a01582f956ed275dd@group.calendar.google.com',
  },
  'the-bends': {
    name: 'The Bends',
    color: '#EC4899',
    calendarId: '2c1103fbae69f2a222a4a163203aff4decaa5af400fb9a68a0dada62860d7f38@group.calendar.google.com',
  },
} as const;

export type VenueSlug = keyof typeof VENUES;

export function isVenueSlug(s: string | null | undefined): s is VenueSlug {
  return s != null && s in VENUES;
}

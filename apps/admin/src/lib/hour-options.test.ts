import { describe, expect, it } from 'vitest';
import { HOUR_OPTIONS, combineDateHour, datePart, hourPart } from './hour-options';

describe('HOUR_OPTIONS', () => {
  it('has 24 on-the-hour options with human-readable labels', () => {
    expect(HOUR_OPTIONS).toHaveLength(24);
    expect(HOUR_OPTIONS[0]).toEqual({ value: '00:00', label: '12:00 AM' });
    expect(HOUR_OPTIONS[19]).toEqual({ value: '19:00', label: '7:00 PM' });
    expect(HOUR_OPTIONS[22]).toEqual({ value: '22:00', label: '10:00 PM' });
  });
});

describe('datePart / hourPart', () => {
  it('splits a datetime-local string into date and hour', () => {
    expect(datePart('2026-07-01T19:00')).toBe('2026-07-01');
    expect(hourPart('2026-07-01T19:00')).toBe('19:00');
  });

  it('returns empty strings for an empty input', () => {
    expect(datePart('')).toBe('');
    expect(hourPart('')).toBe('');
  });
});

describe('combineDateHour', () => {
  it('joins date and hour into a datetime-local string', () => {
    expect(combineDateHour('2026-07-01', '19:00')).toBe('2026-07-01T19:00');
  });

  it('returns an empty string when either part is missing', () => {
    expect(combineDateHour('', '19:00')).toBe('');
    expect(combineDateHour('2026-07-01', '')).toBe('');
    expect(combineDateHour('', '')).toBe('');
  });

  it('round-trips with datePart/hourPart', () => {
    const original = '2026-07-01T19:00';
    expect(combineDateHour(datePart(original), hourPart(original))).toBe(original);
  });
});

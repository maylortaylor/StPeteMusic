import { DEFAULT_START_HOUR, HOUR_OPTIONS, combineDateHour, datePart, hourPart } from '@/lib/hour-options';

interface DateHourFieldProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function DateHourField({ value, onChange, className }: DateHourFieldProps) {
  const date = datePart(value);
  const hour = hourPart(value) || DEFAULT_START_HOUR;

  return (
    <div className={`flex gap-1 ${className ?? ''}`}>
      <input
        type="date"
        value={date}
        onChange={(e) => onChange(combineDateHour(e.target.value, !date ? DEFAULT_START_HOUR : hour))}
        className="rounded-md border border-transparent bg-transparent px-2 py-1 hover:border-input focus:border-input focus:outline-none"
      />
      <select
        value={hour}
        onChange={(e) => onChange(combineDateHour(date, e.target.value))}
        disabled={!date}
        className="rounded-md border border-transparent bg-transparent px-2 py-1 hover:border-input focus:border-input focus:outline-none disabled:opacity-50"
      >
        {HOUR_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

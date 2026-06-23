import { DEFAULT_END_HOUR, DEFAULT_START_HOUR, HOUR_OPTIONS, combineDateHour, datePart, hourPart } from '@/lib/hour-options';

interface DateHourRangeFieldsProps {
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}

export function DateHourRangeFields({ startValue, endValue, onStartChange, onEndChange }: DateHourRangeFieldsProps) {
  const date = datePart(startValue) || datePart(endValue);
  const startHour = hourPart(startValue) || DEFAULT_START_HOUR;
  const endHour = hourPart(endValue) || DEFAULT_END_HOUR;

  const handleDateChange = (newDate: string) => {
    const isFirstPick = !startValue && !endValue;
    onStartChange(combineDateHour(newDate, isFirstPick ? DEFAULT_START_HOUR : startHour));
    onEndChange(combineDateHour(newDate, isFirstPick ? DEFAULT_END_HOUR : endHour));
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <input
        type="date"
        value={date}
        onChange={(e) => handleDateChange(e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      <select
        value={startHour}
        onChange={(e) => onStartChange(combineDateHour(date, e.target.value))}
        disabled={!date}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
      >
        {HOUR_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <select
        value={endHour}
        onChange={(e) => onEndChange(combineDateHour(date, e.target.value))}
        disabled={!date}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
      >
        {HOUR_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

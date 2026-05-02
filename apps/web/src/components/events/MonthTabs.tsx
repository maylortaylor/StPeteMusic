'use client';

interface MonthTab {
  label: string;
  year: number;
  month: number; // 1-indexed
}

interface MonthTabsProps {
  tabs: MonthTab[];
  active: number; // index into tabs
  onChange: (index: number) => void;
}

export function MonthTabs({ tabs, active, onChange }: MonthTabsProps) {
  return (
    <div className="flex gap-2 mb-6">
      {tabs.map((tab, i) => (
        <button
          key={`${tab.year}-${tab.month}`}
          onClick={() => onChange(i)}
          className={`font-inter font-bold text-sm sm:text-base uppercase tracking-[0.2em] px-5 py-3 border-2 transition-colors duration-150 ${
            active === i
              ? 'bg-black text-white border-black'
              : 'bg-white text-black border-border hover:border-black'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

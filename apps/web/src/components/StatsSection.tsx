'use client';

import { AnimateIn } from './AnimateIn';

const STATS = [
  { value: '100+', label: 'Shows captured in St. Pete' },
  { value: '50+',  label: 'Local artists documented' },
  { value: '10+',  label: 'Years in the community' },
];

export function StatsSection() {
  return (
    <section className="relative overflow-hidden px-6 py-32 bg-black">
      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/20">
        {STATS.map((stat, i) => (
          <AnimateIn key={stat.label} delay={i * 0.15} className="flex flex-col items-center text-center py-16 md:py-0 md:px-12">
            <p
              className="font-inter font-black leading-none mb-4 text-white"
              style={{ fontSize: 'clamp(5rem, 8vw, 8rem)' }}
            >
              {stat.value}
            </p>
            <p className="font-inter font-medium text-lg tracking-[0.5em] uppercase" style={{ color: '#B57048' }}>
              {stat.label}
            </p>
          </AnimateIn>
        ))}
      </div>
    </section>
  );
}

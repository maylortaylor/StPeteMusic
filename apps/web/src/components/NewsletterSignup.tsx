'use client';

import { useState } from 'react';
import { AnimateIn } from './AnimateIn';

interface NewsletterSignupProps {
  variant?: 'inline' | 'section';
}

export function NewsletterSignup({ variant = 'section' }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('success');
        setMessage("You're in. Monthly St. Pete music roundup incoming.");
        setEmail('');
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus('error');
        setMessage(data.message ?? 'Something went wrong. Try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Try again.');
    }
  }

  if (variant === 'inline') {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={status === 'loading' || status === 'success'}
          className="flex-1 text-white placeholder-text-muted bg-white/10 border border-white/30 px-6 py-3 focus:outline-none focus:border-brand-orange text-base disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className="text-white px-6 py-3 font-inter font-bold text-sm uppercase tracking-wide hover:opacity-90 transition-opacity whitespace-nowrap disabled:opacity-50 bg-brand-orange"
        >
          {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
        </button>
      </form>
    );
  }

  return (
    <section className="relative px-6 py-40 overflow-hidden bg-black">
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <AnimateIn as="p" className="font-inter font-medium text-sm tracking-[0.5em] uppercase mb-6" style={{ color: '#FF8C00' }}>
          Stay in the loop
        </AnimateIn>

        <AnimateIn delay={0.1}>
          <h2
            className="font-inter font-black uppercase leading-none mb-3 text-white"
            style={{ fontSize: 'clamp(3.5rem, 9vw, 8rem)' }}
          >
            Don&apos;t Miss<br />a Show.
          </h2>
          <span className="section-underline mx-auto mb-8" style={{ display: 'block' }} />
        </AnimateIn>

        <AnimateIn delay={0.2} as="p" className="font-inter text-white/70 text-xl mb-12 max-w-md mx-auto leading-relaxed">
          Monthly roundup of Final Friday lineups, new artists, and what&apos;s happening in St. Pete.
        </AnimateIn>

        <AnimateIn delay={0.3}>
          {status === 'success' ? (
            <p className="text-white/80 font-inter text-xl">{message}</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={status === 'loading'}
                className="flex-1 text-white placeholder-white/40 bg-white/10 border border-white/20 px-6 py-4 focus:outline-none focus:border-brand-orange text-base disabled:opacity-50 transition-colors"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="text-white px-8 py-4 font-inter font-bold text-base uppercase tracking-wide hover:opacity-90 transition-opacity whitespace-nowrap disabled:opacity-50 bg-brand-orange"
              >
                {status === 'loading' ? '...' : 'Subscribe'}
              </button>
            </form>
          )}
        </AnimateIn>

        {status === 'error' && <p className="text-red-400 text-base mt-4">{message}</p>}
        <AnimateIn delay={0.4} as="p" className="font-inter text-white/40 text-base mt-6">
          No spam. Unsubscribe anytime.
        </AnimateIn>
      </div>
    </section>
  );
}

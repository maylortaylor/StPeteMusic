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
          className="flex-1 text-text-primary placeholder-text-muted rounded-sm px-6 py-3 focus:outline-none focus:border-brand-blue text-base disabled:opacity-50"
          style={{ background: '#1C1C1C', border: '1px solid #488DB5' }}
        />
        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className="text-white px-6 py-3 rounded-sm font-montserrat font-bold text-sm uppercase tracking-wide hover:opacity-90 transition-opacity whitespace-nowrap disabled:opacity-50"
          style={{ background: '#d71679' }}
        >
          {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
        </button>
      </form>
    );
  }

  return (
    <section
      className="relative px-6 py-40 overflow-hidden grain"
      style={{ background: '#3A3A3A' }}
    >
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <AnimateIn as="p" className="font-oswald text-sm tracking-[0.5em] uppercase mb-6" style={{ color: '#B57048' }}>
          Stay in the loop
        </AnimateIn>

        <AnimateIn delay={0.1}>
          <h2
            className="font-montserrat font-black uppercase leading-none mb-8 text-text-primary"
            style={{ fontSize: 'clamp(3.5rem, 9vw, 8rem)' }}
          >
            Don&apos;t Miss<br />a Show.
          </h2>
        </AnimateIn>

        <AnimateIn delay={0.2} as="p" className="font-open-sans text-text-secondary text-xl mb-12 max-w-md mx-auto leading-relaxed">
          Monthly roundup of Final Friday lineups, new artists, and what&apos;s happening in St. Pete.
        </AnimateIn>

        <AnimateIn delay={0.3}>
          {status === 'success' ? (
            <p className="text-text-secondary font-open-sans text-xl">{message}</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={status === 'loading'}
                className="flex-1 text-text-primary placeholder-text-muted rounded-sm px-6 py-4 focus:outline-none text-base disabled:opacity-50 transition-colors"
                style={{ background: '#1C1C1C', border: '1px solid #488DB5' }}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="text-white px-8 py-4 rounded-sm font-montserrat font-bold text-base uppercase tracking-wide hover:opacity-90 transition-opacity whitespace-nowrap disabled:opacity-50"
                style={{ background: '#d71679' }}
              >
                {status === 'loading' ? '...' : 'Subscribe'}
              </button>
            </form>
          )}
        </AnimateIn>

        {status === 'error' && <p className="text-red-400 text-base mt-4">{message}</p>}
        <AnimateIn delay={0.4} as="p" className="font-open-sans text-text-muted text-base mt-6">
          No spam. Unsubscribe anytime.
        </AnimateIn>
      </div>
    </section>
  );
}

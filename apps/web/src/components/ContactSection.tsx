'use client';

import { useState } from 'react';
import { AnimateIn } from './AnimateIn';
import { pushEvent } from '@/lib/analytics';

export function ContactSection() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          website,
        }),
      });

      if (res.ok) {
        pushEvent('contact_form_submit');
        setStatus('success');
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
        setWebsite('');
        // Reset to idle after 5 seconds
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus('error');
        setErrorMessage(data.message ?? 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
    }
  }

  return (
    <section className="relative px-6 py-40 overflow-hidden bg-black">
      <div className="relative z-10 max-w-3xl mx-auto">
        <AnimateIn as="p" className="font-inter font-medium text-sm tracking-[0.5em] uppercase mb-6 text-center" style={{ color: '#FF8C00' }}>
          Get in Touch
        </AnimateIn>

        <AnimateIn delay={0.1}>
          <h2
            className="font-inter font-black uppercase leading-none mb-3 text-white text-center"
            style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)' }}
          >
            Send us a<br />Message
          </h2>
          <span className="section-underline mx-auto mb-12" style={{ display: 'block' }} />
        </AnimateIn>

        <AnimateIn delay={0.2}>
          {status === 'success' ? (
            <div className="text-center">
              <p className="text-white/80 font-inter text-xl mb-4">
                ✓ Thanks for reaching out! We&apos;ll be in touch soon.
              </p>
              <p className="text-white/60 font-inter text-sm">
                Check your email for our response.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-white/70 font-inter text-sm mb-2 tracking-wide uppercase">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  disabled={status === 'loading'}
                  className="w-full text-white placeholder-white/40 bg-white/10 border border-white/20 px-6 py-4 focus:outline-none focus:border-brand-orange text-base disabled:opacity-50 transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-white/70 font-inter text-sm mb-2 tracking-wide uppercase">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={status === 'loading'}
                  className="w-full text-white placeholder-white/40 bg-white/10 border border-white/20 px-6 py-4 focus:outline-none focus:border-brand-orange text-base disabled:opacity-50 transition-colors"
                />
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-white/70 font-inter text-sm mb-2 tracking-wide uppercase">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What is this about?"
                  disabled={status === 'loading'}
                  className="w-full text-white placeholder-white/40 bg-white/10 border border-white/20 px-6 py-4 focus:outline-none focus:border-brand-orange text-base disabled:opacity-50 transition-colors"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-white/70 font-inter text-sm mb-2 tracking-wide uppercase">
                  Message *
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Your message here..."
                  required
                  disabled={status === 'loading'}
                  rows={6}
                  className="w-full text-white placeholder-white/40 bg-white/10 border border-white/20 px-6 py-4 focus:outline-none focus:border-brand-orange text-base disabled:opacity-50 transition-colors resize-none"
                />
              </div>

              {/* Honeypot (hidden from users) */}
              <input
                type="text"
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
              />

              {/* Error message */}
              {status === 'error' && (
                <p className="text-red-400 text-sm mt-3" role="alert">
                  {errorMessage}
                </p>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full text-white px-8 py-4 font-inter font-bold text-base uppercase tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50 bg-brand-orange"
              >
                {status === 'loading' ? 'Sending...' : 'Send Message'}
              </button>

              <p className="font-inter text-white/40 text-xs text-center mt-4">
                * Required fields. We&apos;ll respond as soon as we can.
              </p>
            </form>
          )}
        </AnimateIn>
      </div>
    </section>
  );
}

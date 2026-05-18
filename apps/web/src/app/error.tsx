'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        path: window.location.pathname,
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-32 text-center bg-white">
      <div className="max-w-lg mx-auto">
        <p
          className="font-inter font-black text-8xl sm:text-9xl leading-none mb-4"
          style={{ color: '#FF8C00' }}
        >
          500
        </p>
        <h1 className="font-inter font-black text-3xl sm:text-4xl text-black mb-4">
          Something went wrong
        </h1>
        <p className="font-inter text-text-secondary text-lg mb-10">
          We hit a sour note. Try refreshing, or head back home.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="font-inter font-bold text-sm uppercase tracking-wide text-white px-8 py-3 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#FF8C00' }}
          >
            Try Again
          </button>
          <Link
            href="/"
            className="font-inter font-bold text-sm uppercase tracking-wide text-black px-8 py-3 border border-border hover:border-brand-burnt transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

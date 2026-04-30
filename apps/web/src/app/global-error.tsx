'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '2rem',
          fontFamily: 'Inter, system-ui, sans-serif',
          backgroundColor: '#FAFAF8',
          color: '#111',
        }}
      >
        <p style={{ fontSize: '5rem', fontWeight: 900, color: '#FF8C00', lineHeight: 1, marginBottom: '1rem' }}>
          Oops
        </p>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '2.5rem', maxWidth: '400px' }}>
          We hit a sour note on our end. Try again or head back home.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => reset()}
            style={{
              backgroundColor: '#FF8C00',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem 2rem',
              fontWeight: 700,
              fontSize: '0.875rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
          <a
            href="/"
            style={{
              backgroundColor: 'transparent',
              color: '#111',
              border: '1px solid #e2e2e2',
              borderRadius: '0.5rem',
              padding: '0.75rem 2rem',
              fontWeight: 700,
              fontSize: '0.875rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            Back to Home
          </a>
        </div>
      </body>
    </html>
  );
}

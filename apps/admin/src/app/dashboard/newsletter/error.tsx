'use client';

export default function NewsletterError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      <p className="font-medium">Failed to load newsletter page.</p>
      <p className="mt-1 text-xs text-muted-foreground">{error.message}</p>
      <button
        onClick={reset}
        className="mt-3 rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90"
      >
        Try again
      </button>
    </div>
  );
}

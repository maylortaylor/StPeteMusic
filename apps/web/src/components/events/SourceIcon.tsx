interface SourceIconProps {
  source: string | undefined;
  className?: string;
}

// lucide-react dropped brand/logo icons in the version this app depends on
// (see the generic-only apps/web platform-icon.tsx), so brand glyphs are
// inlined as SVG here rather than pulled from an icon package.
function FacebookGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      role="img"
      aria-label="Facebook event"
    >
      <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.51 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
    </svg>
  );
}

// Visual indicator of where an event was imported from. Add a case here
// when a new source (e.g. Instagram) gets its own icon.
export function SourceIcon({ source, className }: SourceIconProps) {
  if (source === 'facebook') {
    return <FacebookGlyph className={className ?? 'inline-block h-4 w-4 text-[#1877F2]'} />;
  }
  return null;
}

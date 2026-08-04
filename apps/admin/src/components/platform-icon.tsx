'use client';

import { ExternalLink, Link } from 'lucide-react';

interface PlatformIconProps {
  platform: string;
  size?: number;
  className?: string;
  showExternalIndicator?: boolean;
}

// lucide-react v1 removed all brand icons (Facebook/Instagram/Twitter/Youtube) for trademark
// reasons, so there is no per-platform glyph to map to any more. apps/web hit this first and
// settled on a generic link icon; admin now matches it rather than inventing a second answer.
// `platform` is kept in the props so callers and the component API are unchanged.
export function PlatformIcon({
  platform: _platform,
  size = 16,
  className,
  showExternalIndicator = true,
}: PlatformIconProps) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className ?? ''}`}>
      <Link size={size} />
      {showExternalIndicator && <ExternalLink size={size * 0.75} className='opacity-50' />}
    </span>
  );
}

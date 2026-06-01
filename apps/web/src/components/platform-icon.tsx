import { ExternalLink, Link } from 'lucide-react';

interface PlatformIconProps {
  platform: string;
  size?: number;
  className?: string;
  showExternalIndicator?: boolean;
}

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

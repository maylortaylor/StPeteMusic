'use client';

import {
  ExternalLink,
  Facebook,
  Instagram,
  Link,
  Twitter,
  Youtube,
  type LucideIcon,
} from 'lucide-react';

const PLATFORM_ICONS: Record<string, LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  twitter: Twitter,
};

interface PlatformIconProps {
  platform: string;
  size?: number;
  className?: string;
  showExternalIndicator?: boolean;
}

export function PlatformIcon({
  platform,
  size = 16,
  className,
  showExternalIndicator = true,
}: PlatformIconProps) {
  const Icon = PLATFORM_ICONS[platform.toLowerCase()] ?? Link;

  return (
    <span className={`inline-flex items-center gap-0.5 ${className ?? ''}`}>
      <Icon size={size} />
      {showExternalIndicator && <ExternalLink size={size * 0.75} className='opacity-50' />}
    </span>
  );
}

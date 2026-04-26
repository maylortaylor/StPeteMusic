'use client';

import Image from 'next/image';
import type { ComponentProps } from 'react';

type LightboxImageProps = ComponentProps<typeof Image> & {
  onOpen?: () => void;
};

export function LightboxImage({ onOpen, className, alt, ...props }: LightboxImageProps) {
  const imageProps = onOpen ? { onClick: onOpen } : {};
  return (
    <Image
      {...props}
      alt={alt || ''}
      className={onOpen ? `cursor-zoom-in select-none ${className ?? ''}` : className}
      {...imageProps}
    />
  );
}

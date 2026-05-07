'use client';

import { useEffect } from 'react';
import { trackMetaEvent } from '@/lib/meta-pixel';

interface Props {
  contentType: string;
  contentName: string;
}

export function MetaPixelViewContent({ contentType, contentName }: Props) {
  useEffect(() => {
    trackMetaEvent('ViewContent', { content_type: contentType, content_name: contentName });
  }, [contentType, contentName]);

  return null;
}

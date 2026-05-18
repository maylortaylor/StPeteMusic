'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ClerkProvider>
        {children}
        <Toaster position="top-right" richColors closeButton expand={false} duration={4000} />
      </ClerkProvider>
    </ThemeProvider>
  );
}

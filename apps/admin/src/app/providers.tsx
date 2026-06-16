'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';
import { Toaster } from 'sonner';

// Cast reconciles @types/react@18 (root, used by next-themes) vs @types/react@19 (this workspace)
const TypedThemeProvider = ThemeProvider as React.ComponentType<
  Omit<ThemeProviderProps, 'children'> & { children?: React.ReactNode }
>;

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TypedThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ClerkProvider>
        {children}
        <Toaster position="top-right" richColors closeButton expand={false} duration={4000} />
      </ClerkProvider>
    </TypedThemeProvider>
  );
}

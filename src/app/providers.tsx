'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { ProgressProvider } from '@/lib/data/progress-store';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <ProgressProvider>
        {children}
        <Toaster position="top-center" toastOptions={{ className: 'rounded-xl' }} />
      </ProgressProvider>
    </ThemeProvider>
  );
}

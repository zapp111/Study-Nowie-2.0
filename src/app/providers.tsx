'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { ContentProvider } from '@/lib/data/content-store';
import { ProgressProvider } from '@/lib/data/progress-store';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <ProgressProvider>
        <ContentProvider>{children}</ContentProvider>
        <Toaster position="top-center" toastOptions={{ className: 'rounded-xl' }} />
      </ProgressProvider>
    </ThemeProvider>
  );
}

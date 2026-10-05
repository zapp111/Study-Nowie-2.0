'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
    >
      {/* The server cannot know the theme, so this icon is allowed to differ until hydration. */}
      <span suppressHydrationWarning>{dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</span>
    </Button>
  );
}

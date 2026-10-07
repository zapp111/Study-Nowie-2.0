'use client';

import { Mail } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useGreeting } from '@/lib/data/greetings';

/**
 * The note he has left for her, shown above everything else on the dashboard.
 * Renders nothing at all when there is no note, so the page is unchanged.
 */
export function GreetingCard() {
  const { greeting, loading } = useGreeting();

  if (loading || !greeting) return null;

  return (
    <Card className="rise flex items-start gap-3 border-[var(--accent)]/30 bg-[var(--accent-soft)]">
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--accent)]"
        aria-hidden="true"
      >
        <Mail className="h-4 w-4" />
      </span>
      <p className="min-w-0 whitespace-pre-wrap text-sm leading-relaxed">{greeting.message}</p>
    </Card>
  );
}

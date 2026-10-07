'use client';

/**
 * The personal note that sits at the top of her dashboard.
 *
 * There is at most one active note at a time. Writing a new one retires the
 * previous one rather than overwriting it, so nothing written is ever lost.
 */

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export type Greeting = {
  id: string;
  message: string;
  createdAt: string;
};

type GreetingRow = {
  id: string;
  message: string;
  created_at: string;
};

/** The note she should see right now, or null when there is none. */
export async function fetchActiveGreeting(): Promise<Greeting | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('greetings')
    .select('id, message, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as GreetingRow;
  return { id: row.id, message: row.message, createdAt: row.created_at };
}

/** Replace the current note. Retires whatever was showing before. */
export async function saveGreeting(message: string): Promise<void> {
  const supabase = createClient();
  if (!supabase) throw new Error('The database is not connected yet');

  const trimmed = message.trim();
  if (!trimmed) throw new Error('Write something first');

  await retireActive();

  const { error } = await supabase.from('greetings').insert({ message: trimmed });
  if (error) throw error;
}

/** Take the current note down without deleting the text. */
export async function clearGreeting(): Promise<void> {
  await retireActive();
}

async function retireActive(): Promise<void> {
  const supabase = createClient();
  if (!supabase) throw new Error('The database is not connected yet');

  const { error } = await supabase.from('greetings').update({ is_active: false }).eq('is_active', true);
  if (error) throw error;
}

/** Read-side hook. Silent on failure, because a missing note must never break the page. */
export function useGreeting() {
  const [greeting, setGreeting] = React.useState<Greeting | null>(null);
  const [loading, setLoading] = React.useState(isSupabaseConfigured);

  const load = React.useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    try {
      setGreeting(await fetchActiveGreeting());
    } catch {
      setGreeting(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const handle = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(handle);
  }, [load]);

  return { greeting, loading, refresh: load };
}

'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

/**
 * Who is signed in, shown at the bottom of the sidebar, with the way out.
 * Hidden entirely in local mode because there is no account to leave.
 */
export function AccountPanel({ name, email }: { name: string; email: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  async function signOut() {
    const supabase = createClient();
    if (!supabase) return;

    setBusy(true);
    setFailed(false);

    const { error } = await supabase.auth.signOut();
    if (error) {
      setBusy(false);
      setFailed(true);
      return;
    }

    router.replace('/login');
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent)]"
        >
          {name.trim().charAt(0).toUpperCase() || '?'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm leading-tight font-medium">{name}</span>
          {email ? <span className="block truncate text-xs text-[var(--text-muted)]">{email}</span> : null}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label="Sign out"
          title="Sign out"
          onClick={signOut}
          disabled={busy}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      {failed ? (
        <p className="mt-2 text-xs text-red-600" role="alert">
          Could not sign out — check your connection and try again.
        </p>
      ) : null}
    </div>
  );
}

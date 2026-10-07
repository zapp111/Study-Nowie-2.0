'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Field, Textarea } from '@/components/ui/field';
import { clearGreeting, saveGreeting, useGreeting } from '@/lib/data/greetings';

/** Write a note that sits at the top of her dashboard until it is changed. */
export function GreetingAdmin({ connected }: { connected: boolean }) {
  const { greeting, loading, refresh } = useGreeting();
  const [message, setMessage] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  // Load whatever is currently showing into the box, so the note is edited
  // rather than rewritten from scratch. Adjusting during render is the
  // supported way to follow a changing value without an extra pass.
  const [syncedId, setSyncedId] = React.useState<string | null>(null);
  const activeId = greeting?.id ?? null;
  if (!loading && activeId !== syncedId) {
    setSyncedId(activeId);
    setMessage(greeting?.message ?? '');
  }

  const unchanged = message.trim() === (greeting?.message ?? '').trim();

  async function put(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await saveGreeting(message);
      toast.success('She will see it on her dashboard');
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the note');
    } finally {
      setBusy(false);
    }
  }

  async function takeDown() {
    setError('');
    setBusy(true);
    try {
      await clearGreeting();
      setMessage('');
      toast.success('Note taken down');
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not take the note down');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <form className="space-y-4" onSubmit={put}>
        <div>
          <CardTitle>A note for her</CardTitle>
          <CardDescription>
            Sits at the top of her dashboard until you change it or take it down. Leave it as long as you like.
          </CardDescription>
        </div>

        <Field label="Your note" htmlFor="greeting-message">
          <Textarea
            id="greeting-message"
            rows={4}
            maxLength={1000}
            value={message}
            disabled={!connected || loading}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Proud of u for sitting with the trigonometry yesterday. Today is a lighter one."
          />
        </Field>

        {error ? (
          <p
            className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-[var(--text-muted)]">
            {greeting ? 'A note is showing on her dashboard right now.' : 'Nothing is showing at the moment.'}
          </p>
          <div className="flex gap-2">
            {greeting ? (
              <Button type="button" variant="outline" size="sm" disabled={!connected || busy} onClick={takeDown}>
                Take it down
              </Button>
            ) : null}
            <Button type="submit" size="sm" disabled={!connected || busy || !message.trim() || unchanged}>
              {busy ? 'Saving…' : greeting ? 'Update the note' : 'Show this to her'}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}

'use client';

import { GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/field';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export function AuthForm({ mode }: { mode: 'signin' | 'signup' }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const signup = mode === 'signup';

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');

    const supabase = createClient();
    if (!supabase) {
      setError('No database is connected yet, so there is nothing to sign in to. The planner works without it.');
      return;
    }

    setBusy(true);
    try {
      if (signup) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name || email.split('@')[0] },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (signUpError) throw signUpError;
        setNotice('Check your email to confirm the account, then sign in.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.push(params.get('next') ?? '/');
        router.refresh();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That did not work. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-5 p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-white">
          <GraduationCap className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="text-xl font-semibold">{signup ? 'Create your account' : 'Welcome back'}</h1>
        <p className="text-sm text-[var(--text-muted)]">
          {signup ? 'So your progress follows you everywhere.' : 'Pick up exactly where you left off.'}
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {signup ? (
          <Field label="Name" htmlFor="name">
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </Field>
        ) : null}

        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </Field>

        <Field label="Password" error={error} htmlFor="password">
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={signup ? 'new-password' : 'current-password'}
          />
        </Field>

        {notice ? <p className="rounded-xl bg-[var(--accent-soft)] p-3 text-sm">{notice}</p> : null}

        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'One moment…' : signup ? 'Create account' : 'Sign in'}
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--text-muted)]">
        {signup ? 'Already have an account? ' : 'Need an account? '}
        <Link
          href={signup ? '/login' : '/signup'}
          className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
        >
          {signup ? 'Sign in' : 'Create one'}
        </Link>
      </p>

      {!isSupabaseConfigured ? (
        <p className="rounded-xl bg-[var(--surface-muted)] p-3 text-center text-xs text-[var(--text-muted)]">
          No database connected, so sign-in is off and everything is saved on this device.{' '}
          <Link href="/" className="font-medium text-[var(--accent)]">
            Go to the planner
          </Link>
        </p>
      ) : null}
    </Card>
  );
}

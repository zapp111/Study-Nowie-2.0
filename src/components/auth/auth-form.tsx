'use client';

import { Eye, EyeOff, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/field';
import { ToastStack, useToasts } from '@/components/ui/toast';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';

/**
 * Supabase returns terse, technical messages. Turn the ones people actually hit
 * into plain language that says what to do next.
 */
function readableError(message: string, signup: boolean): { title: string; detail?: string } {
  const text = message.toLowerCase();

  if (text.includes('invalid login credentials')) {
    return {
      title: 'No account matches that email and password',
      detail: 'Check for a typo, or create an account if you have not made one yet.',
    };
  }
  if (text.includes('email not confirmed')) {
    return {
      title: 'This account still needs confirming',
      detail: 'Open the confirmation link in your inbox, then sign in again.',
    };
  }
  if (text.includes('already registered') || text.includes('already been registered')) {
    return { title: 'That email already has an account', detail: 'Sign in instead, below.' };
  }
  if (text.includes('password should be') || text.includes('weak password')) {
    return { title: 'That password is too short', detail: 'Use at least six characters.' };
  }
  if (text.includes('rate limit') || text.includes('too many')) {
    return { title: 'Too many tries in a row', detail: 'Wait a minute and try once more.' };
  }
  if (text.includes('fetch') || text.includes('network')) {
    return { title: 'Could not reach the server', detail: 'Check your connection and try again.' };
  }
  if (text.includes('invalid') && text.includes('email')) {
    return { title: 'That email address does not look right' };
  }

  return { title: signup ? 'Could not create the account' : 'Could not sign in', detail: message };
}

export function AuthForm({ mode }: { mode: 'signin' | 'signup' }) {
  const router = useRouter();
  const params = useSearchParams();
  const { toasts, push, dismiss } = useToasts();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [reveal, setReveal] = React.useState(false);
  const [notice, setNotice] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const signup = mode === 'signup';

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setNotice('');

    const supabase = createClient();
    if (!supabase) {
      push('error', 'No database is connected yet', 'There is nothing to sign in to, but the planner still works.');
      return;
    }

    setBusy(true);
    try {
      if (signup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name || email.split('@')[0] },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;

        // With email confirmation switched off the account is usable straight
        // away, so go in rather than asking for an email that never arrives.
        if (data.session) {
          push('success', 'Account created. Welcome in.');
          router.push(params.get('next') ?? '/');
          router.refresh();
          return;
        }

        setNotice('Account made. Open the confirmation link in your email, then sign in.');
        push('success', 'Account created', 'Confirm it from your inbox to sign in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(params.get('next') ?? '/');
        router.refresh();
      }
    } catch (cause) {
      const raw = cause instanceof Error ? cause.message : 'That did not work. Try again.';
      const { title, detail } = readableError(raw, signup);
      push('error', title, detail);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ToastStack toasts={toasts} onDismiss={dismiss} />

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

          <Field label="Password" htmlFor="password">
            {/* The toggle sits beside the input rather than on top of it, so a long
                password can never run underneath the icon. */}
            <div className="flex items-stretch overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-colors focus-within:border-[var(--accent)]">
              <Input
                id="password"
                type={reveal ? 'text' : 'password'}
                required
                minLength={6}
                className="min-w-0 flex-1 rounded-none border-0 bg-transparent focus:border-0"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={signup ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                onClick={() => setReveal((v) => !v)}
                aria-label={reveal ? 'Hide password' : 'Show password'}
                aria-pressed={reveal}
                className="flex w-11 shrink-0 items-center justify-center border-l border-[var(--border)] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--accent)]"
              >
                {reveal ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
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
    </>
  );
}

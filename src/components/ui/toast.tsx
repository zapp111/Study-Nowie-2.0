'use client';

import { CheckCircle2, X, XCircle } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

export type ToastTone = 'error' | 'success';

export type Toast = {
  id: number;
  tone: ToastTone;
  title: string;
  detail?: string;
};

/**
 * A small floating message that slides in over the top of the page. Used for
 * things worth interrupting someone about — a failed sign-in, a saved change —
 * rather than quiet inline hints.
 */
export function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const error = toast.tone === 'error';
  const Icon = error ? XCircle : CheckCircle2;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'pointer-events-auto flex w-full max-w-sm animate-[toast-in_200ms_ease-out] items-start gap-3 rounded-2xl border p-3.5 shadow-lg shadow-black/5 backdrop-blur',
        error
          ? 'border-red-200 bg-red-50/95 text-red-900 dark:border-red-900/60 dark:bg-red-950/90 dark:text-red-100'
          : 'border-emerald-200 bg-emerald-50/95 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/90 dark:text-emerald-100',
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.detail ? <p className="mt-0.5 text-xs opacity-90">{toast.detail}</p> : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-lg p-1 opacity-60 transition-opacity hover:opacity-100"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/** Keeps a short queue of toasts and clears each one after a few seconds. */
export function useToasts(timeout = 6000) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const timers = React.useRef<number[]>([]);

  React.useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  const dismiss = React.useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = React.useCallback(
    (tone: ToastTone, title: string, detail?: string) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current.slice(-2), { id, tone, title, detail }]);
      timers.current.push(window.setTimeout(() => dismiss(id), timeout));
    },
    [dismiss, timeout],
  );

  return { toasts, push, dismiss };
}

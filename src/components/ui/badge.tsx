import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const badge = cva('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', {
  variants: {
    tone: {
      accent: 'bg-[var(--accent-soft)] text-[var(--accent)]',
      neutral: 'bg-[var(--surface-muted)] text-[var(--text-muted)]',
      success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
      warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
      danger: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
      info: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge>) {
  return <span className={cn(badge({ tone }), className)} {...props} />;
}

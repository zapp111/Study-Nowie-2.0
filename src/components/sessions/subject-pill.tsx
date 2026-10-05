import { cn } from '@/lib/utils';

const ACCENTS: Record<string, string> = {
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
};

export function SubjectPill({ accent, label, className }: { accent: string; label: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-7 shrink-0 items-center rounded-full px-2.5 text-xs font-semibold',
        ACCENTS[accent] ?? ACCENTS.rose,
        className,
      )}
    >
      {label}
    </span>
  );
}

export function accentClass(accent: string) {
  return ACCENTS[accent] ?? ACCENTS.rose;
}

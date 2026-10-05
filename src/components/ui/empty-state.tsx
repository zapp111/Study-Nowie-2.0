import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('card flex flex-col items-center gap-3 px-6 py-12 text-center', className)}>
      {Icon ? (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      ) : null}
      <p className="font-medium">{title}</p>
      {description ? <p className="max-w-sm text-sm text-[var(--text-muted)]">{description}</p> : null}
      {action}
    </div>
  );
}

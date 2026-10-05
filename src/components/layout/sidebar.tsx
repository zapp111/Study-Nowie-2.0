'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_ITEMS, BRAND_ICON, NAV_ITEMS } from './nav-items';
import { cn, daysUntil } from '@/lib/utils';
import { useProgress } from '@/lib/data/progress-store';

export function SidebarContent({ onNavigate, isAdmin }: { onNavigate?: () => void; isAdmin?: boolean }) {
  const pathname = usePathname();
  const { state } = useProgress();
  const left = daysUntil(state.profile.examDate);
  const items = isAdmin ? [...NAV_ITEMS, ...ADMIN_ITEMS] : NAV_ITEMS;

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5 px-2 py-1">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)] text-white">
          <BRAND_ICON className="h-5 w-5" aria-hidden="true" />
        </span>
        <span>
          <span className="block text-sm leading-tight font-semibold">Study Nowie</span>
          <span className="block text-xs text-[var(--text-muted)]">Class 10 boards</span>
        </span>
      </Link>

      <nav aria-label="Main" className="flex-1">
        <ul className="space-y-1">
          {items.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                    active
                      ? 'bg-[var(--accent-soft)] font-medium text-[var(--accent)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]',
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="rounded-xl bg-[var(--accent-soft)] p-4">
        <p className="text-2xl font-semibold text-[var(--accent)]">{left > 0 ? left : 0}</p>
        <p className="text-xs text-[var(--text-muted)]">
          {left > 0 ? 'days until your first paper' : 'boards have started — you have got this'}
        </p>
      </div>
    </div>
  );
}

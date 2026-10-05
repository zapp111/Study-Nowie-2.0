import { v5 as uuidv5 } from 'uuid';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function pct(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

const DAY = 86_400_000;

export function todayIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString().slice(0, 10);
}

export function daysUntil(iso: string, from = todayIso()): number {
  return Math.round((new Date(`${iso}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / DAY);
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }): string {
  return new Intl.DateTimeFormat('en-IN', { ...opts, timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
}

export function formatLongDate(iso: string): string {
  return formatDate(iso, { weekday: 'long', day: 'numeric', month: 'long' });
}

export function formatMinutes(total: number): string {
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

/**
 * Deterministic ids.
 *
 * The bundled plan and the database rows have to agree on primary keys, so
 * every id is a UUID derived from a stable slug. Running the seed twice, or
 * seeding a second project for staging, produces exactly the same keys.
 */
const ID_NAMESPACE = '9b1d2f54-4a0e-5c7b-8f3a-6d2c1e0b7a45';

export function slugId(...parts: (string | number)[]): string {
  const slug = parts
    .join('-')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return uuidv5(slug, ID_NAMESPACE);
}

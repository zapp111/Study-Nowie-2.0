import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-medium text-[var(--accent)]">Page not found</p>
      <h1 className="text-2xl font-semibold">That page does not exist</h1>
      <p className="max-w-sm text-sm text-[var(--text-muted)]">
        The link may be old. Everything is still where you left it on the dashboard.
      </p>
      <Button asChild>
        <Link href="/">Back to today</Link>
      </Button>
    </div>
  );
}

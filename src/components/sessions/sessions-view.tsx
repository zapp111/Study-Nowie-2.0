'use client';

import { CalendarDays, Check, Lock, Search } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { SubjectPill } from './subject-pill';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';
import { ProgressBar } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { PHASES, SESSIONS, type Phase } from '@/lib/data/content';
import { useProgress } from '@/lib/data/progress-store';
import { isSessionLocked } from '@/lib/data/rules';
import { sessionProgress } from '@/lib/data/stats';
import { formatDate, formatMinutes, todayIso } from '@/lib/utils';

export function SessionsView() {
  const { state, ready } = useProgress();
  const v = React.useMemo(() => ({ mathsLevel: state.profile.mathsLevel }), [state.profile.mathsLevel]);
  const today = todayIso();
  const [phase, setPhase] = React.useState<Phase | 'all'>('all');
  const [query, setQuery] = React.useState('');

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return SESSIONS.filter((s) => {
      if (phase !== 'all' && s.phase !== phase) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.focusTopics.some((t) => t.toLowerCase().includes(q)) ||
        s.blocks.some((b) => b.chapterName.toLowerCase().includes(q))
      );
    });
  }, [phase, query]);

  const todayRef = React.useRef<HTMLLIElement>(null);
  React.useEffect(() => {
    todayRef.current?.scrollIntoView({ block: 'center' });
  }, [ready]);

  if (!ready) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-48" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Study plan"
        description={`${SESSIONS.length} days from 5 October to the last paper on 7 March. Highest-weightage chapters come first.`}
      />

      <div className="mb-5 space-y-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
            aria-hidden="true"
          />
          <Input
            className="pl-9"
            placeholder="Search a chapter, like Trigonometry or Life Processes"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search the plan"
          />
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by phase">
          <Button variant={phase === 'all' ? 'soft' : 'outline'} size="sm" onClick={() => setPhase('all')}>
            All
          </Button>
          {PHASES.map((p) => (
            <Button
              key={p.id}
              variant={phase === p.id ? 'soft' : 'outline'}
              size="sm"
              onClick={() => setPhase(p.id)}
              title={p.blurb}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card px-6 py-12 text-center">
          <p className="font-medium">Nothing matches that</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Try a chapter name, or clear the search.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((session) => {
            const progress = sessionProgress(session, state, v);
            const locked = isSessionLocked(session, state, v);
            const isToday = session.date === today;
            const past = session.date < today;

            return (
              <li key={session.id} ref={isToday ? todayRef : undefined}>
                <Link
                  href={`/sessions/${session.number}`}
                  className="card block p-4 transition-colors hover:bg-[var(--surface-muted)]"
                  aria-current={isToday ? 'date' : undefined}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatDate(session.date, { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                    {isToday ? <Badge tone="accent">Today</Badge> : null}
                    {progress.complete ? (
                      <Badge tone="success">
                        <Check className="h-3 w-3" aria-hidden="true" /> Done
                      </Badge>
                    ) : null}
                    {!progress.complete && past && progress.total > 0 ? <Badge tone="warning">Missed</Badge> : null}
                    {locked ? (
                      <Badge tone="neutral">
                        <Lock className="h-3 w-3" aria-hidden="true" /> Locked
                      </Badge>
                    ) : null}
                    {session.isPaperDay ? <Badge tone="danger">Paper day</Badge> : null}
                    <span className="ml-auto text-xs text-[var(--text-muted)]">
                      {formatMinutes(session.totalMinutes)}
                    </span>
                  </div>

                  <p className="mt-2 font-medium">{session.title}</p>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {session.blocks.map((block) => (
                      <SubjectPill key={block.id} accent={block.accent} label={block.shortName} />
                    ))}
                  </div>

                  {progress.total > 0 ? (
                    <div className="mt-3 flex items-center gap-3">
                      <ProgressBar
                        value={progress.percent}
                        className="flex-1"
                        label={`Day ${session.number} progress`}
                      />
                      <span className="text-xs text-[var(--text-muted)] tabular-nums">
                        {progress.done}/{progress.total}
                      </span>
                    </div>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

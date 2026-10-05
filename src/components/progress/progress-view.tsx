'use client';

import { AlertTriangle, TrendingUp } from 'lucide-react';
import * as React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { SubjectPill } from '@/components/sessions/subject-pill';
import { Badge } from '@/components/ui/badge';
import { Card, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ProgressBar, ProgressRing } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useContent } from '@/lib/data/content-store';
import { useProgress } from '@/lib/data/progress-store';
import { completedSessions, overallProgress, pacing, streak, subjectProgress, weakAreas } from '@/lib/data/stats';
import { formatMinutes } from '@/lib/utils';

export function ProgressView() {
  const { state, ready } = useProgress();
  const { sessions, loading } = useContent();
  const v = React.useMemo(() => ({ mathsLevel: state.profile.mathsLevel }), [state.profile.mathsLevel]);

  const overall = React.useMemo(() => overallProgress(sessions, state, v), [sessions, state, v]);
  const subjects = React.useMemo(() => subjectProgress(sessions, state, v), [sessions, state, v]);
  const weak = React.useMemo(() => weakAreas(sessions, state), [sessions, state]);
  const pace = React.useMemo(() => pacing(sessions, state, v), [sessions, state, v]);
  const done = React.useMemo(() => completedSessions(sessions, state, v), [sessions, state, v]);
  const streaks = React.useMemo(() => streak(state), [state]);
  const totalMinutes = Object.values(state.minutes).reduce((sum, m) => sum + m, 0);

  if (!ready || loading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Progress"
        description="The honest version. Where you actually are, not where the plan hoped you would be."
      />

      <Card className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <ProgressRing value={overall.percent} size={128}>
          <span className="text-2xl font-semibold">{overall.percent}%</span>
          <span className="text-[11px] text-[var(--text-muted)]">overall</span>
        </ProgressRing>
        <div className="grid flex-1 grid-cols-2 gap-4 text-center sm:text-left">
          <Stat label="Tasks done" value={`${overall.done}`} sub={`of ${overall.total}`} />
          <Stat label="Days completed" value={`${done.length}`} sub="every task ticked" />
          <Stat label="Current streak" value={`${streaks.current}`} sub={`best ${streaks.best}`} />
          <Stat label="Time logged" value={formatMinutes(totalMinutes)} sub="since you started" />
        </div>
      </Card>

      <Card
        className={
          pace.onTrack ? 'border-emerald-200 dark:border-emerald-900' : 'border-amber-200 dark:border-amber-900'
        }
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)]">
            {pace.onTrack ? (
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            )}
          </span>
          <div>
            <CardTitle>{pace.onTrack ? 'You are on track' : 'You are behind the plan'}</CardTitle>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {pace.onTrack
                ? `${pace.done} tasks done against ${pace.expected} expected by today. Keep this rhythm.`
                : `${pace.done} tasks done against ${pace.expected} expected by today — ${pace.behindBy} behind. Catch up on the highest-weightage chapters first rather than going in order.`}
            </p>
          </div>
        </div>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">By subject</h2>
        <div className="space-y-3">
          {subjects.map((row) => (
            <Card key={row.subject.slug} className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <SubjectPill accent={row.subject.accent} label={row.subject.shortName} />
                <span className="font-medium">{row.subject.name}</span>
                <span className="ml-auto text-sm text-[var(--text-muted)] tabular-nums">{row.percent}%</span>
              </div>
              <ProgressBar value={row.percent} label={`${row.subject.name} progress`} />
              <div className="flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
                <Badge tone="neutral">
                  {row.done}/{row.total} tasks
                </Badge>
                {row.quizAverage != null ? (
                  <Badge tone={row.quizAverage >= 70 ? 'success' : 'warning'}>Quiz average {row.quizAverage}%</Badge>
                ) : (
                  <Badge tone="neutral">No quizzes yet</Badge>
                )}
                <Badge tone="info">Paper in {row.daysToPaper} days</Badge>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Weak areas</h2>
        {weak.length === 0 ? (
          <EmptyState
            title="Nothing flagged yet"
            description="Once you have taken a few quizzes, the chapters losing you the most marks will show up here — worst scores on the heaviest chapters first."
          />
        ) : (
          <ul className="space-y-2">
            {weak.map((row) => (
              <li key={`${row.subjectSlug}-${row.chapterName}`} className="card flex items-center gap-3 p-4">
                <SubjectPill accent="rose" label={row.shortName} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{row.chapterName}</p>
                  <p className="text-xs text-[var(--text-muted)]">{row.weightage} marks in the paper</p>
                </div>
                <Badge tone="warning">{row.percent}%</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-[var(--text-muted)]">{sub}</p>
    </div>
  );
}

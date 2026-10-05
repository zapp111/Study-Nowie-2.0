'use client';

import { ArrowRight, BookOpen, CalendarClock, CheckCircle2, Flame, NotebookPen, Sparkles, Target } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { SubjectPill } from '@/components/sessions/subject-pill';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { ProgressBar, ProgressRing } from '@/components/ui/progress';
import { CardSkeleton, Skeleton } from '@/components/ui/skeleton';
import { PHASES, SESSIONS, sessionForDate } from '@/lib/data/content';
import { useProgress } from '@/lib/data/progress-store';
import {
  blockProgress,
  completedSessions,
  overallProgress,
  pacing,
  pendingQuizzes,
  sessionProgress,
  smallestNextStep,
  streak,
} from '@/lib/data/stats';
import { daysUntil, formatLongDate, formatMinutes, greeting, todayIso } from '@/lib/utils';

export function DashboardView({ fallbackName }: { fallbackName: string }) {
  const { state, ready } = useProgress();
  const name = state.profile.displayName || fallbackName;
  const v = React.useMemo(() => ({ mathsLevel: state.profile.mathsLevel }), [state.profile.mathsLevel]);
  const today = todayIso();

  const session = React.useMemo(() => sessionForDate(today), [today]);
  const overall = React.useMemo(() => overallProgress(state, v), [state, v]);
  const sProgress = React.useMemo(() => sessionProgress(session, state, v), [session, state, v]);
  const pace = React.useMemo(() => pacing(state, v), [state, v]);
  const quizzes = React.useMemo(() => pendingQuizzes(state, v, 4), [state, v]);
  const done = React.useMemo(() => completedSessions(state, v), [state, v]);
  const nextStep = React.useMemo(() => smallestNextStep(state, v), [state, v]);
  const streaks = React.useMemo(() => streak(state), [state]);

  const daysLeft = daysUntil(state.profile.examDate);
  const phase = PHASES.find((p) => today >= p.from && today <= p.to) ?? PHASES[PHASES.length - 1];
  const goal = state.profile.dailyGoalMinutes;
  const upcoming = SESSIONS.filter((s) => s.date > today).slice(0, 3);
  const dueMistakes = state.mistakes.filter((m) => !m.resolvedAt && m.reattemptOn <= today);

  if (!ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="rise">
        <p className="text-sm text-[var(--text-muted)]">{formatLongDate(today)}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          <span suppressHydrationWarning>{greeting()}</span>, {name}
        </h1>
      </header>

      {/* Countdown, framed with what is done rather than as a bare number. */}
      <Card className="rise flex flex-col gap-5 bg-gradient-to-br from-[var(--accent-soft)] to-[var(--surface)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <ProgressRing value={overall.percent} size={104}>
            <span className="text-xl font-semibold">{overall.percent}%</span>
            <span className="text-[11px] text-[var(--text-muted)]">of the plan</span>
          </ProgressRing>
          <div>
            <p className="text-3xl font-semibold text-[var(--accent)]">{Math.max(daysLeft, 0)} days</p>
            <p className="text-sm text-[var(--text-muted)]">until your first paper, Maths on 17 February</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone="accent">{phase.label}</Badge>
              {streaks.current > 0 ? (
                <Badge tone="warning">
                  <Flame className="h-3 w-3" aria-hidden="true" /> {streaks.current} day streak
                </Badge>
              ) : null}
              <Badge tone={pace.onTrack ? 'success' : 'neutral'}>
                {pace.onTrack ? 'On track' : `${pace.behindBy} tasks to catch up`}
              </Badge>
            </div>
          </div>
        </div>

        <div className="w-full sm:w-44">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Today</span>
            <span>
              {formatMinutes(streaks.todayMinutes)} / {formatMinutes(goal)}
            </span>
          </div>
          <ProgressBar className="mt-1.5" value={(streaks.todayMinutes / goal) * 100} label="Minutes studied today" />
        </div>
      </Card>

      {/* One tap, lowest possible barrier, for the days with no energy. */}
      {nextStep ? (
        <Card className="rise flex flex-wrap items-center justify-between gap-3 border-dashed">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <CardTitle>If you only do one thing today</CardTitle>
              <p className="mt-0.5 truncate text-sm text-[var(--text-muted)]">
                {nextStep.item.label} — {nextStep.block.shortName}, {nextStep.block.chapterName}
                {nextStep.item.minutes ? ` · ${nextStep.item.minutes} min` : ''}
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="soft">
            <Link href={`/sessions/${nextStep.session.number}`}>Start</Link>
          </Button>
        </Card>
      ) : null}

      {/* Today's plan */}
      <section className="rise space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Today&rsquo;s plan</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/sessions">
              All days <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium">{session.title}</p>
              <p className="text-sm text-[var(--text-muted)]">{session.summary}</p>
            </div>
            <Badge tone={sProgress.complete ? 'success' : 'neutral'}>
              {sProgress.done}/{sProgress.total} done
            </Badge>
          </div>

          <ProgressBar value={sProgress.percent} label="Today's progress" />

          <ul className="space-y-2">
            {session.blocks.map((block) => {
              const bp = blockProgress(block, state, v);
              return (
                <li key={block.id}>
                  <Link
                    href={`/sessions/${session.number}#${block.subjectSlug}`}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border)] px-3 py-2.5 transition-colors hover:bg-[var(--surface-muted)]"
                  >
                    <SubjectPill accent={block.accent} label={block.shortName} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{block.chapterName}</span>
                      <span className="block truncate text-xs text-[var(--text-muted)]">
                        {formatMinutes(block.minutes)} · {bp.done}/{bp.total} tasks
                        {block.weightage ? ` · ${block.weightage} marks` : ''}
                      </span>
                    </span>
                    {bp.complete ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" aria-label="Complete" />
                    ) : (
                      <span className="shrink-0 text-xs text-[var(--text-muted)]">{bp.percent}%</span>
                    )}
                  </Link>
                </li>
              );
            })}
            {session.blocks.length === 0 ? (
              <li className="rounded-xl bg-[var(--accent-soft)] px-4 py-3 text-sm">
                Paper day. Nothing to tick — go and write it.
              </li>
            ) : null}
          </ul>

          <Button asChild className="w-full sm:w-auto">
            <Link href={`/sessions/${session.number}`}>
              {sProgress.touched ? 'Continue studying' : 'Start studying'} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </section>

      {/* Quick cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <QuickCard
          icon={BookOpen}
          title="Pending quizzes"
          value={quizzes.length}
          caption={
            quizzes.length
              ? quizzes
                  .map((q) => q.block.chapterName)
                  .slice(0, 2)
                  .join(', ')
              : 'Nothing waiting'
          }
          href="/quizzes"
        />
        <QuickCard
          icon={CheckCircle2}
          title="Completed days"
          value={done.length}
          caption={done.length ? 'Fully finished, every task ticked' : 'Finish a day to see it here'}
          href="/completed"
        />
        <QuickCard
          icon={NotebookPen}
          title="Mistakes due"
          value={dueMistakes.length}
          caption={dueMistakes.length ? 'Reattempt these today' : 'Nothing to reattempt'}
          href="/mistakes"
        />
        <QuickCard
          icon={Target}
          title="Overall progress"
          value={`${overall.percent}%`}
          caption={`${overall.done} of ${overall.total} tasks`}
          href="/progress"
        />
      </div>

      {/* Upcoming */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Coming up</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {upcoming.map((next) => (
            <Link
              key={next.id}
              href={`/sessions/${next.number}`}
              className="card flex flex-col gap-1.5 p-4 transition-colors hover:bg-[var(--surface-muted)]"
            >
              <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                {formatLongDate(next.date)}
              </span>
              <span className="text-sm font-medium">Day {next.number}</span>
              <span className="line-clamp-2 text-xs text-[var(--text-muted)]">{next.focusTopics.join(' · ')}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function QuickCard({
  icon: Icon,
  title,
  value,
  caption,
  href,
}: {
  icon: React.ElementType;
  title: string;
  value: React.ReactNode;
  caption: string;
  href: string;
}) {
  return (
    <Link href={href} className="card flex items-center gap-4 p-5 transition-colors hover:bg-[var(--surface-muted)]">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-xl font-semibold">{value}</span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block truncate text-xs text-[var(--text-muted)]">{caption}</span>
      </span>
    </Link>
  );
}

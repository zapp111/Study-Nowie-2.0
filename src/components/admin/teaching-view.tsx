'use client';

/**
 * What she has actually done, and what to teach next.
 *
 * Reads her rows directly — admins can see them under row level security — and
 * turns them into the two things you need before a session: what landed, and
 * what did not.
 */

import { AlertTriangle, CheckCircle2, Clock, Flame } from 'lucide-react';
import * as React from 'react';
import { SubjectPill } from '@/components/sessions/subject-pill';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ProgressBar } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { SUBJECT_LIST } from '@/lib/data/content';
import { useContent } from '@/lib/data/content-store';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatMinutes, pct } from '@/lib/utils';

type StudentRow = { id: string; name: string };

type Snapshot = {
  completedItemIds: Set<string>;
  attempts: { quizId: string; score: number; total: number; createdAt: string }[];
  chapterStates: Record<string, string>;
  minutes: Record<string, number>;
  mistakes: { question: string; reattemptOn: string; resolvedAt: string | null }[];
};

export function TeachingView({ connected }: { connected: boolean }) {
  const { sessions } = useContent();
  const [students, setStudents] = React.useState<StudentRow[]>([]);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [snapshot, setSnapshot] = React.useState<Snapshot | null>(null);
  const [loading, setLoading] = React.useState(connected);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!connected) return;
    const supabase = createClient();
    if (!supabase) return;

    void (async () => {
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .order('created_at');
      if (queryError) {
        setError(queryError.message);
        setLoading(false);
        return;
      }
      const rows = (data ?? []).map((p) => ({ id: p.id, name: p.display_name as string }));
      setStudents(rows);
      setSelected((current) => current ?? rows[0]?.id ?? null);
      setLoading(false);
    })();
  }, [connected]);

  React.useEffect(() => {
    if (!connected || !selected) return;
    const supabase = createClient();
    if (!supabase) return;

    void (async () => {
      setLoading(true);
      const [checklist, attempts, chapters, log, mistakes] = await Promise.all([
        supabase.from('checklist_progress').select('checklist_item_id').eq('user_id', selected).eq('is_complete', true),
        supabase
          .from('quiz_attempts')
          .select('quiz_id, score, total, created_at')
          .eq('user_id', selected)
          .order('created_at', { ascending: false }),
        supabase.from('chapter_progress').select('chapter_id, state').eq('user_id', selected),
        supabase.from('study_log').select('logged_on, minutes').eq('user_id', selected),
        supabase.from('mistakes').select('question, reattempt_on, resolved_at').eq('user_id', selected),
      ]);

      setSnapshot({
        completedItemIds: new Set((checklist.data ?? []).map((r) => r.checklist_item_id as string)),
        attempts: (attempts.data ?? []).map((r) => ({
          quizId: r.quiz_id as string,
          score: r.score as number,
          total: r.total as number,
          createdAt: r.created_at as string,
        })),
        chapterStates: Object.fromEntries(
          (chapters.data ?? []).map((r) => [r.chapter_id as string, r.state as string]),
        ),
        minutes: Object.fromEntries((log.data ?? []).map((r) => [r.logged_on as string, r.minutes as number])),
        mistakes: (mistakes.data ?? []).map((r) => ({
          question: r.question as string,
          reattemptOn: r.reattempt_on as string,
          resolvedAt: r.resolved_at as string | null,
        })),
      });
      setLoading(false);
    })();
  }, [connected, selected]);

  if (!connected) {
    return (
      <Card>
        <CardTitle>Connect the database to see this</CardTitle>
        <CardDescription className="mt-1">
          Her progress is kept on her own device until an account exists. Once the two environment variables are set and
          she signs in, everything she ticks appears here.
        </CardDescription>
      </Card>
    );
  }

  if (loading && !snapshot) return <Skeleton className="h-64 w-full" />;

  if (error) {
    return (
      <Card>
        <CardTitle>Could not load her progress</CardTitle>
        <CardDescription className="mt-1">{error}</CardDescription>
      </Card>
    );
  }

  if (students.length === 0) {
    return (
      <EmptyState
        title="No accounts yet"
        description="Once she signs up, her name appears here and everything she does shows up with it."
      />
    );
  }

  const done = snapshot?.completedItemIds ?? new Set<string>();

  // Per-subject state across every day currently in the plan.
  const subjectRows = SUBJECT_LIST.map((subject) => {
    const blocks = sessions.flatMap((s) =>
      s.blocks.filter((b) => b.subjectSlug === subject.slug).map((b) => ({ session: s, block: b })),
    );
    let total = 0;
    let complete = 0;
    const finishedChapters: string[] = [];
    const unfinished: { date: string; chapter: string; left: number }[] = [];

    for (const { session, block } of blocks) {
      const required = block.checklist.filter((i) => !i.optional && !i.standardOnly);
      const ticked = required.filter((i) => done.has(i.id)).length;
      total += required.length;
      complete += ticked;
      if (required.length && ticked === required.length) finishedChapters.push(block.chapterName);
      else if (required.length)
        unfinished.push({ date: session.date, chapter: block.chapterName, left: required.length - ticked });
    }

    const quizIds = new Set(blocks.map(({ block }) => block.quiz?.id).filter(Boolean) as string[]);
    const subjectAttempts = (snapshot?.attempts ?? []).filter((a) => quizIds.has(a.quizId));
    const average = subjectAttempts.length
      ? Math.round(subjectAttempts.reduce((sum, a) => sum + (a.score / a.total) * 100, 0) / subjectAttempts.length)
      : null;

    return { subject, total, complete, finishedChapters, unfinished, average, attempts: subjectAttempts.length };
  }).filter((row) => row.total > 0);

  const totalMinutes = Object.values(snapshot?.minutes ?? {}).reduce((sum, m) => sum + m, 0);
  const activeDays = Object.values(snapshot?.minutes ?? {}).filter((m) => m > 0).length;
  const openMistakes = (snapshot?.mistakes ?? []).filter((m) => !m.resolvedAt);

  // The teaching queue: unfinished work, oldest first, because that is what has
  // actually been skipped rather than simply not reached yet.
  const toTeach = subjectRows
    .flatMap((row) => row.unfinished.map((u) => ({ ...u, subject: row.subject })))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  const weakQuizzes = (snapshot?.attempts ?? [])
    .filter((a) => a.score / a.total < 0.7)
    .slice(0, 5)
    .map((attempt) => {
      const match = sessions.flatMap((s) => s.blocks).find((b) => b.quiz?.id === attempt.quizId);
      return { ...attempt, chapter: match?.chapterName ?? 'Quiz', shortName: match?.shortName ?? '' };
    });

  return (
    <div className="space-y-5">
      {students.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {students.map((student) => (
            <button
              key={student.id}
              type="button"
              aria-pressed={selected === student.id}
              onClick={() => setSelected(student.id)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
                selected === student.id
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--surface)] text-[var(--text-muted)]'
              }`}
            >
              {student.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
          <div>
            <p className="text-lg font-semibold">{formatMinutes(totalMinutes)}</p>
            <p className="text-xs text-[var(--text-muted)]">logged over {activeDays} days</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <Flame className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
          <div>
            <p className="text-lg font-semibold">{snapshot?.attempts.length ?? 0}</p>
            <p className="text-xs text-[var(--text-muted)]">quiz attempts</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
          <div>
            <p className="text-lg font-semibold">{openMistakes.length}</p>
            <p className="text-xs text-[var(--text-muted)]">open mistakes</p>
          </div>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Teach next</h2>
        {toTeach.length === 0 ? (
          <Card>
            <CardDescription>
              Nothing outstanding in the plan as it stands. Add the next day and it will show up here.
            </CardDescription>
          </Card>
        ) : (
          <ul className="space-y-2">
            {toTeach.map((row, i) => (
              <li key={`${row.chapter}-${i}`} className="card flex items-center gap-3 p-4">
                <SubjectPill accent={row.subject.accent} label={row.subject.shortName} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{row.chapter}</p>
                  <p className="text-xs text-[var(--text-muted)]">from {formatDate(row.date)}</p>
                </div>
                <Badge tone="warning">{row.left} left</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      {weakQuizzes.length ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Scored under 70%</h2>
          <ul className="space-y-2">
            {weakQuizzes.map((row, i) => (
              <li key={`${row.quizId}-${i}`} className="card flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{row.chapter}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {row.shortName} · {formatDate(row.createdAt.slice(0, 10))}
                  </p>
                </div>
                <Badge tone="danger">
                  {row.score}/{row.total}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">By subject</h2>
        {subjectRows.map((row) => (
          <Card key={row.subject.slug} className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <SubjectPill accent={row.subject.accent} label={row.subject.shortName} />
              <span className="text-sm font-medium">{row.subject.name}</span>
              <span className="ml-auto text-sm text-[var(--text-muted)] tabular-nums">
                {pct(row.complete, row.total)}%
              </span>
            </div>
            <ProgressBar value={pct(row.complete, row.total)} label={`${row.subject.name} completion`} />
            <div className="flex flex-wrap gap-2">
              <Badge tone="neutral">
                {row.complete}/{row.total} tasks
              </Badge>
              {row.average != null ? (
                <Badge tone={row.average >= 70 ? 'success' : 'warning'}>Quiz average {row.average}%</Badge>
              ) : null}
              {row.finishedChapters.length ? (
                <Badge tone="success">
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> {row.finishedChapters.length} finished
                </Badge>
              ) : null}
            </div>
            {row.finishedChapters.length ? (
              <p className="text-xs text-[var(--text-muted)]">Done: {row.finishedChapters.join(', ')}</p>
            ) : null}
          </Card>
        ))}
      </section>
    </div>
  );
}

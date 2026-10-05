'use client';

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ExternalLink,
  FileText,
  Link2,
  PenSquare,
  PlayCircle,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { toast } from 'sonner';
import { SubjectPill } from './subject-pill';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ProgressBar } from '@/components/ui/progress';
import { type Resource, type SubjectBlock } from '@/lib/data/content';
import { findSession, useContent } from '@/lib/data/content-store';
import { useProgress } from '@/lib/data/progress-store';
import { blockProgress, sessionProgress, visibleChecklist } from '@/lib/data/stats';
import { cn, formatLongDate, formatMinutes } from '@/lib/utils';

const RESOURCE_ICONS = {
  youtube: PlayCircle,
  ncert_pdf: FileText,
  notes: PenSquare,
  extra_questions: BookOpen,
  other: Link2,
} as const;

export function SessionDetail({ sessionNumber }: { sessionNumber: number }) {
  const { state, toggleChecklist } = useProgress();
  const { sessions, loading } = useContent();
  const v = React.useMemo(() => ({ mathsLevel: state.profile.mathsLevel }), [state.profile.mathsLevel]);

  const session = findSession(sessions, sessionNumber);

  if (loading) return <Skeleton className="h-64 w-full" />;

  if (!session) {
    return (
      <EmptyState
        title="That day is not in the plan"
        description="It may not have been added yet. Everything that has been is on the study plan page."
        action={
          <Button asChild size="sm">
            <Link href="/sessions">Open the plan</Link>
          </Button>
        }
      />
    );
  }

  const progress = sessionProgress(session, state, v);
  const previous = findSession(sessions, session.number - 1);
  const next = findSession(sessions, session.number + 1);

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/sessions">
            <ArrowLeft className="h-4 w-4" /> Study plan
          </Link>
        </Button>
        <p className="text-sm text-[var(--text-muted)]">{formatLongDate(session.date)}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{session.title}</h1>
        <p className="mt-1.5 text-sm text-[var(--text-muted)]">{session.summary}</p>

        {progress.total > 0 ? (
          <div className="mt-4 flex items-center gap-3">
            <ProgressBar value={progress.percent} className="flex-1" label="Day progress" />
            <span className="text-sm text-[var(--text-muted)] tabular-nums">
              {progress.done}/{progress.total}
            </span>
          </div>
        ) : null}
      </div>

      {progress.complete ? (
        <Card className="flex items-center gap-3 border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40">
          <Sparkles className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <p className="text-sm">Every task done for today. That is the whole day closed properly — go and rest.</p>
        </Card>
      ) : null}

      {session.blocks.length === 0 ? (
        <Card className="space-y-2 text-center">
          <p className="font-medium">Paper day</p>
          <p className="text-sm text-[var(--text-muted)]">
            Read the paper properly in the first fifteen minutes, attempt what you know first, and keep the last ten
            minutes for checking.
          </p>
        </Card>
      ) : null}

      {session.blocks.map((block) => (
        <SubjectCard key={block.id} block={block} onToggle={toggleChecklist} />
      ))}

      <nav className="flex items-center justify-between gap-3 pt-2" aria-label="Day navigation">
        {previous ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/sessions/${previous.number}`}>
              <ArrowLeft className="h-4 w-4" /> Day {previous.number}
            </Link>
          </Button>
        ) : (
          <span />
        )}
        {next ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/sessions/${next.number}`}>
              Day {next.number} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : null}
      </nav>
    </div>
  );
}

function SubjectCard({ block, onToggle }: { block: SubjectBlock; onToggle: (id: string, minutes?: number) => void }) {
  const { state } = useProgress();
  const v = React.useMemo(() => ({ mathsLevel: state.profile.mathsLevel }), [state.profile.mathsLevel]);
  const items = visibleChecklist(block, v);
  const progress = blockProgress(block, state, v);
  const attempt = block.quiz
    ? state.attempts
        .filter((a) => a.quizId === block.quiz!.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
    : undefined;

  function handleToggle(itemId: string, minutes?: number) {
    const wasComplete = progress.complete;
    onToggle(itemId, minutes);
    if (!wasComplete && progress.done + 1 === progress.total && !state.checklist[itemId]) {
      toast.success(`${block.shortName} done for today`, { description: block.chapterName });
    }
  }

  return (
    <Card id={block.subjectSlug} className="scroll-mt-20 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <SubjectPill accent={block.accent} label={block.shortName} />
          <div className="min-w-0">
            <h2 className="font-semibold">{block.chapterName}</h2>
            <p className="mt-0.5 text-sm text-[var(--text-muted)]">{block.focusTopic}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <Badge tone="neutral">{formatMinutes(block.minutes)}</Badge>
          {block.weightage ? <Badge tone="info">{block.weightage} marks</Badge> : null}
          {progress.complete ? <Badge tone="success">Done</Badge> : null}
        </div>
      </div>

      <ProgressBar value={progress.percent} label={`${block.shortName} progress`} />

      <ul className="space-y-1.5">
        {items.map((item) => {
          const checked = Boolean(state.checklist[item.id]);
          return (
            <li key={item.id}>
              <label
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 transition-colors',
                  checked ? 'bg-[var(--surface-muted)]' : 'hover:bg-[var(--surface-muted)]',
                )}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => handleToggle(item.id, item.minutes)}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all',
                    checked
                      ? 'pop border-[var(--accent)] bg-[var(--accent)] text-white'
                      : 'border-[var(--border)] bg-[var(--surface)]',
                  )}
                >
                  {checked ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block text-sm', checked && 'text-[var(--text-muted)] line-through')}>
                    {item.label}
                    {item.optional ? <span className="ml-2 text-xs text-[var(--text-muted)]">optional</span> : null}
                  </span>
                  {item.detail ? (
                    <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{item.detail}</span>
                  ) : null}
                </span>
                {item.minutes ? (
                  <span className="shrink-0 text-xs text-[var(--text-muted)] tabular-nums">{item.minutes}m</span>
                ) : null}
              </label>
            </li>
          );
        })}
      </ul>

      <div>
        <p className="mb-2 text-xs font-medium tracking-wide text-[var(--text-muted)] uppercase">Resources</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {block.resources.map((resource) => (
            <ResourceLink key={resource.id} resource={resource} />
          ))}
        </div>
      </div>

      {block.quiz ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--surface-muted)] px-4 py-3">
          <div>
            <p className="text-sm font-medium">{block.quiz.title} quiz</p>
            <p className="text-xs text-[var(--text-muted)]">
              {attempt
                ? `Last attempt ${attempt.score}/${attempt.total}. Retake any time — every attempt is kept.`
                : `${block.quiz.questions.length} questions, written like the real paper.`}
            </p>
          </div>
          <Button asChild size="sm" variant={attempt ? 'outline' : 'primary'}>
            <Link href={`/quiz/${block.quiz.id}`}>{attempt ? 'Retake' : 'Start quiz'}</Link>
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

function ResourceLink({ resource }: { resource: Resource }) {
  const Icon = RESOURCE_ICONS[resource.kind];

  if (!resource.url) {
    return (
      <div
        className="flex items-center gap-2.5 rounded-xl border border-dashed border-[var(--border)] px-3 py-2.5 text-sm text-[var(--text-muted)]"
        aria-disabled="true"
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{resource.label}</span>
        <span className="ml-auto shrink-0 text-xs">not added yet</span>
      </div>
    );
  }

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm transition-colors hover:bg-[var(--surface-muted)]"
    >
      <Icon className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
      <span className="truncate">{resource.label}</span>
      <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
    </a>
  );
}

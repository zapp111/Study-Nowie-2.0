'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress';
import { SUBJECT_LIST } from '@/lib/data/content';
import { useProgress, type ChapterState } from '@/lib/data/progress-store';
import { cn, pct } from '@/lib/utils';

const STATES: { id: ChapterState; label: string; short: string }[] = [
  { id: 'not_started', label: 'Not started', short: '—' },
  { id: 'learning', label: 'Learning', short: 'L' },
  { id: 'ncert_done', label: 'NCERT done', short: 'N' },
  { id: 'revised', label: 'Revised', short: 'R' },
  { id: 'tested', label: 'Tested', short: 'T' },
];

const WEIGHT: Record<ChapterState, number> = {
  not_started: 0,
  learning: 0.25,
  ncert_done: 0.6,
  revised: 0.85,
  tested: 1,
};

export function SyllabusView() {
  const { state, setChapterState } = useProgress();
  const [subjectSlug, setSubjectSlug] = React.useState(SUBJECT_LIST[0].slug);
  const subject = SUBJECT_LIST.find((s) => s.slug === subjectSlug)!;

  const covered = subject.chapters.reduce(
    (sum, c) => sum + WEIGHT[state.chapters[c.id] ?? 'not_started'] * c.weightage,
    0,
  );
  const totalMarks = subject.chapters.reduce((sum, c) => sum + c.weightage, 0);

  return (
    <div>
      <PageHeader
        title="Syllabus tracker"
        description="Every chapter, with what it is worth in the paper. Mark where each one actually stands."
      />

      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Subject">
        {SUBJECT_LIST.map((s) => (
          <button
            key={s.slug}
            role="tab"
            aria-selected={s.slug === subjectSlug}
            onClick={() => setSubjectSlug(s.slug)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
              s.slug === subjectSlug
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)]',
            )}
          >
            {s.shortName}
          </button>
        ))}
      </div>

      <Card className="mb-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{subject.name}</span>
          <span className="text-[var(--text-muted)] tabular-nums">
            {Math.round(covered)} / {totalMarks} marks covered
          </span>
        </div>
        <ProgressBar value={pct(covered, totalMarks)} label={`${subject.name} syllabus covered`} />
        <p className="text-xs text-[var(--text-muted)]">
          Weighted by marks, not by chapter count — finishing a ten-mark chapter moves this far more than a two-mark
          one.
        </p>
      </Card>

      <ul className="space-y-2">
        {subject.chapters.map((chapter) => {
          const current = state.chapters[chapter.id] ?? 'not_started';
          return (
            <li key={chapter.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {chapter.number}. {chapter.name}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    {chapter.unit ? <span>{chapter.unit}</span> : null}
                    <Badge tone="info">{chapter.weightage} marks</Badge>
                    {chapter.cbq === 'very_high' || chapter.cbq === 'high' ? (
                      <Badge tone="warning">case studies likely</Badge>
                    ) : null}
                  </p>
                </div>
                <div className="flex gap-1" role="group" aria-label={`Status for ${chapter.name}`}>
                  {STATES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      title={s.label}
                      aria-label={`${chapter.name}: ${s.label}`}
                      aria-pressed={current === s.id}
                      onClick={() => setChapterState(chapter.id, s.id)}
                      className={cn(
                        'h-8 w-8 rounded-lg text-xs font-semibold transition-colors',
                        current === s.id
                          ? 'bg-[var(--accent)] text-white'
                          : 'bg-[var(--surface-muted)] text-[var(--text-muted)] hover:bg-[var(--accent-soft)]',
                      )}
                    >
                      {s.short}
                    </button>
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-xs text-[var(--text-muted)]">
        L — learning · N — NCERT finished · R — revised · T — tested
      </p>
    </div>
  );
}

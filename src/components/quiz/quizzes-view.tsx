'use client';

import { BookOpen, Check } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { SubjectPill } from '@/components/sessions/subject-pill';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { allQuizzes, SUBJECT_LIST } from '@/lib/data/content';
import { useProgress } from '@/lib/data/progress-store';
import { pct } from '@/lib/utils';

export function QuizzesView() {
  const { state } = useProgress();
  const [subject, setSubject] = React.useState<string>('all');

  const entries = React.useMemo(() => {
    const seen = new Set<string>();
    return allQuizzes().filter(({ block }) => {
      const key = `${block.subjectSlug}:${block.chapterName}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return subject === 'all' || block.subjectSlug === subject;
    });
  }, [subject]);

  const best = React.useMemo(() => {
    const map = new Map<string, { score: number; total: number; attempts: number }>();
    for (const attempt of state.attempts) {
      const current = map.get(attempt.quizId);
      map.set(attempt.quizId, {
        score: Math.max(current?.score ?? 0, attempt.score),
        total: attempt.total,
        attempts: (current?.attempts ?? 0) + 1,
      });
    }
    return map;
  }, [state.attempts]);

  return (
    <div>
      <PageHeader
        title="Quizzes"
        description="Written like the real paper — a mix of recall, applied questions, assertion-reason and case studies."
      />

      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter by subject">
        <Button variant={subject === 'all' ? 'soft' : 'outline'} size="sm" onClick={() => setSubject('all')}>
          All
        </Button>
        {SUBJECT_LIST.map((s) => (
          <Button
            key={s.slug}
            variant={subject === s.slug ? 'soft' : 'outline'}
            size="sm"
            onClick={() => setSubject(s.slug)}
          >
            {s.shortName}
          </Button>
        ))}
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No quizzes here yet"
          description="Quizzes are added chapter by chapter. Pick another subject, or carry on with the plan."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {entries.map(({ quiz, block, session }) => {
            const result = best.get(quiz.id);
            const percentage = result ? pct(result.score, result.total) : null;
            return (
              <li key={quiz.id}>
                <Card className="flex h-full flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <SubjectPill accent={block.accent} label={block.shortName} />
                    {percentage != null ? (
                      <Badge tone={percentage >= 70 ? 'success' : 'warning'}>
                        <Check className="h-3 w-3" aria-hidden="true" /> {percentage}%
                      </Badge>
                    ) : (
                      <Badge tone="neutral">Not attempted</Badge>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{quiz.title}</p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      {quiz.questions.length} questions · Day {session.number}
                      {block.weightage ? ` · ${block.weightage} marks in the paper` : ''}
                    </p>
                  </div>
                  <Button asChild size="sm" variant={percentage != null ? 'outline' : 'primary'}>
                    <Link href={`/quiz/${quiz.id}`}>{percentage != null ? 'Retake' : 'Start'}</Link>
                  </Button>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

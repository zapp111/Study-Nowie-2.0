'use client';

import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { SubjectPill } from '@/components/sessions/subject-pill';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useContent } from '@/lib/data/content-store';
import { useProgress } from '@/lib/data/progress-store';
import { completedSessions } from '@/lib/data/stats';
import { formatDate, pct } from '@/lib/utils';

export function CompletedView() {
  const { state } = useProgress();
  const { sessions } = useContent();
  const v = React.useMemo(() => ({ mathsLevel: state.profile.mathsLevel }), [state.profile.mathsLevel]);
  const done = React.useMemo(() => completedSessions(sessions, state, v), [sessions, state, v]);

  return (
    <div>
      <PageHeader
        title="Completed"
        description="Every day you finished properly, with the quiz scores from that day."
      />

      {done.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Nothing finished yet, Joyuu"
          description="A day lands here once every required task on it is ticked. The first one is the hardest."
          action={
            <Button asChild size="sm">
              <Link href="/sessions">Open the plan</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {done.reverse().map(({ session, attempts, completedAt }) => (
            <li key={session.id}>
              <Card className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="success">
                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Complete
                  </Badge>
                  <span className="text-sm font-medium">Day {session.number}</span>
                  <span className="text-xs text-[var(--text-muted)]">{formatDate(session.date)}</span>
                  {completedAt ? (
                    <span className="ml-auto text-xs text-[var(--text-muted)]">
                      finished {formatDate(completedAt.slice(0, 10))}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {session.blocks.map((b) => (
                    <SubjectPill key={b.id} accent={b.accent} label={`${b.shortName} · ${b.chapterName}`} />
                  ))}
                </div>

                {attempts.length ? (
                  <div className="flex flex-wrap gap-2">
                    {attempts.map(({ block, attempt }) => (
                      <Badge key={block.id} tone={pct(attempt!.score, attempt!.total) >= 70 ? 'success' : 'warning'}>
                        {block.shortName} {attempt!.score}/{attempt!.total}
                      </Badge>
                    ))}
                  </div>
                ) : null}

                <Button asChild variant="outline" size="sm">
                  <Link href={`/sessions/${session.number}`}>Review</Link>
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

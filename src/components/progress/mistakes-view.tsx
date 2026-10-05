'use client';

import { NotebookPen, Plus, Trash2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { SUBJECT_LIST } from '@/lib/data/content';
import { useProgress } from '@/lib/data/progress-store';
import { RULES } from '@/lib/data/rules';
import { formatDate, todayIso } from '@/lib/utils';

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function MistakesView() {
  const { state, addMistake, resolveMistake, removeMistake } = useProgress();
  const [open, setOpen] = React.useState(false);
  const today = todayIso();

  const due = state.mistakes.filter((m) => !m.resolvedAt && m.reattemptOn <= today);
  const later = state.mistakes.filter((m) => !m.resolvedAt && m.reattemptOn > today);
  const fixed = state.mistakes.filter((m) => m.resolvedAt);

  return (
    <div>
      <PageHeader
        title="Mistake notebook"
        description="Marks are lost to the same mistakes twice. Write them here and they come back for a reattempt."
        action={
          <Button size="sm" onClick={() => setOpen((o) => !o)}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        }
      />

      {open ? <MistakeForm onDone={() => setOpen(false)} onSubmit={addMistake} /> : null}

      {state.mistakes.length === 0 && !open ? (
        <EmptyState
          icon={NotebookPen}
          title="Nothing in here yet"
          description="Add a question you got wrong, what went wrong, and the correct method. It comes back in three days."
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              Add the first one
            </Button>
          }
        />
      ) : null}

      {due.length ? (
        <Section title={`Due today (${due.length})`}>
          {due.map((m) => (
            <MistakeCard key={m.id} mistake={m} onResolve={resolveMistake} onRemove={removeMistake} due />
          ))}
        </Section>
      ) : null}

      {later.length ? (
        <Section title="Coming up">
          {later.map((m) => (
            <MistakeCard key={m.id} mistake={m} onResolve={resolveMistake} onRemove={removeMistake} />
          ))}
        </Section>
      ) : null}

      {fixed.length ? (
        <Section title={`Fixed (${fixed.length})`}>
          {fixed.map((m) => (
            <MistakeCard key={m.id} mistake={m} onResolve={resolveMistake} onRemove={removeMistake} />
          ))}
        </Section>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 space-y-2">
      <h2 className="text-sm font-semibold tracking-wide text-[var(--text-muted)] uppercase">{title}</h2>
      {children}
    </section>
  );
}

type NewMistake = Parameters<ReturnType<typeof useProgress>['addMistake']>[0];

function MistakeForm({ onDone, onSubmit }: { onDone: () => void; onSubmit: (m: NewMistake) => void }) {
  const [question, setQuestion] = React.useState('');
  const [wrong, setWrong] = React.useState('');
  const [method, setMethod] = React.useState('');
  const [subject, setSubject] = React.useState(SUBJECT_LIST[0].slug);
  const [days, setDays] = React.useState(RULES.reattemptAfterDays);
  const [error, setError] = React.useState('');

  return (
    <Card className="mb-6 space-y-4">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (question.trim().length < 5) {
            setError('Write at least a few words so you recognise it later');
            return;
          }
          onSubmit({
            subjectSlug: subject,
            chapterId: null,
            question: question.trim(),
            whatWentWrong: wrong.trim(),
            correctMethod: method.trim(),
            source: '',
            reattemptOn: addDays(todayIso(), days),
          });
          toast.success('Saved', { description: `Back in ${days} days.` });
          onDone();
        }}
      >
        <Field label="The question or topic" error={error} htmlFor="mistake-question">
          <Textarea
            id="mistake-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Quadratic word problem — boat upstream and downstream"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="What went wrong" htmlFor="mistake-wrong">
            <Textarea
              id="mistake-wrong"
              value={wrong}
              onChange={(e) => setWrong(e.target.value)}
              placeholder="Took speed downstream as x − y instead of x + y"
            />
          </Field>
          <Field label="Correct method" htmlFor="mistake-method">
            <Textarea
              id="mistake-method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              placeholder="Downstream = boat + stream, upstream = boat − stream"
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Subject" htmlFor="mistake-subject">
            <Select id="mistake-subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
              {SUBJECT_LIST.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Reattempt in" hint="Two or three days is the sweet spot." htmlFor="mistake-days">
            <Input
              id="mistake-days"
              type="number"
              min={1}
              max={30}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" size="sm">
            Save
          </Button>
        </div>
      </form>
    </Card>
  );
}

function MistakeCard({
  mistake,
  onResolve,
  onRemove,
  due,
}: {
  mistake: ReturnType<typeof useProgress>['state']['mistakes'][number];
  onResolve: (id: string) => void;
  onRemove: (id: string) => void;
  due?: boolean;
}) {
  return (
    <Card className={due ? 'border-[var(--accent)]' : undefined}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-sm font-medium">{mistake.question}</p>
        {mistake.resolvedAt ? (
          <Badge tone="success">Fixed</Badge>
        ) : (
          <Badge tone={due ? 'accent' : 'neutral'}>
            {due ? 'Reattempt today' : `Back on ${formatDate(mistake.reattemptOn)}`}
          </Badge>
        )}
      </div>
      {mistake.whatWentWrong ? (
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          <span className="font-medium text-[var(--text)]">Went wrong: </span>
          {mistake.whatWentWrong}
        </p>
      ) : null}
      {mistake.correctMethod ? (
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          <span className="font-medium text-[var(--text)]">Correct method: </span>
          {mistake.correctMethod}
        </p>
      ) : null}
      <div className="mt-3 flex gap-2">
        {!mistake.resolvedAt ? (
          <Button size="sm" variant="soft" onClick={() => onResolve(mistake.id)}>
            I can do this now
          </Button>
        ) : null}
        <ConfirmDialog
          trigger={
            <Button size="sm" variant="ghost" aria-label="Delete this entry">
              <Trash2 className="h-4 w-4" />
            </Button>
          }
          title="Delete this entry?"
          description="It will be removed from your notebook. This cannot be undone."
          confirmLabel="Delete"
          destructive
          onConfirm={() => onRemove(mistake.id)}
        />
      </div>
    </Card>
  );
}

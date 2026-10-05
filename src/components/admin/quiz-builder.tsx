'use client';

/**
 * Build a quiz against any day in the plan.
 *
 * Pick the day and the subject, and this either opens the quiz already
 * attached to it or creates one. Questions are added one at a time and are
 * live for her as soon as they are saved — nothing is compiled into the app.
 */

import { Check, Plus, Trash2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { SubjectPill } from '@/components/sessions/subject-pill';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { useContent } from '@/lib/data/content-store';
import { createClient } from '@/lib/supabase/client';

const AR_OPTIONS = [
  'Both A and R are true, and R is the correct explanation of A',
  'Both A and R are true, but R is not the correct explanation of A',
  'A is true but R is false',
  'A is false but R is true',
];

export function QuizBuilder({ connected }: { connected: boolean }) {
  const { sessions, refresh, loading } = useContent();
  const [sessionId, setSessionId] = React.useState<string>('');
  const [blockId, setBlockId] = React.useState<string>('');
  const [busy, setBusy] = React.useState(false);

  const session = sessions.find((s) => s.id === sessionId) ?? sessions[0];
  const block = session?.blocks.find((b) => b.id === blockId) ?? session?.blocks[0];

  if (!connected) {
    return (
      <Card>
        <CardTitle>Connect the database to build quizzes</CardTitle>
        <CardDescription className="mt-1">
          Questions are stored in Postgres so you can add them while she is working, not shipped inside the app.
        </CardDescription>
      </Card>
    );
  }

  if (loading) return <Card>Loading…</Card>;

  if (!session || !block) {
    return (
      <EmptyState
        title="Add a day first"
        description="A quiz hangs off a subject in the plan, so there has to be a day to attach it to."
      />
    );
  }

  async function createQuiz() {
    const supabase = createClient();
    if (!supabase || !block) return;
    setBusy(true);
    const { error } = await supabase.from('quizzes').insert({
      session_subject_id: block.id,
      chapter_id: block.chapterId,
      title: block.chapterName,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Quiz created');
    await refresh();
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Day" htmlFor="quiz-session">
            <Select
              id="quiz-session"
              value={session.id}
              onChange={(e) => {
                setSessionId(e.target.value);
                setBlockId('');
              }}
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  Day {s.number} — {s.date}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Subject" htmlFor="quiz-block">
            <Select id="quiz-block" value={block.id} onChange={(e) => setBlockId(e.target.value)}>
              {session.blocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.shortName} — {b.chapterName}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SubjectPill accent={block.accent} label={block.shortName} />
          <span className="text-sm font-medium">{block.chapterName}</span>
          {block.quiz ? (
            <Badge tone="success">
              {block.quiz.questions.length} question{block.quiz.questions.length === 1 ? '' : 's'}
            </Badge>
          ) : (
            <Badge tone="neutral">No quiz yet</Badge>
          )}
          {block.quiz ? (
            <div className="ml-auto">
              <ConfirmDialog
                trigger={
                  <Button variant="ghost" size="sm" aria-label="Delete this quiz">
                    <Trash2 className="h-4 w-4" /> Delete quiz
                  </Button>
                }
                title="Delete this quiz?"
                description="The questions go with it, along with her attempts at them."
                confirmLabel="Delete"
                destructive
                onConfirm={async () => {
                  const supabase = createClient();
                  if (!supabase || !block.quiz) return;
                  const { error } = await supabase.from('quizzes').delete().eq('id', block.quiz.id);
                  if (error) {
                    toast.error(error.message);
                    return;
                  }
                  toast.success('Quiz deleted');
                  await refresh();
                }}
              />
            </div>
          ) : (
            <Button size="sm" className="ml-auto" onClick={createQuiz} disabled={busy}>
              <Plus className="h-4 w-4" /> Create quiz
            </Button>
          )}
        </div>
      </Card>

      {block.quiz ? (
        <>
          <QuestionForm quizId={block.quiz.id} nextIndex={block.quiz.questions.length} onSaved={refresh} />

          {block.quiz.questions.length === 0 ? (
            <EmptyState
              title="No questions yet"
              description="Add the first one above. Five is usually enough per chapter."
            />
          ) : (
            <ol className="space-y-3">
              {block.quiz.questions.map((question, index) => (
                <li key={question.id}>
                  <Card className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="neutral">Q{index + 1}</Badge>
                      <Badge tone="info">
                        {question.marks ?? 1} mark{(question.marks ?? 1) > 1 ? 's' : ''}
                      </Badge>
                      {question.type && question.type !== 'mcq' ? (
                        <Badge tone="accent">{question.type.replace('_', ' ')}</Badge>
                      ) : null}
                      <div className="ml-auto">
                        <ConfirmDialog
                          trigger={
                            <Button variant="ghost" size="sm" aria-label={`Delete question ${index + 1}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                          title="Delete this question?"
                          description="It will be removed from the quiz."
                          confirmLabel="Delete"
                          destructive
                          onConfirm={async () => {
                            const supabase = createClient();
                            if (!supabase) return;
                            const { error } = await supabase.from('quiz_questions').delete().eq('id', question.id);
                            if (error) {
                              toast.error(error.message);
                              return;
                            }
                            toast.success('Deleted');
                            await refresh();
                          }}
                        />
                      </div>
                    </div>
                    {question.stimulus ? (
                      <p className="rounded-xl bg-[var(--surface-muted)] p-3 text-sm italic">{question.stimulus}</p>
                    ) : null}
                    <p className="text-sm font-medium">{question.prompt}</p>
                    <ul className="space-y-1">
                      {question.options.map((option, oi) => (
                        <li
                          key={oi}
                          className={`flex items-center gap-2 text-sm ${
                            oi === question.correctIndex
                              ? 'font-medium text-emerald-700 dark:text-emerald-400'
                              : 'text-[var(--text-muted)]'
                          }`}
                        >
                          {oi === question.correctIndex ? (
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <span className="w-3.5" />
                          )}
                          {option}
                        </li>
                      ))}
                    </ul>
                    {question.explanation ? (
                      <p className="rounded-xl bg-[var(--accent-soft)] p-3 text-sm">{question.explanation}</p>
                    ) : null}
                  </Card>
                </li>
              ))}
            </ol>
          )}
        </>
      ) : null}
    </div>
  );
}

function QuestionForm({
  quizId,
  nextIndex,
  onSaved,
}: {
  quizId: string;
  nextIndex: number;
  onSaved: () => Promise<void>;
}) {
  const [type, setType] = React.useState<'mcq' | 'assertion_reason' | 'case_study'>('mcq');
  const [prompt, setPrompt] = React.useState('');
  const [stimulus, setStimulus] = React.useState('');
  const [options, setOptions] = React.useState(['', '', '', '']);
  const [correct, setCorrect] = React.useState(0);
  const [explanation, setExplanation] = React.useState('');
  const [marks, setMarks] = React.useState(1);
  const [difficulty, setDifficulty] = React.useState<'easy' | 'medium' | 'hard'>('medium');
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const effectiveOptions = type === 'assertion_reason' ? AR_OPTIONS : options;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const cleaned = effectiveOptions.map((o) => o.trim()).filter(Boolean);

    if (prompt.trim().length < 8) {
      setError('Write the full question');
      return;
    }
    if (cleaned.length < 2) {
      setError('At least two options');
      return;
    }
    if (!effectiveOptions[correct]?.trim()) {
      setError('The option marked correct is blank');
      return;
    }
    setError('');

    const supabase = createClient();
    if (!supabase) return;

    setSaving(true);
    const { error: dbError } = await supabase.from('quiz_questions').insert({
      quiz_id: quizId,
      prompt: prompt.trim(),
      stimulus: type === 'case_study' && stimulus.trim() ? stimulus.trim() : null,
      options: cleaned,
      correct_index: correct,
      explanation: explanation.trim() || null,
      marks,
      difficulty,
      question_type: type,
      sort_order: nextIndex,
    });
    setSaving(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    toast.success('Question added');
    setPrompt('');
    setStimulus('');
    setOptions(['', '', '', '']);
    setExplanation('');
    setCorrect(0);
    await onSaved();
  }

  return (
    <Card>
      <form className="space-y-4" onSubmit={save}>
        <CardTitle>Add a question</CardTitle>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Type" htmlFor="q-type">
            <Select
              id="q-type"
              value={type}
              onChange={(e) => {
                const value = e.target.value as typeof type;
                setType(value);
                setCorrect(0);
              }}
            >
              <option value="mcq">Multiple choice</option>
              <option value="assertion_reason">Assertion &amp; reason</option>
              <option value="case_study">Case study</option>
            </Select>
          </Field>
          <Field label="Marks" htmlFor="q-marks">
            <Input
              id="q-marks"
              type="number"
              min={1}
              max={5}
              value={marks}
              onChange={(e) => setMarks(Number(e.target.value))}
            />
          </Field>
          <Field label="Difficulty" htmlFor="q-difficulty">
            <Select
              id="q-difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Select>
          </Field>
        </div>

        {type === 'case_study' ? (
          <Field label="The passage" hint="The paragraph or data she reads before the question." htmlFor="q-stimulus">
            <Textarea id="q-stimulus" value={stimulus} onChange={(e) => setStimulus(e.target.value)} />
          </Field>
        ) : null}

        <Field
          label={type === 'assertion_reason' ? 'Assertion and Reason' : 'Question'}
          hint={type === 'assertion_reason' ? 'Write both lines here, as they appear in the paper.' : undefined}
          htmlFor="q-prompt"
        >
          <Textarea
            id="q-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              type === 'assertion_reason'
                ? 'Assertion (A): … Reason (R): …'
                : 'The HCF of 96 and 404 is 4. What is their LCM?'
            }
          />
        </Field>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">
            {type === 'assertion_reason' ? 'Standard options — pick the correct one' : 'Options — pick the correct one'}
          </legend>
          {effectiveOptions.map((option, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct-option"
                checked={correct === i}
                onChange={() => setCorrect(i)}
                aria-label={`Option ${String.fromCharCode(65 + i)} is the correct answer`}
                className="h-4 w-4 shrink-0 accent-[var(--accent)]"
              />
              {type === 'assertion_reason' ? (
                <p className="text-sm text-[var(--text-muted)]">{option}</p>
              ) : (
                <Input
                  value={option}
                  aria-label={`Option ${String.fromCharCode(65 + i)}`}
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  onChange={(e) => setOptions((current) => current.map((v, vi) => (vi === i ? e.target.value : v)))}
                />
              )}
            </div>
          ))}
        </fieldset>

        <Field
          label="Explanation"
          hint="She reads this after submitting. Say why the right answer is right, and why the tempting wrong one is wrong."
          htmlFor="q-explanation"
        >
          <Textarea id="q-explanation" value={explanation} onChange={(e) => setExplanation(e.target.value)} />
        </Field>

        {error ? (
          <p
            className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <Button type="submit" size="sm" disabled={saving}>
          <Plus className="h-4 w-4" /> {saving ? 'Saving…' : 'Add question'}
        </Button>
      </form>
    </Card>
  );
}

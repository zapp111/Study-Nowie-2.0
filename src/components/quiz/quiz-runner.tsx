'use client';

import { ArrowLeft, Check, NotebookPen, RotateCcw, X } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { toast } from 'sonner';
import { SubjectPill } from '@/components/sessions/subject-pill';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress';
import { findQuiz, type Question } from '@/lib/data/content';
import { useProgress } from '@/lib/data/progress-store';
import { RULES } from '@/lib/data/rules';
import { cn, pct, todayIso } from '@/lib/utils';

type Phase = 'answering' | 'review';

const TYPE_LABEL: Record<string, string> = {
  mcq: 'Multiple choice',
  assertion_reason: 'Assertion & reason',
  case_study: 'Case study',
};

export function QuizRunner({ quizId }: { quizId: string }) {
  const entry = findQuiz(quizId)!;
  const { quiz, block, session } = entry;
  const { state, recordAttempt, addMistake } = useProgress();

  const [phase, setPhase] = React.useState<Phase>('answering');
  const [index, setIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, number>>({});

  const question = quiz.questions[index];
  const answered = Object.keys(answers).length;
  const previousAttempts = state.attempts.filter((a) => a.quizId === quizId);

  const score = quiz.questions.filter((q) => answers[q.id] === q.correctIndex).length;

  function choose(optionIndex: number) {
    setAnswers((current) => ({ ...current, [question.id]: optionIndex }));
  }

  function submit() {
    const responses = quiz.questions.map((q) => ({
      questionId: q.id,
      selectedIndex: answers[q.id] ?? -1,
      correct: answers[q.id] === q.correctIndex,
    }));
    recordAttempt({ quizId, score, total: quiz.questions.length, responses });
    setPhase('review');
    window.scrollTo({ top: 0 });

    const percentage = pct(score, quiz.questions.length);
    if (percentage >= 90) toast.success(`${percentage}% — that is board level`);
    else if (percentage >= RULES.passPercentage) toast.success(`${percentage}% — solid`);
    else toast(`${percentage}%. Go through the review below, that is where the marks are.`);
  }

  function retake() {
    setAnswers({});
    setIndex(0);
    setPhase('answering');
    window.scrollTo({ top: 0 });
  }

  if (phase === 'review') {
    const percentage = pct(score, quiz.questions.length);
    return (
      <div className="space-y-5">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/sessions/${session.number}`}>
            <ArrowLeft className="h-4 w-4" /> Back to Day {session.number}
          </Link>
        </Button>

        <Card className="space-y-3 text-center">
          <p className="text-sm text-[var(--text-muted)]">{quiz.title}</p>
          <p className="text-4xl font-semibold text-[var(--accent)]">
            {score}
            <span className="text-2xl text-[var(--text-muted)]">/{quiz.questions.length}</span>
          </p>
          <ProgressBar value={percentage} label="Score" />
          <p className="text-sm text-[var(--text-muted)]">
            {percentage >= 90
              ? 'That chapter is solid. Keep it warm with a quick revision later.'
              : percentage >= RULES.passPercentage
                ? 'Good. Read the explanations for the ones you missed and it is done.'
                : 'Worth another pass. Read every explanation below before you retake it.'}
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            <Button onClick={retake} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4" /> Retake
            </Button>
            <Button asChild size="sm">
              <Link href={`/sessions/${session.number}`}>Back to the day</Link>
            </Button>
          </div>
          {previousAttempts.length > 1 ? (
            <p className="text-xs text-[var(--text-muted)]">
              Attempt {previousAttempts.length}. Previous:{' '}
              {previousAttempts
                .slice(1, 4)
                .map((a) => `${a.score}/${a.total}`)
                .join(', ')}
            </p>
          ) : null}
        </Card>

        <ol className="space-y-3">
          {quiz.questions.map((q, i) => {
            const selected = answers[q.id];
            const correct = selected === q.correctIndex;
            return (
              <li key={q.id}>
                <Card className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white',
                        correct ? 'bg-emerald-500' : 'bg-red-500',
                      )}
                      aria-hidden="true"
                    >
                      {correct ? (
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      ) : (
                        <X className="h-3.5 w-3.5" strokeWidth={3} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[var(--text-muted)]">
                        Question {i + 1} · {q.marks ?? 1} mark{(q.marks ?? 1) > 1 ? 's' : ''}
                        {q.type && q.type !== 'mcq' ? ` · ${TYPE_LABEL[q.type]}` : ''}
                      </p>
                      {q.stimulus ? (
                        <p className="mt-2 rounded-xl bg-[var(--surface-muted)] p-3 text-sm italic">{q.stimulus}</p>
                      ) : null}
                      <p className="mt-2 font-medium">{q.prompt}</p>
                    </div>
                  </div>

                  <ul className="space-y-1.5">
                    {q.options.map((option, oi) => (
                      <li
                        key={oi}
                        className={cn(
                          'rounded-xl border px-3 py-2 text-sm',
                          oi === q.correctIndex
                            ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40'
                            : oi === selected
                              ? 'border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40'
                              : 'border-[var(--border)]',
                        )}
                      >
                        {option}
                        {oi === q.correctIndex ? (
                          <span className="ml-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            correct answer
                          </span>
                        ) : null}
                        {oi === selected && oi !== q.correctIndex ? (
                          <span className="ml-2 text-xs font-medium text-red-700 dark:text-red-400">your answer</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>

                  <p className="rounded-xl bg-[var(--accent-soft)] p-3 text-sm">{q.explanation}</p>

                  {!correct ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        addMistake({
                          subjectSlug: block.subjectSlug,
                          chapterId: block.chapterId,
                          question: q.prompt,
                          whatWentWrong: `Chose "${q.options[selected] ?? 'nothing'}" instead of "${q.options[q.correctIndex]}"`,
                          correctMethod: q.explanation,
                          source: `${quiz.title} quiz`,
                          reattemptOn: addDays(todayIso(), RULES.reattemptAfterDays),
                        });
                        toast.success('Added to your mistake notebook', {
                          description: `Back in ${RULES.reattemptAfterDays} days for a reattempt.`,
                        });
                      }}
                    >
                      <NotebookPen className="h-4 w-4" /> Save to mistake notebook
                    </Button>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href={`/sessions/${session.number}`}>
            <ArrowLeft className="h-4 w-4" /> Day {session.number}
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <SubjectPill accent={block.accent} label={block.shortName} />
          <h1 className="text-xl font-semibold tracking-tight">{quiz.title}</h1>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar value={(answered / quiz.questions.length) * 100} className="flex-1" label="Questions answered" />
          <span className="text-xs text-[var(--text-muted)] tabular-nums">
            {index + 1}/{quiz.questions.length}
          </span>
        </div>
      </div>

      <QuestionCard question={question} selected={answers[question.id]} onChoose={choose} />

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
          Previous
        </Button>
        {index < quiz.questions.length - 1 ? (
          <Button size="sm" onClick={() => setIndex((i) => i + 1)}>
            Next
          </Button>
        ) : (
          <Button size="sm" disabled={answered < quiz.questions.length} onClick={submit}>
            {answered < quiz.questions.length ? `${quiz.questions.length - answered} left` : 'Submit'}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Jump to a question">
        {quiz.questions.map((q, i) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Question ${i + 1}${answers[q.id] != null ? ', answered' : ''}`}
            aria-current={i === index ? 'true' : undefined}
            className={cn(
              'h-8 w-8 rounded-lg text-xs font-medium transition-colors',
              i === index
                ? 'bg-[var(--accent)] text-white'
                : answers[q.id] != null
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'bg-[var(--surface-muted)] text-[var(--text-muted)]',
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  selected,
  onChoose,
}: {
  question: Question;
  selected: number | undefined;
  onChoose: (index: number) => void;
}) {
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral">
          {question.marks ?? 1} mark{(question.marks ?? 1) > 1 ? 's' : ''}
        </Badge>
        {question.type && question.type !== 'mcq' ? <Badge tone="info">{TYPE_LABEL[question.type]}</Badge> : null}
        {question.difficulty ? <Badge tone="neutral">{question.difficulty}</Badge> : null}
      </div>

      {question.stimulus ? (
        <p className="rounded-xl bg-[var(--surface-muted)] p-4 text-sm italic">{question.stimulus}</p>
      ) : null}

      <fieldset>
        <legend className="mb-3 text-base font-medium">{question.prompt}</legend>
        <div className="space-y-2">
          {question.options.map((option, i) => {
            const active = selected === i;
            return (
              <label
                key={i}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors',
                  active
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                    : 'border-[var(--border)] hover:bg-[var(--surface-muted)]',
                )}
              >
                <input
                  type="radio"
                  name={question.id}
                  className="sr-only"
                  checked={active}
                  onChange={() => onChoose(i)}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold',
                    active ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : 'border-[var(--border)]',
                  )}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </Card>
  );
}

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

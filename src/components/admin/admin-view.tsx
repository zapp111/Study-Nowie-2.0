'use client';

import { Database, Plus, Trash2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { SubjectPill } from '@/components/sessions/subject-pill';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { SUBJECT_LIST } from '@/lib/data/content';
import { useContent } from '@/lib/data/content-store';
import { SessionForm } from './session-form';
import { TeachingView } from './teaching-view';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';

type Tab = 'sessions' | 'students' | 'questions' | 'papers';

export function AdminView({ connected }: { connected: boolean }) {
  const [tab, setTab] = React.useState<Tab>('sessions');

  return (
    <div>
      <PageHeader title="Admin" description="Add and edit what she sees — sessions, questions, papers." />

      {!connected ? (
        <Card className="mb-6 flex items-start gap-3 border-dashed">
          <Database className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
          <div>
            <CardTitle>Editing needs the database connected</CardTitle>
            <CardDescription>
              The plan below is the version built into the app, and it is fully usable as it is. Add
              NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, run the migrations, and these forms start
              writing to Postgres. The README has the exact steps.
            </CardDescription>
          </div>
        </Card>
      ) : null}

      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Admin sections">
        {(
          [
            ['sessions', 'The plan'],
            ['students', 'Her progress'],
            ['questions', 'Question bank'],
            ['papers', 'Papers'],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <Button
            key={id}
            role="tab"
            aria-selected={tab === id}
            variant={tab === id ? 'soft' : 'outline'}
            size="sm"
            onClick={() => setTab(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      {tab === 'sessions' ? <SessionsAdmin connected={connected} /> : null}
      {tab === 'questions' ? <QuestionAdmin connected={connected} /> : null}
      {tab === 'papers' ? <PapersAdmin connected={connected} /> : null}
      {tab === 'students' ? <TeachingView connected={connected} /> : null}
    </div>
  );
}

function SessionsAdmin({ connected }: { connected: boolean }) {
  const { sessions, fromDatabase, refresh, loading } = useContent();
  const [adding, setAdding] = React.useState(false);
  const nextNumber = sessions.reduce((max, s) => Math.max(max, s.number), 0) + 1;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--text-muted)]">
          {fromDatabase
            ? `${sessions.length} day${sessions.length === 1 ? '' : 's'} in the plan.`
            : 'Showing the two starter days built into the app. Anything you add here replaces them.'}
        </p>
        <Button size="sm" onClick={() => setAdding((a) => !a)} disabled={!connected}>
          <Plus className="h-4 w-4" /> Add a day
        </Button>
      </div>

      {adding ? (
        <SessionForm
          nextNumber={nextNumber}
          onCancel={() => setAdding(false)}
          onSaved={async () => {
            setAdding(false);
            await refresh();
          }}
        />
      ) : null}

      {loading ? <Card>Loading…</Card> : null}

      {sessions.map((session) => (
        <Card key={session.id} className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">Day {session.number}</Badge>
            <span className="text-xs text-[var(--text-muted)]">{formatDate(session.date)}</span>
            <div className="ml-auto flex gap-1">
              <ConfirmDialog
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!connected || !fromDatabase}
                    aria-label={`Delete day ${session.number}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                }
                title={`Delete day ${session.number}?`}
                description="The day and everything on it goes, including what she has already ticked on it."
                confirmLabel="Delete"
                destructive
                onConfirm={async () => {
                  const supabase = createClient();
                  if (!supabase) return;
                  const { error } = await supabase.from('sessions').delete().eq('id', session.id);
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
          <p className="text-sm font-medium">{session.title}</p>
          <div className="flex flex-wrap gap-1.5">
            {session.blocks.map((b) => (
              <SubjectPill key={b.id} accent={b.accent} label={`${b.shortName} · ${b.chapterName}`} />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function QuestionAdmin({ connected }: { connected: boolean }) {
  const [subject, setSubject] = React.useState(SUBJECT_LIST[0].slug);
  const [chapter, setChapter] = React.useState<number>(SUBJECT_LIST[0].chapters[0].number);
  const [prompt, setPrompt] = React.useState('');
  const [options, setOptions] = React.useState(['', '', '', '']);
  const [correct, setCorrect] = React.useState(0);
  const [explanation, setExplanation] = React.useState('');
  const [marks, setMarks] = React.useState(1);
  const [difficulty, setDifficulty] = React.useState('medium');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  const subjectData = SUBJECT_LIST.find((s) => s.slug === subject)!;

  function validate() {
    const next: Record<string, string> = {};
    if (prompt.trim().length < 10) next.prompt = 'Write the full question';
    if (options.filter((o) => o.trim()).length < 2) next.options = 'At least two options';
    if (!options[correct]?.trim()) next.options = 'The correct option cannot be blank';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  return (
    <Card>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!validate()) return;
          const supabase = createClient();
          if (!supabase) {
            toast.error('Connect the database first');
            return;
          }
          setSaving(true);
          const { error } = await supabase.from('question_bank').insert({
            subject_id: subjectData.id,
            chapter_id: subjectData.chapters.find((c) => c.number === chapter)?.id,
            prompt: prompt.trim(),
            options: options.filter((o) => o.trim()),
            correct_index: correct,
            explanation: explanation.trim() || null,
            marks,
            difficulty,
          });
          setSaving(false);
          if (error) {
            toast.error(error.message);
            return;
          }
          toast.success('Question added');
          setPrompt('');
          setOptions(['', '', '', '']);
          setExplanation('');
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Subject" htmlFor="q-subject">
            <Select
              id="q-subject"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                const s = SUBJECT_LIST.find((x) => x.slug === e.target.value)!;
                setChapter(s.chapters[0].number);
              }}
            >
              {SUBJECT_LIST.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Chapter" htmlFor="q-chapter">
            <Select id="q-chapter" value={chapter} onChange={(e) => setChapter(Number(e.target.value))}>
              {subjectData.chapters.map((c) => (
                <option key={c.id} value={c.number}>
                  {c.number}. {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Question" error={errors.prompt} htmlFor="q-prompt">
          <Textarea id="q-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </Field>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Options — select the correct one</legend>
          {options.map((option, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                checked={correct === i}
                onChange={() => setCorrect(i)}
                aria-label={`Option ${String.fromCharCode(65 + i)} is correct`}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              <Input
                value={option}
                onChange={(e) => setOptions((o) => o.map((v, vi) => (vi === i ? e.target.value : v)))}
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                aria-label={`Option ${String.fromCharCode(65 + i)}`}
              />
            </div>
          ))}
          {errors.options ? (
            <p className="text-xs text-red-600" role="alert">
              {errors.options}
            </p>
          ) : null}
        </fieldset>

        <Field
          label="Explanation"
          hint="Why the right answer is right. She reads this after every attempt."
          htmlFor="q-exp"
        >
          <Textarea id="q-exp" value={explanation} onChange={(e) => setExplanation(e.target.value)} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
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
          <Field label="Difficulty" htmlFor="q-diff">
            <Select id="q-diff" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Select>
          </Field>
        </div>

        <Button type="submit" size="sm" disabled={!connected || saving}>
          <Plus className="h-4 w-4" /> {saving ? 'Saving…' : 'Add question'}
        </Button>
      </form>
    </Card>
  );
}

function PapersAdmin({ connected }: { connected: boolean }) {
  const [subject, setSubject] = React.useState(SUBJECT_LIST[0].slug);
  const [year, setYear] = React.useState(2025);
  const [title, setTitle] = React.useState('');
  const [url, setUrl] = React.useState('');
  const [error, setError] = React.useState('');
  const subjectData = SUBJECT_LIST.find((s) => s.slug === subject)!;

  return (
    <Card>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!/^https?:\/\//.test(url)) {
            setError('Needs a full link starting with https://');
            return;
          }
          setError('');
          const supabase = createClient();
          if (!supabase) {
            toast.error('Connect the database first');
            return;
          }
          const { error: dbError } = await supabase.from('previous_year_papers').insert({
            subject_id: subjectData.id,
            year,
            title: title.trim() || `${subjectData.name} ${year}`,
            paper_url: url.trim(),
          });
          toast[dbError ? 'error' : 'success'](dbError ? dbError.message : 'Paper added');
          if (!dbError) {
            setTitle('');
            setUrl('');
          }
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Subject" htmlFor="p-subject">
            <Select id="p-subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
              {SUBJECT_LIST.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Year" htmlFor="p-year">
            <Input
              id="p-year"
              type="number"
              min={2010}
              max={2030}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </Field>
        </div>
        <Field label="Title" htmlFor="p-title">
          <Input
            id="p-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="CBSE 2025 Maths Basic"
          />
        </Field>
        <Field label="Link to the paper" error={error} htmlFor="p-url">
          <Input id="p-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
        </Field>
        <Button type="submit" size="sm" disabled={!connected}>
          <Plus className="h-4 w-4" /> Add paper
        </Button>
      </form>
    </Card>
  );
}

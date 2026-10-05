'use client';

/**
 * Add a day to the plan.
 *
 * Writes the session, its subject blocks, the checklist for each block and any
 * resource links, all in one go. The checklist starts from the template for
 * that subject so a day can be added in about a minute, and every line is
 * editable before saving.
 */

import { Plus, Trash2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { templateFor } from '@/content/checklists';
import { SUBJECT_LIST } from '@/lib/data/content';
import { createClient } from '@/lib/supabase/client';
import { todayIso } from '@/lib/utils';

type BlockDraft = {
  key: string;
  subjectSlug: string;
  chapterNumber: number;
  focusTopic: string;
  minutes: number;
  checklist: { label: string; minutes?: number }[];
  resources: Record<'youtube' | 'ncert_pdf' | 'notes' | 'extra_questions', string>;
};

const RESOURCE_FIELDS = [
  ['youtube', 'Video lecture'],
  ['ncert_pdf', 'NCERT chapter'],
  ['notes', 'Notes'],
  ['extra_questions', 'Extra questions'],
] as const;

function newBlock(subjectSlug = 'maths'): BlockDraft {
  const subject = SUBJECT_LIST.find((s) => s.slug === subjectSlug)!;
  const chapter = subject.chapters[0];
  return {
    key: crypto.randomUUID(),
    subjectSlug,
    chapterNumber: chapter.number,
    focusTopic: '',
    minutes: subjectSlug === 'maths' ? 75 : 50,
    checklist: templateFor(subjectSlug, 'learn')
      .filter((item) => !item.standardOnly)
      .map((item) => ({ label: item.label, minutes: item.minutes })),
    resources: { youtube: '', ncert_pdf: '', notes: '', extra_questions: '' },
  };
}

export function SessionForm({
  nextNumber,
  onSaved,
  onCancel,
}: {
  nextNumber: number;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [date, setDate] = React.useState(todayIso());
  const [title, setTitle] = React.useState('');
  const [summary, setSummary] = React.useState('');
  const [blocks, setBlocks] = React.useState<BlockDraft[]>([newBlock('maths')]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  function patch(key: string, change: Partial<BlockDraft>) {
    setBlocks((current) => current.map((b) => (b.key === key ? { ...b, ...change } : b)));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (blocks.length === 0) {
      setError('Add at least one subject to the day');
      return;
    }

    const badUrl = blocks.some((b) =>
      Object.values(b.resources).some((url) => url.trim() && !/^https?:\/\//.test(url.trim())),
    );
    if (badUrl) {
      setError('Links need to start with https://');
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError('The database is not connected yet');
      return;
    }

    setSaving(true);
    try {
      const sessionId = crypto.randomUUID();
      const headline = blocks
        .map((b) => chapterOf(b)?.name)
        .filter(Boolean)
        .slice(0, 2)
        .join(' + ');

      const { error: sessionError } = await supabase.from('sessions').insert({
        id: sessionId,
        session_number: nextNumber,
        scheduled_date: date,
        phase: 'foundation',
        title: title.trim() || `Day ${nextNumber} — ${headline}`,
        summary: summary.trim() || null,
        focus_topics: blocks.map((b) => {
          const subject = SUBJECT_LIST.find((s) => s.slug === b.subjectSlug)!;
          return `${subject.shortName}: ${chapterOf(b)?.name ?? ''}`;
        }),
      });
      if (sessionError) throw sessionError;

      for (const [index, block] of blocks.entries()) {
        const subject = SUBJECT_LIST.find((s) => s.slug === block.subjectSlug)!;
        const chapter = chapterOf(block);
        const blockId = crypto.randomUUID();

        const { error: blockError } = await supabase.from('session_subjects').insert({
          id: blockId,
          session_id: sessionId,
          subject_id: subject.id,
          chapter_id: chapter?.id ?? null,
          chapter_name: chapter?.name ?? 'Chapter',
          focus_topic: block.focusTopic.trim() || `Work through ${chapter?.name ?? 'the chapter'}.`,
          estimated_minutes: block.minutes,
          sort_order: index,
        });
        if (blockError) throw blockError;

        const items = block.checklist.filter((item) => item.label.trim());
        if (items.length) {
          const { error: itemError } = await supabase.from('checklist_items').insert(
            items.map((item, itemIndex) => ({
              session_subject_id: blockId,
              label: item.label.trim(),
              estimated_minutes: item.minutes ?? null,
              sort_order: itemIndex,
            })),
          );
          if (itemError) throw itemError;
        }

        const links = RESOURCE_FIELDS.map(([kind, label], order) => ({
          session_subject_id: blockId,
          kind,
          label,
          url: block.resources[kind].trim(),
          sort_order: order,
        })).filter((r) => r.url);

        if (links.length) {
          const { error: linkError } = await supabase.from('resources').insert(links);
          if (linkError) throw linkError;
        }
      }

      toast.success(`Day ${nextNumber} added`);
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the day');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mb-6">
      <form className="space-y-5" onSubmit={save}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date" htmlFor="session-date">
            <Input id="session-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>
          <Field label="Day number" htmlFor="session-number">
            <Input id="session-number" value={nextNumber} readOnly disabled />
          </Field>
        </div>

        <Field label="Title" hint="Leave blank and it is built from the chapters." htmlFor="session-title">
          <Input id="session-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>

        <Field label="A note for her" hint="Shows under the title on her screen." htmlFor="session-summary">
          <Textarea
            id="session-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Take the Maths slowly today — the exercise matters more than finishing fast."
          />
        </Field>

        <div className="space-y-4">
          {blocks.map((block, index) => {
            const subject = SUBJECT_LIST.find((s) => s.slug === block.subjectSlug)!;
            return (
              <div key={block.key} className="rounded-xl border border-[var(--border)] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <CardTitle>Subject {index + 1}</CardTitle>
                  {blocks.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Remove subject ${index + 1}`}
                      onClick={() => setBlocks((current) => current.filter((b) => b.key !== block.key))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Subject" htmlFor={`subject-${block.key}`}>
                    <Select
                      id={`subject-${block.key}`}
                      value={block.subjectSlug}
                      onChange={(e) => {
                        const fresh = newBlock(e.target.value);
                        patch(block.key, {
                          subjectSlug: fresh.subjectSlug,
                          chapterNumber: fresh.chapterNumber,
                          checklist: fresh.checklist,
                          minutes: fresh.minutes,
                        });
                      }}
                    >
                      {SUBJECT_LIST.map((s) => (
                        <option key={s.slug} value={s.slug}>
                          {s.name}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Chapter" htmlFor={`chapter-${block.key}`}>
                    <Select
                      id={`chapter-${block.key}`}
                      value={block.chapterNumber}
                      onChange={(e) => patch(block.key, { chapterNumber: Number(e.target.value) })}
                    >
                      {subject.chapters.map((c) => (
                        <option key={c.id} value={c.number}>
                          {c.number}. {c.name} ({c.weightage} marks)
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_120px]">
                  <Field label="What to focus on" htmlFor={`focus-${block.key}`}>
                    <Input
                      id={`focus-${block.key}`}
                      value={block.focusTopic}
                      onChange={(e) => patch(block.key, { focusTopic: e.target.value })}
                      placeholder="Exercise 3.2 and the elimination method"
                    />
                  </Field>
                  <Field label="Minutes" htmlFor={`minutes-${block.key}`}>
                    <Input
                      id={`minutes-${block.key}`}
                      type="number"
                      min={5}
                      max={300}
                      value={block.minutes}
                      onChange={(e) => patch(block.key, { minutes: Number(e.target.value) })}
                    />
                  </Field>
                </div>

                <fieldset className="mt-4">
                  <legend className="mb-2 text-sm font-medium">Checklist</legend>
                  <div className="space-y-2">
                    {block.checklist.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center gap-2">
                        <Input
                          value={item.label}
                          aria-label={`Task ${itemIndex + 1}`}
                          onChange={(e) =>
                            patch(block.key, {
                              checklist: block.checklist.map((c, ci) =>
                                ci === itemIndex ? { ...c, label: e.target.value } : c,
                              ),
                            })
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label={`Remove task ${itemIndex + 1}`}
                          onClick={() =>
                            patch(block.key, { checklist: block.checklist.filter((_, ci) => ci !== itemIndex) })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => patch(block.key, { checklist: [...block.checklist, { label: '' }] })}
                    >
                      <Plus className="h-4 w-4" /> Add task
                    </Button>
                  </div>
                </fieldset>

                <fieldset className="mt-4">
                  <legend className="mb-2 text-sm font-medium">Links</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {RESOURCE_FIELDS.map(([kind, label]) => (
                      <Input
                        key={kind}
                        value={block.resources[kind]}
                        aria-label={label}
                        placeholder={label}
                        onChange={(e) =>
                          patch(block.key, { resources: { ...block.resources, [kind]: e.target.value } })
                        }
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                    Leave any of these empty — she sees a quiet &ldquo;not added yet&rdquo; rather than a dead link.
                  </p>
                </fieldset>
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setBlocks((c) => [...c, newBlock('science')])}
          >
            <Plus className="h-4 w-4" /> Add another subject
          </Button>
        </div>

        {error ? (
          <p
            className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? 'Saving…' : 'Add this day'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function chapterOf(block: BlockDraft) {
  return SUBJECT_LIST.find((s) => s.slug === block.subjectSlug)?.chapters.find((c) => c.number === block.chapterNumber);
}

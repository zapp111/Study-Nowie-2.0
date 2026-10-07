'use client';

/**
 * Add a day to the plan, or edit one that is already there.
 *
 * Writes the session, its subject blocks, the checklist for each block and any
 * resource links, all in one go. The checklist starts from the template for
 * that subject so a day can be added in about a minute, and every line is
 * editable before saving.
 *
 * Editing keeps the id of anything that already exists. That matters: her
 * ticks hang off `checklist_items.id` with an `on delete cascade`, so
 * rewriting a day by deleting and reinserting its tasks would silently wipe
 * the work she has already done on it.
 */

import { Plus, Trash2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { templateFor } from '@/content/checklists';
import { SUBJECT_LIST, type Session } from '@/lib/data/content';
import { createClient } from '@/lib/supabase/client';
import { todayIso } from '@/lib/utils';

type TaskDraft = {
  key: string;
  /** Set when this task already exists in the database. */
  id?: string;
  label: string;
  minutes?: number;
  optional: boolean;
  standardOnly: boolean;
};

type BlockDraft = {
  key: string;
  /** Set when this block already exists in the database. */
  id?: string;
  subjectSlug: string;
  chapterNumber: number;
  focusTopic: string;
  minutes: number;
  checklist: TaskDraft[];
  resources: Record<'youtube' | 'ncert_pdf' | 'notes' | 'extra_questions', string>;
};

const RESOURCE_FIELDS = [
  ['youtube', 'Video lecture'],
  ['ncert_pdf', 'NCERT chapter'],
  ['notes', 'Notes'],
  ['extra_questions', 'Extra questions'],
] as const;

function newTask(label = '', minutes?: number, optional = false, standardOnly = false): TaskDraft {
  return { key: crypto.randomUUID(), label, minutes, optional, standardOnly };
}

function newBlock(subjectSlug = 'maths'): BlockDraft {
  const subject = SUBJECT_LIST.find((s) => s.slug === subjectSlug)!;
  const chapter = subject.chapters[0];
  return {
    key: crypto.randomUUID(),
    subjectSlug,
    chapterNumber: chapter.number,
    focusTopic: '',
    minutes: subjectSlug === 'maths' ? 75 : 50,
    checklist: templateFor(subjectSlug, 'learn').map((item) =>
      newTask(item.label, item.minutes, Boolean(item.optional), Boolean(item.standardOnly)),
    ),
    resources: { youtube: '', ncert_pdf: '', notes: '', extra_questions: '' },
  };
}

/** Turn a saved day back into something the form can edit. */
function blocksFrom(session: Session): BlockDraft[] {
  return session.blocks.map((block) => {
    const resources: BlockDraft['resources'] = { youtube: '', ncert_pdf: '', notes: '', extra_questions: '' };
    for (const resource of block.resources) {
      if (resource.kind !== 'other' && resource.url) resources[resource.kind] = resource.url;
    }
    const subject = SUBJECT_LIST.find((s) => s.slug === block.subjectSlug) ?? SUBJECT_LIST[0];
    return {
      key: crypto.randomUUID(),
      id: block.id,
      subjectSlug: subject.slug,
      chapterNumber: block.chapterNumber ?? subject.chapters[0].number,
      focusTopic: block.focusTopic,
      minutes: block.minutes,
      checklist: block.checklist.map((item) => ({
        key: crypto.randomUUID(),
        id: item.id,
        label: item.label,
        minutes: item.minutes,
        optional: item.optional,
        standardOnly: item.standardOnly,
      })),
      resources,
    };
  });
}

export function SessionForm({
  nextNumber,
  session,
  onSaved,
  onCancel,
}: {
  nextNumber: number;
  /** Omit to add a new day, pass a day to edit it in place. */
  session?: Session;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const editing = Boolean(session);
  const dayNumber = session?.number ?? nextNumber;

  const [date, setDate] = React.useState(session?.date ?? todayIso());
  const [title, setTitle] = React.useState(session?.title ?? '');
  const [summary, setSummary] = React.useState(session?.summary ?? '');
  const [blocks, setBlocks] = React.useState<BlockDraft[]>(() =>
    session ? blocksFrom(session) : [newBlock('maths')],
  );
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  function patch(key: string, change: Partial<BlockDraft>) {
    setBlocks((current) => current.map((b) => (b.key === key ? { ...b, ...change } : b)));
  }

  function patchTask(blockKey: string, taskKey: string, change: Partial<TaskDraft>) {
    setBlocks((current) =>
      current.map((b) =>
        b.key === blockKey
          ? { ...b, checklist: b.checklist.map((t) => (t.key === taskKey ? { ...t, ...change } : t)) }
          : b,
      ),
    );
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

    // One subject can only appear once per day — the table has a unique on it,
    // so catch it here and say so plainly rather than surfacing a Postgres error.
    const slugs = blocks.map((b) => b.subjectSlug);
    if (new Set(slugs).size !== slugs.length) {
      setError('Each subject can only be added once to a day');
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError('The database is not connected yet');
      return;
    }

    setSaving(true);
    try {
      const sessionId = session?.id ?? crypto.randomUUID();
      const headline = blocks
        .map((b) => chapterOf(b)?.name)
        .filter(Boolean)
        .slice(0, 2)
        .join(' + ');

      const sessionRow = {
        scheduled_date: date,
        title: title.trim() || `Day ${dayNumber} — ${headline}`,
        summary: summary.trim() || null,
        focus_topics: blocks.map((b) => {
          const subject = SUBJECT_LIST.find((s) => s.slug === b.subjectSlug)!;
          return `${subject.shortName}: ${chapterOf(b)?.name ?? ''}`;
        }),
      };

      if (editing) {
        const { error: updateError } = await supabase.from('sessions').update(sessionRow).eq('id', sessionId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('sessions').insert({
          id: sessionId,
          session_number: dayNumber,
          phase: 'foundation',
          ...sessionRow,
        });
        if (insertError) throw insertError;
      }

      // Blocks that were on the day before but are not any more.
      const keptBlockIds = blocks.map((b) => b.id).filter(Boolean) as string[];
      const removedBlockIds = (session?.blocks ?? []).map((b) => b.id).filter((id) => !keptBlockIds.includes(id));
      if (removedBlockIds.length) {
        const { error: dropError } = await supabase.from('session_subjects').delete().in('id', removedBlockIds);
        if (dropError) throw dropError;
      }

      for (const [index, block] of blocks.entries()) {
        const subject = SUBJECT_LIST.find((s) => s.slug === block.subjectSlug)!;
        const chapter = chapterOf(block);
        const blockId = block.id ?? crypto.randomUUID();

        const blockRow = {
          subject_id: subject.id,
          chapter_id: chapter?.id ?? null,
          chapter_name: chapter?.name ?? 'Chapter',
          focus_topic: block.focusTopic.trim() || `Work through ${chapter?.name ?? 'the chapter'}.`,
          estimated_minutes: block.minutes,
          sort_order: index,
        };

        if (block.id) {
          const { error: blockError } = await supabase.from('session_subjects').update(blockRow).eq('id', blockId);
          if (blockError) throw blockError;
        } else {
          const { error: blockError } = await supabase
            .from('session_subjects')
            .insert({ id: blockId, session_id: sessionId, ...blockRow });
          if (blockError) throw blockError;
        }

        const items = block.checklist.filter((item) => item.label.trim());

        // Tasks she may already have ticked are updated in place, never
        // recreated, so her progress survives the edit.
        const keptItemIds = items.map((i) => i.id).filter(Boolean) as string[];
        const previousItems = session?.blocks.find((b) => b.id === block.id)?.checklist ?? [];
        const removedItemIds = previousItems.map((i) => i.id).filter((id) => !keptItemIds.includes(id));
        if (removedItemIds.length) {
          const { error: dropItems } = await supabase.from('checklist_items').delete().in('id', removedItemIds);
          if (dropItems) throw dropItems;
        }

        for (const [itemIndex, item] of items.entries()) {
          const itemRow = {
            label: item.label.trim(),
            estimated_minutes: item.minutes ?? null,
            is_optional: item.optional,
            standard_only: item.standardOnly,
            sort_order: itemIndex,
          };
          if (item.id) {
            const { error: itemError } = await supabase.from('checklist_items').update(itemRow).eq('id', item.id);
            if (itemError) throw itemError;
          } else {
            const { error: itemError } = await supabase
              .from('checklist_items')
              .insert({ session_subject_id: blockId, ...itemRow });
            if (itemError) throw itemError;
          }
        }

        // Nothing hangs off a resource row, so these are simply replaced.
        const { error: clearLinks } = await supabase.from('resources').delete().eq('session_subject_id', blockId);
        if (clearLinks) throw clearLinks;

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

      toast.success(editing ? `Day ${dayNumber} updated` : `Day ${dayNumber} added`);
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the day');
    } finally {
      setSaving(false);
    }
  }

  const requiredMinutes = blocks.reduce(
    (sum, b) => sum + b.checklist.filter((t) => !t.optional && t.label.trim()).reduce((s, t) => s + (t.minutes ?? 0), 0),
    0,
  );

  return (
    <Card className="mb-6">
      <form className="space-y-5" onSubmit={save}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date" htmlFor="session-date">
            <Input id="session-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>
          <Field label="Day number" htmlFor="session-number">
            <Input id="session-number" value={dayNumber} readOnly disabled />
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
                      <div
                        key={item.key}
                        className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] p-2 sm:flex-nowrap"
                      >
                        <Input
                          className="min-w-0 flex-1"
                          value={item.label}
                          aria-label={`Task ${itemIndex + 1}`}
                          onChange={(e) => patchTask(block.key, item.key, { label: e.target.value })}
                        />
                        <Input
                          className="w-20 shrink-0"
                          type="number"
                          min={0}
                          max={300}
                          value={item.minutes ?? ''}
                          placeholder="min"
                          aria-label={`Minutes for task ${itemIndex + 1}`}
                          onChange={(e) =>
                            patchTask(block.key, item.key, {
                              minutes: e.target.value === '' ? undefined : Number(e.target.value),
                            })
                          }
                        />
                        <label className="flex shrink-0 items-center gap-1.5 text-xs text-[var(--text-muted)]">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-[var(--accent)]"
                            checked={item.optional}
                            onChange={(e) => patchTask(block.key, item.key, { optional: e.target.checked })}
                          />
                          Optional
                        </label>
                        <label className="flex shrink-0 items-center gap-1.5 text-xs text-[var(--text-muted)]">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-[var(--accent)]"
                            checked={item.standardOnly}
                            onChange={(e) => patchTask(block.key, item.key, { standardOnly: e.target.checked })}
                          />
                          Standard only
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label={`Remove task ${itemIndex + 1}`}
                          onClick={() =>
                            patch(block.key, { checklist: block.checklist.filter((t) => t.key !== item.key) })
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
                      onClick={() => patch(block.key, { checklist: [...block.checklist, newTask()] })}
                    >
                      <Plus className="h-4 w-4" /> Add task
                    </Button>
                  </div>
                  <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                    Optional tasks still show on her screen, but they are left out of the progress ring. Standard-only
                    tasks are hidden entirely while she is on Maths Basic.
                  </p>
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
            onClick={() => {
              const taken = new Set(blocks.map((b) => b.subjectSlug));
              const free = SUBJECT_LIST.find((s) => !taken.has(s.slug));
              if (!free) {
                setError('Every subject is already on this day');
                return;
              }
              setBlocks((c) => [...c, newBlock(free.slug)]);
            }}
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

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-[var(--text-muted)]">
            Required tasks add up to {requiredMinutes} minutes.
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add this day'}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}

function chapterOf(block: BlockDraft) {
  return SUBJECT_LIST.find((s) => s.slug === block.subjectSlug)?.chapters.find((c) => c.number === block.chapterNumber);
}

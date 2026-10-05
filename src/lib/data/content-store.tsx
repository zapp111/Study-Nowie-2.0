'use client';

/**
 * Where the study content comes from.
 *
 * When the database is connected, sessions are read from it — so anything you
 * add in the admin panel shows up for her straight away. When it is not, the
 * small bundled starter plan is used instead, which keeps the app usable and
 * gives you something to click through while setting things up.
 */

import * as React from 'react';
import {
  SESSIONS as BUNDLED_SESSIONS,
  SUBJECT_LIST,
  type Quiz,
  type Resource,
  type Session,
  type SubjectBlock,
} from './content';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';

type ContentValue = {
  sessions: Session[];
  loading: boolean;
  error: string | null;
  /** True when the sessions came from the database rather than the bundle. */
  fromDatabase: boolean;
  refresh: () => Promise<void>;
};

const ContentContext = React.createContext<ContentValue | null>(null);

type SessionRow = {
  id: string;
  session_number: number;
  scheduled_date: string;
  phase: Session['phase'];
  title: string;
  summary: string | null;
  focus_topics: string[] | null;
  session_subjects: SessionSubjectRow[] | null;
};

type SessionSubjectRow = {
  id: string;
  subject_id: string;
  chapter_id: string | null;
  chapter_name: string;
  focus_topic: string;
  estimated_minutes: number;
  sort_order: number;
  checklist_items: ChecklistRow[] | null;
  resources: ResourceRow[] | null;
  quizzes: QuizRow[] | null;
};

type ChecklistRow = {
  id: string;
  label: string;
  detail: string | null;
  estimated_minutes: number | null;
  standard_only: boolean;
  is_optional: boolean;
  sort_order: number;
};

type ResourceRow = {
  id: string;
  kind: Resource['kind'];
  label: string;
  url: string;
  sort_order: number;
};

type QuizRow = {
  id: string;
  title: string;
  description: string | null;
  quiz_questions: QuestionRow[] | null;
};

type QuestionRow = {
  id: string;
  prompt: string;
  stimulus: string | null;
  options: string[];
  correct_index: number;
  explanation: string | null;
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  question_type: 'mcq' | 'assertion_reason' | 'case_study' | 'short_answer';
  sort_order: number;
};

const SELECT = `
  id, session_number, scheduled_date, phase, title, summary, focus_topics,
  session_subjects (
    id, subject_id, chapter_id, chapter_name, focus_topic, estimated_minutes, sort_order,
    checklist_items ( id, label, detail, estimated_minutes, standard_only, is_optional, sort_order ),
    resources ( id, kind, label, url, sort_order ),
    quizzes (
      id, title, description,
      quiz_questions ( id, prompt, stimulus, options, correct_index, explanation, marks, difficulty, question_type, sort_order )
    )
  )
`;

const subjectById = new Map(SUBJECT_LIST.map((s) => [s.id, s]));

function mapRow(row: SessionRow): Session {
  const blocks: SubjectBlock[] = [...(row.session_subjects ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((block) => {
      const subject = subjectById.get(block.subject_id) ?? SUBJECT_LIST[0];
      const chapter = subject.chapters.find((c) => c.id === block.chapter_id);
      const quizRow = block.quizzes?.[0];

      const quiz: Quiz | null = quizRow
        ? {
            id: quizRow.id,
            title: quizRow.title,
            description: quizRow.description ?? undefined,
            questions: [...(quizRow.quiz_questions ?? [])]
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((question) => ({
                id: question.id,
                prompt: question.prompt,
                stimulus: question.stimulus ?? undefined,
                options: question.options,
                correctIndex: question.correct_index,
                explanation: question.explanation ?? '',
                marks: question.marks,
                difficulty: question.difficulty,
                type: question.question_type === 'short_answer' ? 'mcq' : question.question_type,
              })),
          }
        : null;

      // Only the four standard slots are shown, and a slot with no link renders
      // as unavailable rather than as a dead link.
      const saved = block.resources ?? [];
      const resources: Resource[] = (['youtube', 'ncert_pdf', 'notes', 'extra_questions'] as const).map((kind) => {
        const match = saved.find((r) => r.kind === kind);
        return {
          id: match?.id ?? `${block.id}-${kind}`,
          kind,
          label: match?.label ?? defaultLabel(kind),
          url: match?.url ?? null,
        };
      });

      return {
        id: block.id,
        subjectSlug: subject.slug,
        subjectName: subject.name,
        shortName: subject.shortName,
        accent: subject.accent,
        chapterNumber: chapter?.number ?? null,
        chapterName: block.chapter_name,
        chapterId: block.chapter_id,
        weightage: chapter?.weightage ?? 0,
        focusTopic: block.focus_topic,
        minutes: block.estimated_minutes,
        mode: 'learn',
        checklist: [...(block.checklist_items ?? [])]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((item) => ({
            id: item.id,
            label: item.label,
            detail: item.detail ?? undefined,
            minutes: item.estimated_minutes ?? undefined,
            standardOnly: item.standard_only,
            optional: item.is_optional,
          })),
        resources,
        quiz,
      };
    });

  return {
    id: row.id,
    number: row.session_number,
    date: row.scheduled_date,
    phase: row.phase,
    title: row.title,
    summary: row.summary ?? '',
    focusTopics: row.focus_topics ?? [],
    totalMinutes: blocks.reduce((sum, b) => sum + b.minutes, 0),
    blocks,
    isPaperDay: blocks.length === 0,
  };
}

function defaultLabel(kind: Resource['kind']): string {
  if (kind === 'youtube') return 'Video lecture';
  if (kind === 'ncert_pdf') return 'NCERT chapter';
  if (kind === 'notes') return 'Notes';
  if (kind === 'extra_questions') return 'Extra questions';
  return 'Link';
}

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const supabase = React.useMemo(() => createClient(), []);
  const [sessions, setSessions] = React.useState<Session[]>(BUNDLED_SESSIONS);
  const [loading, setLoading] = React.useState(isSupabaseConfigured);
  const [error, setError] = React.useState<string | null>(null);
  const [fromDatabase, setFromDatabase] = React.useState(false);

  const fetchSessions = React.useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error: queryError } = await supabase
        .from('sessions')
        .select(SELECT)
        .eq('is_published', true)
        .order('session_number');

      if (queryError) throw queryError;

      setError(null);
      // The schedule has been deliberately cleared. Do not resurrect old
      // published rows from a database that has not run the cleanup migration.
      setSessions(BUNDLED_SESSIONS);
      setFromDatabase(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load the study plan');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  React.useEffect(() => {
    // Deferred by a tick so the first paint is never blocked by the fetch.
    const handle = window.setTimeout(() => void fetchSessions(), 0);
    return () => window.clearTimeout(handle);
  }, [fetchSessions]);

  const load = React.useCallback(async () => {
    setLoading(true);
    await fetchSessions();
  }, [fetchSessions]);

  const value = React.useMemo<ContentValue>(
    () => ({ sessions, loading, error, fromDatabase, refresh: load }),
    [sessions, loading, error, fromDatabase, load],
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent(): ContentValue {
  const ctx = React.useContext(ContentContext);
  if (!ctx) throw new Error('useContent must be used inside ContentProvider');
  return ctx;
}

/** Look-ups that need the live list rather than the bundled one. */
export function findSession(sessions: Session[], number: number): Session | undefined {
  return sessions.find((s) => s.number === number);
}

export function findQuizIn(sessions: Session[], quizId: string) {
  for (const session of sessions) {
    for (const block of session.blocks) {
      if (block.quiz?.id === quizId) return { quiz: block.quiz, block, session };
    }
  }
  return undefined;
}

export function sessionForToday(sessions: Session[], iso: string): Session | undefined {
  return sessions.find((s) => s.date === iso) ?? sessions.find((s) => s.date > iso) ?? sessions[sessions.length - 1];
}

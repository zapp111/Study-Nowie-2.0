'use client';

/**
 * Everything the student does: ticked checklist items, quiz attempts, syllabus
 * states, mistakes, marks and daily minutes.
 *
 * Two backends sit behind one interface. Without a database the state lives on
 * the device, so the planner works the moment you open it. With Supabase
 * configured the same calls write to Postgres under row level security, and the
 * state follows her to any device.
 */

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { todayIso } from '@/lib/utils';

export type ChapterState = 'not_started' | 'learning' | 'ncert_done' | 'revised' | 'tested';

export type QuizAttempt = {
  id: string;
  quizId: string;
  score: number;
  total: number;
  responses: { questionId: string; selectedIndex: number; correct: boolean }[];
  createdAt: string;
};

export type Mistake = {
  id: string;
  subjectSlug: string | null;
  chapterId: string | null;
  question: string;
  whatWentWrong: string;
  correctMethod: string;
  source: string;
  reattemptOn: string;
  resolvedAt: string | null;
  createdAt: string;
};

export type TestScore = {
  id: string;
  subjectSlug: string | null;
  kind: 'chapter_test' | 'sample_paper' | 'mock' | 'school_exam';
  title: string;
  score: number;
  maxScore: number;
  takenOn: string;
};

export type Profile = {
  displayName: string;
  mathsLevel: 'basic' | 'standard';
  examDate: string;
  dailyGoalMinutes: number;
};

export type ProgressState = {
  checklist: Record<string, string>; // item id -> completion timestamp
  attempts: QuizAttempt[];
  chapters: Record<string, ChapterState>;
  mistakes: Mistake[];
  scores: TestScore[];
  minutes: Record<string, number>; // date -> minutes
  profile: Profile;
};

export const DEFAULT_PROFILE: Profile = {
  displayName: 'Joyuu',
  mathsLevel: 'basic',
  examDate: '2026-02-17',
  dailyGoalMinutes: 150,
};

const EMPTY: ProgressState = {
  checklist: {},
  attempts: [],
  chapters: {},
  mistakes: [],
  scores: [],
  minutes: {},
  profile: DEFAULT_PROFILE,
};

const STORAGE_KEY = 'study-nowie:progress:v1';

type Ctx = {
  state: ProgressState;
  ready: boolean;
  syncing: boolean;
  error: string | null;
  toggleChecklist: (itemId: string, minutes?: number) => void;
  recordAttempt: (attempt: Omit<QuizAttempt, 'id' | 'createdAt'>) => void;
  setChapterState: (chapterId: string, state: ChapterState) => void;
  addMistake: (mistake: Omit<Mistake, 'id' | 'createdAt' | 'resolvedAt'>) => void;
  resolveMistake: (id: string) => void;
  removeMistake: (id: string) => void;
  addScore: (score: Omit<TestScore, 'id'>) => void;
  removeScore: (id: string) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  resetProgress: () => void;
};

const ProgressContext = React.createContext<Ctx | null>(null);

function readLocal(): ProgressState {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return { ...EMPTY, ...parsed, profile: { ...DEFAULT_PROFILE, ...parsed.profile } };
  } catch {
    return EMPTY;
  }
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

const subscribeToNothing = () => () => {};

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  // Read the device copy straight away, but only expose it once hydration is
  // done, so the server HTML and the first client render always match.
  const [stored, setState] = React.useState<ProgressState>(readLocal);
  const ready = React.useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
  const state = ready ? stored : EMPTY;
  const [syncing, setSyncing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const supabase = React.useMemo(() => createClient(), []);

  // Load. Local storage first so the UI paints instantly, then the database
  // if one is connected.
  React.useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    (async () => {
      setSyncing(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        const [profile, checklist, attempts, chapters, mistakes, scores, log] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
          supabase.from('checklist_progress').select('*').eq('user_id', user.id).eq('is_complete', true),
          supabase.from('quiz_attempts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('chapter_progress').select('*').eq('user_id', user.id),
          supabase.from('mistakes').select('*').eq('user_id', user.id).order('reattempt_on'),
          supabase.from('test_scores').select('*').eq('user_id', user.id).order('taken_on', { ascending: false }),
          supabase.from('study_log').select('*').eq('user_id', user.id),
        ]);

        if (cancelled) return;

        setState((current) => ({
          ...current,
          profile: profile.data
            ? {
                displayName: profile.data.display_name ?? DEFAULT_PROFILE.displayName,
                mathsLevel: profile.data.maths_level ?? 'basic',
                examDate: profile.data.exam_date ?? DEFAULT_PROFILE.examDate,
                dailyGoalMinutes: profile.data.daily_goal_minutes ?? DEFAULT_PROFILE.dailyGoalMinutes,
              }
            : current.profile,
          checklist: Object.fromEntries(
            (checklist.data ?? []).map((row) => [row.checklist_item_id, row.completed_at ?? row.created_at]),
          ),
          attempts: (attempts.data ?? []).map((row) => ({
            id: row.id,
            quizId: row.quiz_id,
            score: row.score,
            total: row.total,
            responses: row.responses ?? [],
            createdAt: row.created_at,
          })),
          chapters: Object.fromEntries((chapters.data ?? []).map((row) => [row.chapter_id, row.state])),
          mistakes: (mistakes.data ?? []).map((row) => ({
            id: row.id,
            subjectSlug: null,
            chapterId: row.chapter_id,
            question: row.question,
            whatWentWrong: row.what_went_wrong ?? '',
            correctMethod: row.correct_method ?? '',
            source: row.source ?? '',
            reattemptOn: row.reattempt_on,
            resolvedAt: row.resolved_at,
            createdAt: row.created_at,
          })),
          scores: (scores.data ?? []).map((row) => ({
            id: row.id,
            subjectSlug: null,
            kind: row.kind,
            title: row.title,
            score: Number(row.score),
            maxScore: Number(row.max_score),
            takenOn: row.taken_on,
          })),
          minutes: Object.fromEntries((log.data ?? []).map((row) => [row.logged_on, row.minutes])),
        }));
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Could not load your progress');
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // Persist locally on every change. This also acts as an offline cache when a
  // database is connected.
  React.useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // Storage full or blocked — the in-memory state still works for this visit.
    }
  }, [stored, ready]);

  const withUser = React.useCallback(
    async (run: (userId: string) => Promise<unknown>) => {
      if (!supabase) return;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        await run(user.id);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Could not save that');
      }
    },
    [supabase],
  );

  const logMinutes = React.useCallback(
    (minutes: number) => {
      if (!minutes) return;
      const day = todayIso();
      setState((s) => ({ ...s, minutes: { ...s.minutes, [day]: (s.minutes[day] ?? 0) + minutes } }));
      void withUser(async (userId) => {
        const existing = await supabase!
          .from('study_log')
          .select('minutes')
          .eq('user_id', userId)
          .eq('logged_on', day)
          .maybeSingle();
        await supabase!
          .from('study_log')
          .upsert(
            { user_id: userId, logged_on: day, minutes: (existing.data?.minutes ?? 0) + minutes },
            { onConflict: 'user_id,logged_on' },
          );
      });
    },
    [supabase, withUser],
  );

  const value: Ctx = React.useMemo(
    () => ({
      state,
      ready,
      syncing,
      error,
      toggleChecklist(itemId, minutes = 0) {
        let nowComplete = false;
        setState((s) => {
          const next = { ...s.checklist };
          if (next[itemId]) {
            delete next[itemId];
          } else {
            next[itemId] = new Date().toISOString();
            nowComplete = true;
          }
          return { ...s, checklist: next };
        });
        void withUser(async (userId) => {
          const isComplete = nowComplete;
          await supabase!.from('checklist_progress').upsert(
            {
              user_id: userId,
              checklist_item_id: itemId,
              is_complete: isComplete,
              completed_at: isComplete ? new Date().toISOString() : null,
            },
            { onConflict: 'user_id,checklist_item_id' },
          );
        });
        if (minutes) {
          // Only count time when ticking on, never when un-ticking.
          window.setTimeout(() => {
            if (nowComplete) logMinutes(minutes);
          }, 0);
        }
      },
      recordAttempt(attempt) {
        const row: QuizAttempt = { ...attempt, id: randomId(), createdAt: new Date().toISOString() };
        setState((s) => ({ ...s, attempts: [row, ...s.attempts] }));
        void withUser(async (userId) => {
          await supabase!.from('quiz_attempts').insert({
            user_id: userId,
            quiz_id: attempt.quizId,
            score: attempt.score,
            total: attempt.total,
            responses: attempt.responses,
          });
        });
      },
      setChapterState(chapterId, chapterState) {
        setState((s) => ({ ...s, chapters: { ...s.chapters, [chapterId]: chapterState } }));
        void withUser(async (userId) => {
          await supabase!
            .from('chapter_progress')
            .upsert(
              { user_id: userId, chapter_id: chapterId, state: chapterState },
              { onConflict: 'user_id,chapter_id' },
            );
        });
      },
      addMistake(mistake) {
        const row: Mistake = { ...mistake, id: randomId(), resolvedAt: null, createdAt: new Date().toISOString() };
        setState((s) => ({ ...s, mistakes: [row, ...s.mistakes] }));
        void withUser(async (userId) => {
          await supabase!.from('mistakes').insert({
            user_id: userId,
            chapter_id: mistake.chapterId,
            question: mistake.question,
            what_went_wrong: mistake.whatWentWrong,
            correct_method: mistake.correctMethod,
            source: mistake.source,
            reattempt_on: mistake.reattemptOn,
          });
        });
      },
      resolveMistake(id) {
        const resolvedAt = new Date().toISOString();
        setState((s) => ({ ...s, mistakes: s.mistakes.map((m) => (m.id === id ? { ...m, resolvedAt } : m)) }));
        void withUser(async () => {
          await supabase!.from('mistakes').update({ resolved_at: resolvedAt }).eq('id', id);
        });
      },
      removeMistake(id) {
        setState((s) => ({ ...s, mistakes: s.mistakes.filter((m) => m.id !== id) }));
        void withUser(async () => {
          await supabase!.from('mistakes').delete().eq('id', id);
        });
      },
      addScore(score) {
        const row: TestScore = { ...score, id: randomId() };
        setState((s) => ({ ...s, scores: [row, ...s.scores] }));
        void withUser(async (userId) => {
          await supabase!.from('test_scores').insert({
            user_id: userId,
            kind: score.kind,
            title: score.title,
            score: score.score,
            max_score: score.maxScore,
            taken_on: score.takenOn,
          });
        });
      },
      removeScore(id) {
        setState((s) => ({ ...s, scores: s.scores.filter((x) => x.id !== id) }));
        void withUser(async () => {
          await supabase!.from('test_scores').delete().eq('id', id);
        });
      },
      updateProfile(patch) {
        setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
        void withUser(async (userId) => {
          await supabase!
            .from('profiles')
            .update({
              display_name: patch.displayName,
              maths_level: patch.mathsLevel,
              exam_date: patch.examDate,
              daily_goal_minutes: patch.dailyGoalMinutes,
            })
            .eq('id', userId);
        });
      },
      resetProgress() {
        setState((s) => ({ ...EMPTY, profile: s.profile }));
        void withUser(async (userId) => {
          await Promise.all([
            supabase!.from('checklist_progress').delete().eq('user_id', userId),
            supabase!.from('quiz_attempts').delete().eq('user_id', userId),
            supabase!.from('chapter_progress').delete().eq('user_id', userId),
            supabase!.from('study_log').delete().eq('user_id', userId),
          ]);
        });
      },
    }),
    [state, ready, syncing, error, supabase, withUser, logMinutes],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): Ctx {
  const ctx = React.useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}

export { isSupabaseConfigured };

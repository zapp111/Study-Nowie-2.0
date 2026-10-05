/**
 * The content model the UI renders.
 *
 * The plan, the chapter list and the quizzes all live in `src/content` as the
 * single source of truth. This file turns them into the shape the pages want,
 * with stable ids so that the bundled copy and the database rows refer to the
 * same things.
 */

import { QUIZZES, type QuestionSeed } from '@/content/quizzes';
import { PLAN, PHASES, DATESHEET, type Phase, type PlannedSession } from '@/content/plan';
import { SUBJECTS, type ChapterSeed } from '@/content/subjects';
import { slugId } from '@/lib/utils';

export type Accent = 'rose' | 'violet' | 'amber' | 'sky' | 'emerald';

export type Subject = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  accent: Accent;
  paperDate: string;
  chapters: Chapter[];
  totalWeightage: number;
};

export type Chapter = ChapterSeed & { id: string; subjectSlug: string };

export type ChecklistItem = {
  id: string;
  label: string;
  detail?: string;
  minutes?: number;
  standardOnly: boolean;
  optional: boolean;
};

export type Resource = {
  id: string;
  kind: 'youtube' | 'ncert_pdf' | 'notes' | 'extra_questions' | 'other';
  label: string;
  url: string | null;
};

export type Question = QuestionSeed & { id: string };

export type Quiz = {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
};

export type SubjectBlock = {
  id: string;
  subjectSlug: string;
  subjectName: string;
  shortName: string;
  accent: Accent;
  chapterNumber: number | null;
  chapterName: string;
  chapterId: string | null;
  weightage: number;
  focusTopic: string;
  minutes: number;
  mode: 'learn' | 'revise' | 'drill';
  checklist: ChecklistItem[];
  resources: Resource[];
  quiz: Quiz | null;
};

export type Session = {
  id: string;
  number: number;
  date: string;
  phase: Phase;
  title: string;
  summary: string;
  focusTopics: string[];
  totalMinutes: number;
  blocks: SubjectBlock[];
  isPaperDay: boolean;
};

export const SUBJECT_LIST: Subject[] = SUBJECTS.map((subject) => ({
  id: slugId('subject', subject.slug),
  slug: subject.slug,
  name: subject.name,
  shortName: subject.shortName,
  accent: subject.accent,
  paperDate: subject.paperDate,
  totalWeightage: subject.chapters.reduce((sum, c) => sum + c.weightage, 0),
  chapters: subject.chapters.map((chapter) => ({
    ...chapter,
    id: slugId('chapter', subject.slug, chapter.number),
    subjectSlug: subject.slug,
  })),
}));

const subjectBySlug = new Map(SUBJECT_LIST.map((s) => [s.slug, s]));

export function getSubject(slug: string): Subject | undefined {
  return subjectBySlug.get(slug);
}

export function getChapter(subjectSlug: string, number: number | null): Chapter | undefined {
  if (number == null) return undefined;
  return subjectBySlug.get(subjectSlug)?.chapters.find((c) => c.number === number);
}

const quizBySubjectChapter = new Map(QUIZZES.map((q) => [`${q.subjectSlug}:${q.chapterNumber}`, q]));

function buildQuiz(blockId: string, subjectSlug: string, chapterNumber: number | null): Quiz | null {
  if (chapterNumber == null) return null;
  const seed = quizBySubjectChapter.get(`${subjectSlug}:${chapterNumber}`);
  if (!seed) return null;
  return {
    id: slugId('quiz', blockId),
    title: seed.title,
    description: seed.description,
    questions: seed.questions.map((question, index) => ({
      ...question,
      id: slugId('q', blockId, index),
    })),
  };
}

function buildResources(blockId: string, chapter: Chapter | undefined): Resource[] {
  // Only links that actually exist are emitted. Anything unknown is returned as
  // a null url so the UI can render a calm "not added yet" state instead of a
  // link that goes nowhere.
  return [
    {
      id: slugId('res', blockId, 'ncert'),
      kind: 'ncert_pdf' as const,
      label: 'NCERT chapter',
      url: chapter?.ncertUrl ?? null,
    },
    { id: slugId('res', blockId, 'yt'), kind: 'youtube' as const, label: 'Video lecture', url: null },
    { id: slugId('res', blockId, 'notes'), kind: 'notes' as const, label: 'Notes', url: null },
    { id: slugId('res', blockId, 'extra'), kind: 'extra_questions' as const, label: 'Extra questions', url: null },
  ];
}

function buildSession(planned: PlannedSession): Session {
  const id = slugId('session', planned.sessionNumber);
  const blocks: SubjectBlock[] = planned.blocks.map((block) => {
    const subject = subjectBySlug.get(block.subjectSlug)!;
    const chapter = getChapter(block.subjectSlug, block.chapterNumber);
    const blockId = slugId(id, block.subjectSlug);
    return {
      id: blockId,
      subjectSlug: subject.slug,
      subjectName: subject.name,
      shortName: subject.shortName,
      accent: subject.accent,
      chapterNumber: block.chapterNumber,
      chapterName: block.chapterName,
      chapterId: chapter?.id ?? null,
      weightage: chapter?.weightage ?? 0,
      focusTopic: block.focusTopic,
      minutes: block.minutes,
      mode: block.mode,
      checklist: block.checklist.map((item, index) => ({
        id: slugId(blockId, 'c', index),
        label: item.label,
        detail: item.detail,
        minutes: item.minutes,
        standardOnly: Boolean(item.standardOnly),
        optional: Boolean(item.optional),
      })),
      resources: buildResources(blockId, chapter),
      quiz: buildQuiz(blockId, block.subjectSlug, block.chapterNumber),
    };
  });

  return {
    id,
    number: planned.sessionNumber,
    date: planned.date,
    phase: planned.phase,
    title: planned.title,
    summary: planned.summary,
    focusTopics: planned.focusTopics,
    totalMinutes: blocks.reduce((sum, b) => sum + b.minutes, 0),
    blocks,
    isPaperDay: blocks.length === 0,
  };
}

export const SESSIONS: Session[] = PLAN.map(buildSession);

const sessionById = new Map(SESSIONS.map((s) => [s.id, s]));
const sessionByNumber = new Map(SESSIONS.map((s) => [s.number, s]));

export function getSession(id: string): Session | undefined {
  return sessionById.get(id);
}

export function getSessionByNumber(n: number): Session | undefined {
  return sessionByNumber.get(n);
}

/** The session for a given day, or the next one still ahead. */
export function sessionForDate(iso: string): Session {
  return SESSIONS.find((s) => s.date === iso) ?? SESSIONS.find((s) => s.date > iso) ?? SESSIONS[SESSIONS.length - 1];
}

export function allChecklistItemIds(): string[] {
  return SESSIONS.flatMap((s) => s.blocks.flatMap((b) => b.checklist.map((c) => c.id)));
}

export function allQuizzes(): { quiz: Quiz; block: SubjectBlock; session: Session }[] {
  return SESSIONS.flatMap((session) =>
    session.blocks.filter((b) => b.quiz).map((block) => ({ quiz: block.quiz!, block, session })),
  );
}

export function findQuiz(quizId: string) {
  return allQuizzes().find((entry) => entry.quiz.id === quizId);
}

export { PHASES, DATESHEET };
export type { Phase };

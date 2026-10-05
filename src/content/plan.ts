/**
 * The study plan generator.
 *
 * Rather than hand-writing a hundred and thirty sessions, the plan is derived
 * from three facts: the published datesheet, how many marks each chapter is
 * worth, and how many minutes are realistically available on a given day.
 *
 * Two consequences worth knowing:
 *
 *  1. Chapters are not worked through in numerical order. Time is allocated in
 *     proportion to marks, so a ten-mark chapter gets three passes and a
 *     two-mark chapter gets one.
 *
 *  2. From 17 February the plan switches to gap mode. The papers are spread
 *     across three weeks — Maths first with no buffer, Social Science last with
 *     eighteen days of study leave in front of it — so every gap is assigned to
 *     the paper that is actually next.
 */

import { templateFor, type ChecklistTemplateItem, type StudyMode } from './checklists';
import { SUBJECTS, type ChapterSeed, type SubjectSeed } from './subjects';

/**
 * How many days to build into the app itself.
 *
 * Sessions are added as you go, from the admin panel, straight into the
 * database. What is bundled here is only a small starter set so the app has
 * something to show before anything has been added — and so the whole thing
 * still works if the database is ever unreachable.
 *
 * Set this to `null` to generate the full plan through to the last paper.
 */
export const BUNDLED_DAYS: number | null = 2;

export const PLAN_START = '2025-10-05';
export const EXAM_START = '2026-02-17';
export const EXAM_END = '2026-03-07';

export type Phase = 'foundation' | 'syllabus' | 'revision' | 'sprint';

export const PHASES: { id: Phase; label: string; from: string; to: string; blurb: string }[] = [
  {
    id: 'foundation',
    label: 'Foundation',
    from: '2025-10-05',
    to: '2025-10-31',
    blurb:
      'Fix the basics before building on them. Heavy Maths, start the big Science chapters, begin notes for Social Science.',
  },
  {
    id: 'syllabus',
    label: 'Syllabus completion',
    from: '2025-11-01',
    to: '2025-12-15',
    blurb:
      'Cover everything, highest-weightage chapters first. Previous year questions start the moment a chapter closes.',
  },
  {
    id: 'revision',
    label: 'First full revision',
    from: '2025-12-16',
    to: '2026-01-31',
    blurb: 'Revision round one, then chapter-wise sample papers and full-length papers under timing.',
  },
  {
    id: 'sprint',
    label: 'Exam sprint',
    from: '2026-02-01',
    to: '2026-03-07',
    blurb: 'Mocks under exam conditions, formulas, diagrams, maps and formats. Nothing new.',
  },
];

/** Order of the papers as they actually fall in February and March. */
export const DATESHEET: { slug: string; date: string; paper: string }[] = [
  { slug: 'maths', date: '2026-02-17', paper: 'Mathematics' },
  { slug: 'english', date: '2026-02-21', paper: 'English' },
  { slug: 'science', date: '2026-02-25', paper: 'Science' },
  { slug: 'hindi', date: '2026-03-02', paper: 'Hindi A' },
  { slug: 'social-science', date: '2026-03-07', paper: 'Social Science' },
];

export type PlannedBlock = {
  subjectSlug: string;
  chapterNumber: number | null;
  chapterName: string;
  focusTopic: string;
  minutes: number;
  mode: StudyMode;
  checklist: ChecklistTemplateItem[];
};

export type PlannedSession = {
  sessionNumber: number;
  date: string;
  phase: Phase;
  title: string;
  summary: string;
  focusTopics: string[];
  requiresSession: number | null;
  blocks: PlannedBlock[];
};

// ---------------------------------------------------------------- date utils

const DAY = 86_400_000;

function toDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  return toIso(new Date(toDate(iso).getTime() + days * DAY));
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toDate(to).getTime() - toDate(from).getTime()) / DAY);
}

function isWeekend(iso: string): boolean {
  const day = toDate(iso).getUTCDay();
  return day === 0 || day === 6;
}

export function phaseFor(iso: string): Phase {
  for (const phase of PHASES) {
    if (iso >= phase.from && iso <= phase.to) return phase.id;
  }
  return iso < PLAN_START ? 'foundation' : 'sprint';
}

// ------------------------------------------------------------- time budgets

/**
 * Around two and a half hours on a school day, around five at the weekend.
 * Maths leads in October to kill the fear of it, then gives time back to
 * Science and Social Science once the fundamentals hold — those two are the
 * real battleground for the overall percentage on the Basic Maths route.
 */
function budget(iso: string, phase: Phase) {
  const weekend = isWeekend(iso);
  if (phase === 'foundation') {
    return weekend
      ? { maths: 120, major: 60, second: 60, language: 30 }
      : { maths: 75, major: 50, second: 0, language: 25 };
  }
  if (phase === 'syllabus') {
    return weekend
      ? { maths: 90, major: 75, second: 60, language: 35 }
      : { maths: 60, major: 60, second: 0, language: 30 };
  }
  return weekend
    ? { maths: 90, major: 70, second: 60, language: 40 }
    : { maths: 60, major: 55, second: 0, language: 30 };
}

// ------------------------------------------------------------ chapter queues

/** Higher-weightage chapters get more passes. Two marks gets one, ten marks gets three. */
function passesFor(chapter: ChapterSeed): number {
  if (chapter.weightage >= 9) return 3;
  if (chapter.weightage >= 5) return 2;
  return 1;
}

/**
 * Coverage order. Teaching order matters for Maths and Science — you cannot do
 * Quadratic Equations before Polynomials — so those two are sequenced
 * pedagogically and weightage decides how long is spent on each. The other
 * three have independent chapters, so they are sorted by marks, heaviest first.
 */
function coverageOrder(subject: SubjectSeed): ChapterSeed[] {
  const sequential = subject.slug === 'maths' || subject.slug === 'science';
  const chapters = [...subject.chapters];
  if (!sequential) {
    chapters.sort((a, b) => b.weightage - a.weightage || a.number - b.number);
  }
  return chapters;
}

function buildQueue(subject: SubjectSeed, mode: StudyMode): PlannedBlock[] {
  const source =
    mode === 'learn'
      ? coverageOrder(subject)
      : [...subject.chapters].sort((a, b) => b.weightage - a.weightage || a.number - b.number);

  const blocks: PlannedBlock[] = [];
  for (const chapter of source) {
    const passes = mode === 'learn' ? passesFor(chapter) : 1;
    for (let pass = 0; pass < passes; pass += 1) {
      blocks.push({
        subjectSlug: subject.slug,
        chapterNumber: chapter.number,
        chapterName: chapter.name,
        focusTopic: focusText(subject, chapter, mode, pass, passes),
        minutes: 0,
        mode,
        checklist: templateFor(subject.slug, mode),
      });
    }
  }
  return blocks;
}

function focusText(subject: SubjectSeed, chapter: ChapterSeed, mode: StudyMode, pass: number, passes: number): string {
  if (mode === 'revise') {
    return `Revision pass — ${chapter.name}. Worth ${chapter.weightage} marks, so give it that much attention.`;
  }
  if (mode === 'drill') {
    return `Timed practice on ${chapter.name}. Exam conditions, then review every mistake.`;
  }
  if (passes === 1) {
    return `Learn ${chapter.name} start to finish — concept, textbook questions, and your own notes.`;
  }
  if (pass === 0) {
    return `Start ${chapter.name} — the concepts and the first half of the exercise.`;
  }
  if (pass === passes - 1) {
    return `Finish ${chapter.name} — remaining questions, then practice and summary.`;
  }
  return `Continue ${chapter.name} — work through the middle of the chapter carefully.`;
}

// ------------------------------------------------------------- the generator

class Cursor {
  private index = 0;
  constructor(private readonly items: PlannedBlock[]) {}

  next(): PlannedBlock | null {
    if (this.index >= this.items.length) return null;
    const item = this.items[this.index];
    this.index += 1;
    return { ...item };
  }

  get exhausted(): boolean {
    return this.index >= this.items.length;
  }
}

export function buildPlan(): PlannedSession[] {
  const bySlug = Object.fromEntries(SUBJECTS.map((s) => [s.slug, s])) as Record<string, SubjectSeed>;

  const learn: Record<string, Cursor> = {};
  const revise: Record<string, Cursor> = {};
  for (const subject of SUBJECTS) {
    learn[subject.slug] = new Cursor(buildQueue(subject, 'learn'));
    revise[subject.slug] = new Cursor(buildQueue(subject, 'revise'));
  }

  const drillIndex: Record<string, number> = {};

  const take = (slug: string, phase: Phase, minutes: number): PlannedBlock | null => {
    const wantsLearning = phase === 'foundation' || phase === 'syllabus';
    const order = wantsLearning ? [learn[slug], revise[slug]] : [revise[slug], learn[slug]];
    for (const cursor of order) {
      const block = cursor.next();
      if (block) return { ...block, minutes };
    }
    // Everything has been through at least once. Keep drilling, cycling through
    // the chapters heaviest first so the same one never comes up twice running.
    const subject = bySlug[slug];
    const ranked = [...subject.chapters].sort((a, b) => b.weightage - a.weightage || a.number - b.number);
    const chapter = ranked[(drillIndex[slug] ?? 0) % ranked.length];
    drillIndex[slug] = (drillIndex[slug] ?? 0) + 1;
    return {
      subjectSlug: slug,
      chapterNumber: chapter.number,
      chapterName: chapter.name,
      focusTopic: focusText(subject, chapter, 'drill', 0, 1),
      minutes,
      mode: 'drill',
      checklist: templateFor(slug, 'drill'),
    };
  };

  const sessions: PlannedSession[] = [];
  let sessionNumber = 0;
  const lastPlannedDay = addDays(EXAM_START, -1);

  for (let date = PLAN_START; date <= lastPlannedDay; date = addDays(date, 1)) {
    sessionNumber += 1;
    const phase = phaseFor(date);
    const minutes = budget(date, phase);
    const weekend = isWeekend(date);
    const blocks: PlannedBlock[] = [];

    const maths = take('maths', phase, minutes.maths);
    if (maths) blocks.push(maths);

    // Science and Social Science alternate on school days and both appear at
    // the weekend. Science leads because its chapters are heavier and slower.
    const major = sessionNumber % 2 === 1 ? 'science' : 'social-science';
    const second = major === 'science' ? 'social-science' : 'science';
    const majorBlock = take(major, phase, minutes.major);
    if (majorBlock) blocks.push(majorBlock);
    if (weekend && minutes.second > 0) {
      const secondBlock = take(second, phase, minutes.second);
      if (secondBlock) blocks.push(secondBlock);
    }

    const language = sessionNumber % 2 === 1 ? 'english' : 'hindi';
    const languageBlock = take(language, phase, minutes.language);
    if (languageBlock) blocks.push(languageBlock);

    const headline = blocks
      .slice(0, 2)
      .map((b) => b.chapterName)
      .join(' + ');

    sessions.push({
      sessionNumber,
      date,
      phase,
      title: `Day ${sessionNumber} — ${headline}`,
      summary: summaryFor(phase, weekend, blocks),
      focusTopics: blocks.map((b) => `${bySlug[b.subjectSlug].shortName}: ${b.chapterName}`),
      requiresSession: null,
      blocks,
    });
  }

  // From the first paper onwards, every gap belongs to the next paper.
  for (const exam of DATESHEET) {
    const examIndex = DATESHEET.indexOf(exam);
    const previousDate = examIndex === 0 ? EXAM_START : DATESHEET[examIndex - 1].date;
    const from = examIndex === 0 ? EXAM_START : addDays(previousDate, 1);
    for (let date = from; date <= exam.date; date = addDays(date, 1)) {
      const subject = bySlug[exam.slug];
      const isPaperDay = date === exam.date;
      sessionNumber += 1;
      const heaviest = [...subject.chapters].sort((a, b) => b.weightage - a.weightage).slice(0, 3);

      sessions.push({
        sessionNumber,
        date,
        phase: 'sprint',
        title: isPaperDay
          ? `${subject.name} paper`
          : `${subject.shortName} gap day — ${daysBetween(date, exam.date)} left`,
        summary: isPaperDay
          ? `${subject.name} paper today. Read the question paper properly in the first fifteen minutes and attempt what you know first.`
          : `Everything today goes to ${subject.name}. Highest-weightage chapters first, then the mistake notebook.`,
        focusTopics: heaviest.map((c) => `${subject.shortName}: ${c.name}`),
        requiresSession: null,
        blocks: isPaperDay
          ? []
          : heaviest.map((chapter) => ({
              subjectSlug: subject.slug,
              chapterNumber: chapter.number,
              chapterName: chapter.name,
              focusTopic: `Final revision — ${chapter.name} (${chapter.weightage} marks).`,
              minutes: 60,
              mode: 'revise' as StudyMode,
              checklist: templateFor(subject.slug, 'revise'),
            })),
      });
    }
  }

  return sessions;
}

function summaryFor(phase: Phase, weekend: boolean, blocks: PlannedBlock[]): string {
  const total = blocks.reduce((sum, b) => sum + b.minutes, 0);
  const hours = Math.round((total / 60) * 10) / 10;
  if (phase === 'foundation') {
    return weekend
      ? `About ${hours} hours today. Weekends are where the Maths backlog actually gets cleared.`
      : `About ${hours} hours today. Maths first while your head is fresh.`;
  }
  if (phase === 'syllabus') {
    return `About ${hours} hours. Finish the chapter properly rather than touching three things halfway.`;
  }
  if (phase === 'revision') {
    return `About ${hours} hours of revision. Your own notes first, textbook only when something does not come back.`;
  }
  return `About ${hours} hours. Consolidate — no new material this close in.`;
}

function limit(sessions: PlannedSession[]): PlannedSession[] {
  return BUNDLED_DAYS == null ? sessions : sessions.slice(0, BUNDLED_DAYS);
}

export const PLAN = limit(buildPlan());

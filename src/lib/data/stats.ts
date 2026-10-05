/**
 * Everything the dashboard and the progress page show is derived here, so the
 * numbers can never disagree between two pages.
 */

import { SESSIONS, SUBJECT_LIST, type Session, type SubjectBlock } from './content';
import type { ProgressState } from './progress-store';
import { daysUntil, pct, todayIso } from '@/lib/utils';

export type Visibility = { mathsLevel: 'basic' | 'standard' };

/** Standard-only work is hidden on the Basic paper. */
export function visibleChecklist(block: SubjectBlock, v: Visibility) {
  return block.checklist.filter((item) => !item.standardOnly || v.mathsLevel === 'standard');
}

export function blockProgress(block: SubjectBlock, state: ProgressState, v: Visibility) {
  const items = visibleChecklist(block, v);
  const required = items.filter((i) => !i.optional);
  const done = required.filter((i) => state.checklist[i.id]).length;
  const doneIncludingOptional = items.filter((i) => state.checklist[i.id]).length;
  return {
    total: required.length,
    done,
    percent: pct(done, required.length),
    complete: required.length > 0 && done === required.length,
    touched: doneIncludingOptional > 0,
  };
}

export function sessionProgress(session: Session, state: ProgressState, v: Visibility) {
  const blocks = session.blocks.map((block) => blockProgress(block, state, v));
  const total = blocks.reduce((sum, b) => sum + b.total, 0);
  const done = blocks.reduce((sum, b) => sum + b.done, 0);
  return {
    total,
    done,
    percent: pct(done, total),
    complete: total > 0 && done === total,
    touched: blocks.some((b) => b.touched),
  };
}

export function overallProgress(state: ProgressState, v: Visibility) {
  let total = 0;
  let done = 0;
  for (const session of SESSIONS) {
    const p = sessionProgress(session, state, v);
    total += p.total;
    done += p.done;
  }
  return { total, done, percent: pct(done, total) };
}

export function subjectProgress(state: ProgressState, v: Visibility) {
  return SUBJECT_LIST.map((subject) => {
    let total = 0;
    let done = 0;
    for (const session of SESSIONS) {
      for (const block of session.blocks) {
        if (block.subjectSlug !== subject.slug) continue;
        const p = blockProgress(block, state, v);
        total += p.total;
        done += p.done;
      }
    }
    const attempts = quizAttemptsForSubject(subject.slug, state);
    const average = attempts.length
      ? Math.round(attempts.reduce((sum, a) => sum + (a.score / a.total) * 100, 0) / attempts.length)
      : null;
    return {
      subject,
      total,
      done,
      percent: pct(done, total),
      quizAverage: average,
      attempts: attempts.length,
      daysToPaper: daysUntil(subject.paperDate),
    };
  });
}

function quizIndex() {
  const map = new Map<string, { subjectSlug: string; chapterName: string }>();
  for (const session of SESSIONS) {
    for (const block of session.blocks) {
      if (block.quiz) map.set(block.quiz.id, { subjectSlug: block.subjectSlug, chapterName: block.chapterName });
    }
  }
  return map;
}

export function quizAttemptsForSubject(subjectSlug: string, state: ProgressState) {
  const index = quizIndex();
  return state.attempts.filter((a) => index.get(a.quizId)?.subjectSlug === subjectSlug);
}

/** Best attempt per quiz, which is what actually reflects what she knows now. */
export function bestAttempts(state: ProgressState) {
  const best = new Map<string, { score: number; total: number }>();
  for (const attempt of state.attempts) {
    const current = best.get(attempt.quizId);
    if (!current || attempt.score / attempt.total > current.score / current.total) {
      best.set(attempt.quizId, { score: attempt.score, total: attempt.total });
    }
  }
  return best;
}

export function pendingQuizzes(state: ProgressState, v: Visibility, limit = 20) {
  const taken = new Set(state.attempts.map((a) => a.quizId));
  const out: { session: Session; block: SubjectBlock }[] = [];
  for (const session of SESSIONS) {
    for (const block of session.blocks) {
      if (!block.quiz || taken.has(block.quiz.id)) continue;
      // A quiz is "pending" once the chapter work has actually been started.
      if (!blockProgress(block, state, v).touched) continue;
      out.push({ session, block });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

export function completedSessions(state: ProgressState, v: Visibility) {
  return SESSIONS.filter((s) => s.blocks.length > 0 && sessionProgress(s, state, v).complete).map((session) => {
    const attempts = session.blocks
      .filter((b) => b.quiz)
      .map((b) => ({ block: b, attempt: state.attempts.find((a) => a.quizId === b.quiz!.id) }))
      .filter((x) => x.attempt);
    const completedAt = session.blocks
      .flatMap((b) => visibleChecklist(b, v).map((i) => state.checklist[i.id]))
      .filter(Boolean)
      .sort()
      .pop();
    return { session, attempts, completedAt };
  });
}

/** Where marks are actually leaking: low quiz scores on high-weightage chapters. */
export function weakAreas(state: ProgressState, limit = 6) {
  const best = bestAttempts(state);
  const rows: { subjectSlug: string; shortName: string; chapterName: string; percent: number; weightage: number }[] =
    [];
  for (const session of SESSIONS) {
    for (const block of session.blocks) {
      if (!block.quiz) continue;
      const attempt = best.get(block.quiz.id);
      if (!attempt) continue;
      const percent = Math.round((attempt.score / attempt.total) * 100);
      if (percent >= 75) continue;
      if (rows.some((r) => r.chapterName === block.chapterName && r.subjectSlug === block.subjectSlug)) continue;
      rows.push({
        subjectSlug: block.subjectSlug,
        shortName: block.shortName,
        chapterName: block.chapterName,
        percent,
        weightage: block.weightage,
      });
    }
  }
  // Worst scores on the heaviest chapters come first.
  return rows.sort((a, b) => b.weightage * (100 - b.percent) - a.weightage * (100 - a.percent)).slice(0, limit);
}

export function streak(state: ProgressState): { current: number; best: number; todayMinutes: number } {
  const days = Object.keys(state.minutes)
    .filter((d) => (state.minutes[d] ?? 0) > 0)
    .sort();
  const set = new Set(days);
  const today = todayIso();

  let current = 0;
  const cursor = new Date(`${today}T00:00:00Z`);
  // Yesterday still counts while today is not finished yet.
  if (!set.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  for (;;) {
    const iso = cursor.toISOString().slice(0, 10);
    if (!set.has(iso)) break;
    current += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of days) {
    if (previous) {
      const gap = (new Date(`${day}T00:00:00Z`).getTime() - new Date(`${previous}T00:00:00Z`).getTime()) / 86_400_000;
      run = gap === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    previous = day;
  }

  return { current, best, todayMinutes: state.minutes[today] ?? 0 };
}

/**
 * Honest pacing. Compares how much of the plan should be done by today against
 * how much actually is, and says so plainly either way.
 */
export function pacing(state: ProgressState, v: Visibility) {
  const today = todayIso();
  const elapsed = SESSIONS.filter((s) => s.date <= today && s.blocks.length > 0);
  let expected = 0;
  for (const session of elapsed) expected += sessionProgress(session, state, v).total;
  const overall = overallProgress(state, v);
  const onTrack = overall.done >= expected;
  return {
    expected,
    done: overall.done,
    behindBy: Math.max(0, expected - overall.done),
    onTrack,
    percentOfPlan: overall.percent,
  };
}

/** The smallest useful thing she could do right now. */
export function smallestNextStep(state: ProgressState, v: Visibility) {
  const today = todayIso();
  const candidates = SESSIONS.filter((s) => s.date <= today && s.blocks.length > 0)
    .slice(-14)
    .reverse();
  for (const session of candidates) {
    for (const block of session.blocks) {
      const items = visibleChecklist(block, v).filter((i) => !state.checklist[i.id] && !i.optional);
      if (!items.length) continue;
      const easiest = [...items].sort((a, b) => (a.minutes ?? 99) - (b.minutes ?? 99))[0];
      return { session, block, item: easiest };
    }
  }
  return null;
}

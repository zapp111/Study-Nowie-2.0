/**
 * Turns the plan in `src/content` into SQL.
 *
 * The app and the database stay in step because both get their ids from the
 * same deterministic function, so re-running this is safe and seeding a second
 * project for staging produces identical keys.
 *
 *   npm run seed:sql
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SESSIONS, SUBJECT_LIST } from '../src/lib/data/content';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'supabase', 'seed');

const q = (value: string | null | undefined): string => (value == null ? 'null' : `'${value.replace(/'/g, "''")}'`);

const arr = (values: string[]): string =>
  values.length ? `array[${values.map((v) => q(v)).join(', ')}]` : `'{}'::text[]`;

const json = (value: unknown): string => `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;

const lines: string[] = [
  '-- Study Nowie 2.0 — seed content',
  '-- Generated from src/content by `npm run seed:sql`. Safe to run more than once.',
  '',
  'begin;',
  '',
];

// ------------------------------------------------------------------ subjects
lines.push('-- Subjects and the chapter master, with board weightage.');
for (const subject of SUBJECT_LIST) {
  lines.push(
    `insert into public.subjects (id, slug, name, short_name, accent, paper_date, sort_order) values ` +
      `(${q(subject.id)}, ${q(subject.slug)}, ${q(subject.name)}, ${q(subject.shortName)}, ${q(subject.accent)}, ${q(subject.paperDate)}, ${SUBJECT_LIST.indexOf(subject) + 1}) ` +
      `on conflict (id) do update set name = excluded.name, paper_date = excluded.paper_date;`,
  );
}
lines.push('');

for (const subject of SUBJECT_LIST) {
  for (const chapter of subject.chapters) {
    lines.push(
      `insert into public.chapters (id, subject_id, number, name, unit, board_weightage, cbq_frequency, standard_only) values ` +
        `(${q(chapter.id)}, ${q(subject.id)}, ${chapter.number}, ${q(chapter.name)}, ${q(chapter.unit ?? null)}, ${chapter.weightage}, ${q(chapter.cbq)}, ${chapter.standardOnly ? 'true' : 'false'}) ` +
        `on conflict (id) do update set name = excluded.name, board_weightage = excluded.board_weightage;`,
    );
  }
}
lines.push('');

// ------------------------------------------------------------------ sessions
lines.push('-- The day-by-day plan.');
for (const session of SESSIONS) {
  lines.push(
    `insert into public.sessions (id, session_number, scheduled_date, phase, title, summary, focus_topics) values ` +
      `(${q(session.id)}, ${session.number}, ${q(session.date)}, ${q(session.phase)}, ${q(session.title)}, ${q(session.summary)}, ${arr(session.focusTopics)}) ` +
      `on conflict (id) do update set title = excluded.title, summary = excluded.summary, focus_topics = excluded.focus_topics;`,
  );

  session.blocks.forEach((block, index) => {
    lines.push(
      `insert into public.session_subjects (id, session_id, subject_id, chapter_id, chapter_name, focus_topic, estimated_minutes, sort_order) values ` +
        `(${q(block.id)}, ${q(session.id)}, ${q(SUBJECT_LIST.find((s) => s.slug === block.subjectSlug)!.id)}, ${q(block.chapterId)}, ${q(block.chapterName)}, ${q(block.focusTopic)}, ${block.minutes}, ${index}) ` +
        `on conflict (id) do update set focus_topic = excluded.focus_topic, estimated_minutes = excluded.estimated_minutes;`,
    );

    block.checklist.forEach((item, itemIndex) => {
      lines.push(
        `insert into public.checklist_items (id, session_subject_id, label, detail, estimated_minutes, standard_only, is_optional, sort_order) values ` +
          `(${q(item.id)}, ${q(block.id)}, ${q(item.label)}, ${q(item.detail ?? null)}, ${item.minutes ?? 'null'}, ${item.standardOnly}, ${item.optional}, ${itemIndex}) ` +
          `on conflict (id) do update set label = excluded.label, detail = excluded.detail;`,
      );
    });

    for (const [resourceIndex, resource] of block.resources.entries()) {
      // Blank links are never written. A missing resource stays missing, and
      // the app shows a clean unavailable state for it.
      if (!resource.url) continue;
      lines.push(
        `insert into public.resources (id, session_subject_id, kind, label, url, sort_order) values ` +
          `(${q(resource.id)}, ${q(block.id)}, ${q(resource.kind)}, ${q(resource.label)}, ${q(resource.url)}, ${resourceIndex}) ` +
          `on conflict (id) do update set url = excluded.url;`,
      );
    }

    if (block.quiz) {
      lines.push(
        `insert into public.quizzes (id, session_subject_id, subject_id, chapter_id, title, description) values ` +
          `(${q(block.quiz.id)}, ${q(block.id)}, ${q(SUBJECT_LIST.find((s) => s.slug === block.subjectSlug)!.id)}, ${q(block.chapterId)}, ${q(block.quiz.title)}, ${q(block.quiz.description ?? null)}) ` +
          `on conflict (id) do update set title = excluded.title;`,
      );
      block.quiz.questions.forEach((question, questionIndex) => {
        lines.push(
          `insert into public.quiz_questions (id, quiz_id, prompt, stimulus, options, correct_index, explanation, marks, difficulty, question_type, sort_order) values ` +
            `(${q(question.id)}, ${q(block.quiz!.id)}, ${q(question.prompt)}, ${q(question.stimulus ?? null)}, ${json(question.options)}, ${question.correctIndex}, ${q(question.explanation)}, ${question.marks ?? 1}, ${q(question.difficulty ?? 'medium')}, ${q(question.type ?? 'mcq')}, ${questionIndex}) ` +
            `on conflict (id) do update set prompt = excluded.prompt, options = excluded.options, correct_index = excluded.correct_index, explanation = excluded.explanation;`,
        );
      });
    }
  });
}

lines.push('', 'commit;', '');

mkdirSync(outDir, { recursive: true });
const file = join(outDir, '0001_content.sql');
writeFileSync(file, lines.join('\n'), 'utf8');

const counts = {
  subjects: SUBJECT_LIST.length,
  chapters: SUBJECT_LIST.reduce((sum, s) => sum + s.chapters.length, 0),
  sessions: SESSIONS.length,
  blocks: SESSIONS.reduce((sum, s) => sum + s.blocks.length, 0),
  quizzes: SESSIONS.reduce((sum, s) => sum + s.blocks.filter((b) => b.quiz).length, 0),
};

console.log(`Wrote ${file}`);
console.table(counts);

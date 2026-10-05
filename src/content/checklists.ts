/**
 * Checklist templates.
 *
 * These are deliberately not generic. Each subject is scored differently, so
 * each subject gets the sequence of actions that actually earns marks in that
 * paper — step marks in Maths, value points and diagrams in Science, structure
 * and map work in Social Science, formats in the languages.
 */

export type ChecklistTemplateItem = {
  label: string;
  detail?: string;
  minutes?: number;
  standardOnly?: boolean;
  optional?: boolean;
};

export type StudyMode = 'learn' | 'revise' | 'drill';

type TemplateMap = Record<string, Record<StudyMode, ChecklistTemplateItem[]>>;

export const CHECKLIST_TEMPLATES: TemplateMap = {
  maths: {
    // The recovery loop. NCERT is the ceiling for the Basic paper, so it is
    // finished properly before anything else is touched.
    learn: [
      {
        label: 'Read the concept from NCERT',
        detail: 'Theory first, slowly. Do not skip the worked derivations.',
        minutes: 15,
      },
      {
        label: 'Solve the solved examples yourself',
        detail: 'Cover the solution, try it, then compare line by line.',
        minutes: 20,
      },
      {
        label: 'Complete the NCERT exercise',
        detail: 'Every question. This is the actual paper standard for Basic.',
        minutes: 30,
      },
      {
        label: 'Mark the questions you could not solve',
        detail: 'Put them in the mistake notebook rather than leaving them blank.',
        minutes: 5,
      },
      { label: 'Write the formulas into your formula sheet', minutes: 5 },
      { label: 'Extra questions', detail: 'Only once NCERT feels comfortable.', minutes: 20, optional: true },
      { label: 'Higher-order application set', detail: 'Standard paper practice.', minutes: 25, standardOnly: true },
    ],
    revise: [
      { label: 'Read your formula sheet for this chapter', minutes: 5 },
      { label: 'Redo the questions you had marked unsolved', detail: 'The whole point of marking them.', minutes: 25 },
      { label: 'Solve a mixed set from the chapter', minutes: 25 },
      {
        label: 'Check your working for step marks',
        detail: 'Steps earn marks even when the final answer slips.',
        minutes: 10,
      },
    ],
    drill: [
      { label: 'Timed question set', minutes: 30 },
      { label: 'Log every wrong answer in the mistake notebook', minutes: 10 },
    ],
  },
  science: {
    learn: [
      { label: 'Watch or read the chapter explanation', minutes: 15 },
      { label: 'Read NCERT line by line', detail: 'Board questions come straight out of NCERT lines.', minutes: 20 },
      { label: 'Write definitions, laws and formulas', minutes: 10 },
      {
        label: 'Practise the labelled diagrams',
        detail: 'Diagram marks are the easiest marks in the paper.',
        minutes: 10,
      },
      { label: 'Balance the chemical equations / solve the numericals', minutes: 15 },
      { label: 'Solve NCERT intext and exercise questions', minutes: 20 },
      { label: 'Make a one-page chapter summary', minutes: 10 },
    ],
    revise: [
      { label: 'Read your one-page summary', minutes: 5 },
      { label: 'Redraw the key diagrams from memory', minutes: 10 },
      { label: 'Rewrite the equations and formulas from memory', minutes: 10 },
      {
        label: 'Solve a case-study question',
        detail: 'Half the paper is competency-based. Practise the format, not just the content.',
        minutes: 15,
      },
      { label: 'Solve previous year questions from this chapter', minutes: 20 },
    ],
    drill: [
      { label: 'Timed mixed set', minutes: 30 },
      { label: 'Log every wrong answer in the mistake notebook', minutes: 10 },
    ],
  },
  'social-science': {
    learn: [
      { label: 'Read the chapter once without writing anything', minutes: 15 },
      { label: 'Build the timeline or the flow of events', minutes: 10 },
      { label: 'List the key terms and their meanings', minutes: 10 },
      {
        label: 'Write the likely 3-mark and 5-mark answers in points',
        detail: 'Headings plus bullets. That is how the marking scheme awards marks.',
        minutes: 20,
      },
      { label: 'Note two real examples you can quote', minutes: 5 },
      { label: 'Map work for this chapter', minutes: 10, optional: true },
    ],
    revise: [
      { label: 'Read your own notes, not the textbook', minutes: 10 },
      { label: 'Recall the timeline and key terms out loud', minutes: 10 },
      { label: 'Write one full 5-mark answer against the clock', minutes: 15 },
      { label: 'Practise the map items again', minutes: 10 },
    ],
    drill: [
      { label: 'Source-based question set', minutes: 25 },
      { label: 'Log every wrong answer in the mistake notebook', minutes: 10 },
    ],
  },
  english: {
    learn: [
      { label: 'Read the chapter or passage properly', minutes: 15 },
      { label: 'Note new words and their meanings', minutes: 5 },
      { label: 'Answer the textbook questions in full sentences', minutes: 15 },
      {
        label: 'Practise the writing format for today',
        detail: 'Format marks are awarded separately from content.',
        minutes: 10,
      },
    ],
    revise: [
      { label: 'Skim the chapter and your notes', minutes: 8 },
      { label: 'Write one long-answer response', minutes: 12 },
      { label: 'Do a grammar set', minutes: 10 },
    ],
    drill: [
      { label: 'Unseen passage against the clock', minutes: 20 },
      { label: 'One writing task in exam format', minutes: 15 },
    ],
  },
  hindi: {
    learn: [
      { label: 'पाठ को ध्यान से पढ़ें', minutes: 15 },
      { label: 'कठिन शब्दों के अर्थ लिखें', minutes: 5 },
      { label: 'भावार्थ या सारांश अपने शब्दों में लिखें', minutes: 10 },
      { label: 'पाठ्यपुस्तक के प्रश्न हल करें', minutes: 15 },
      { label: 'व्याकरण अभ्यास', minutes: 10, optional: true },
    ],
    revise: [
      { label: 'अपने नोट्स दोहराएँ', minutes: 8 },
      { label: 'एक दीर्घ उत्तरीय प्रश्न लिखें', minutes: 12 },
      { label: 'व्याकरण के प्रश्न हल करें', minutes: 10 },
    ],
    drill: [
      { label: 'अपठित गद्यांश समयबद्ध हल करें', minutes: 20 },
      { label: 'लेखन अभ्यास', minutes: 15 },
    ],
  },
};

export function templateFor(subjectSlug: string, mode: StudyMode): ChecklistTemplateItem[] {
  return CHECKLIST_TEMPLATES[subjectSlug]?.[mode] ?? CHECKLIST_TEMPLATES.science[mode];
}

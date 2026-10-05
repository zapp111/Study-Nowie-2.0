/**
 * Chapter quizzes are intentionally empty until the study plan is rebuilt.
 * Keep the seed type so the content model and future quiz imports remain typed.
 */

export type QuestionType = 'mcq' | 'assertion_reason' | 'case_study';
export type Difficulty = 'easy' | 'medium' | 'hard';

export type QuestionSeed = {
  prompt: string;
  stimulus?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  marks?: number;
  difficulty?: Difficulty;
  type?: QuestionType;
  standardOnly?: boolean;
};

export type QuizSeed = {
  subjectSlug: string;
  chapterNumber: number;
  title: string;
  description?: string;
  questions: QuestionSeed[];
};

export const QUIZZES: QuizSeed[] = [];

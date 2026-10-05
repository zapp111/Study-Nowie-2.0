import { notFound } from 'next/navigation';
import { QuizRunner } from '@/components/quiz/quiz-runner';
import { findQuiz } from '@/lib/data/content';

export default async function QuizPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;
  if (!findQuiz(quizId)) notFound();
  return <QuizRunner quizId={quizId} />;
}

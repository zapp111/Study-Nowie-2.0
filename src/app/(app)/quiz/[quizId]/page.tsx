import { QuizRunner } from '@/components/quiz/quiz-runner';

export default async function QuizPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;
  return <QuizRunner quizId={quizId} />;
}

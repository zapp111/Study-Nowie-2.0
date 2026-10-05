import { notFound } from 'next/navigation';
import { SessionDetail } from '@/components/sessions/session-detail';
import { getSessionByNumber } from '@/lib/data/content';

export default async function SessionPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const session = getSessionByNumber(Number(number));
  if (!session) notFound();
  return <SessionDetail sessionId={session.id} />;
}

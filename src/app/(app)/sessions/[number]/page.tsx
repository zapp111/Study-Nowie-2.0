import { SessionDetail } from '@/components/sessions/session-detail';

export default async function SessionPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  return <SessionDetail sessionNumber={Number(number)} />;
}

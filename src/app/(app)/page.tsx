import { DashboardView } from '@/components/dashboard/dashboard-view';
import { getCurrentProfile } from '@/lib/data/session';

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  return <DashboardView fallbackName={profile.displayName} />;
}

import { AppShell } from '@/components/layout/app-shell';
import { getCurrentProfile } from '@/lib/data/session';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  return <AppShell isAdmin={profile.isAdmin}>{children}</AppShell>;
}

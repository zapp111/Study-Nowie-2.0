import { AppShell } from '@/components/layout/app-shell';
import { getCurrentProfile } from '@/lib/data/session';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  const account = profile.signedIn ? { name: profile.displayName, email: profile.email } : null;
  return (
    <AppShell isAdmin={profile.isAdmin} account={account}>
      {children}
    </AppShell>
  );
}

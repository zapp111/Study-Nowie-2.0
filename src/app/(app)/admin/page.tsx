import { redirect } from 'next/navigation';
import { AdminView } from '@/components/admin/admin-view';
import { getCurrentProfile } from '@/lib/data/session';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const metadata = { title: 'Admin · Study Nowie' };

export default async function AdminPage() {
  const profile = await getCurrentProfile();
  // Role is checked on the server, and the database enforces it again through
  // row level security. The client is never trusted for this.
  if (isSupabaseConfigured && !profile.isAdmin) redirect('/');
  return <AdminView connected={isSupabaseConfigured} />;
}

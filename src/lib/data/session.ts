import { createClient } from '@/lib/supabase/server';

export type CurrentProfile = {
  userId: string | null;
  displayName: string;
  email: string | null;
  isAdmin: boolean;
  signedIn: boolean;
};

/**
 * Who is using the app. Without a database there is a single local user, which
 * is the private, on-device mode. With Supabase connected the role comes from
 * the profiles table and nothing about it is trusted from the client.
 */
export async function getCurrentProfile(): Promise<CurrentProfile> {
  const supabase = await createClient();
  if (!supabase) {
    return { userId: null, displayName: 'Joyuu', email: null, isAdmin: true, signedIn: false };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { userId: null, displayName: 'Joyuu', email: null, isAdmin: false, signedIn: false };

  const { data } = await supabase.from('profiles').select('display_name, role').eq('id', user.id).maybeSingle();

  return {
    userId: user.id,
    displayName: data?.display_name ?? 'Joyuu',
    email: user.email ?? null,
    isAdmin: data?.role === 'admin',
    signedIn: true,
  };
}

import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import { CardSkeleton } from '@/components/ui/skeleton';

export const metadata = { title: 'Create account · Study Nowie' };

export default function Page() {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}

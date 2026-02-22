'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const expiresIn = searchParams.get('expiresIn');

    if (accessToken && refreshToken) {
      // Sign in with next-auth using our custom credentials provider
      signIn('credentials', {
        accessToken,
        refreshToken,
        expiresIn,
        redirect: false,
      }).then((result) => {
        if (result?.ok) {
          router.push('/dashboard'); // or home
        } else {
          router.push('/login?error=AuthFailed');
        }
      });
    } else {
      router.push('/login?error=MissingTokens');
    }
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Authenticating...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CallbackContent />
    </Suspense>
  );
}

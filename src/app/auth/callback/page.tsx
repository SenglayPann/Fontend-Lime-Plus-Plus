'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const exchangeStarted = useRef(false);

  useEffect(() => {
    if (exchangeStarted.current) {
      return;
    }

    exchangeStarted.current = true;
    const code = searchParams.get('code');

    if (!code) {
      router.push('/login?error=MissingCode');
      return;
    }

    window.history.replaceState(null, '', '/auth/callback');

    const exchangeCode = async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/exchange`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        },
      );
      const json = await response.json();
      const tokens = json.success ? json.data : null;

      if (!response.ok || !tokens?.accessToken || !tokens?.refreshToken) {
        throw new Error(
          json.error?.message || json.message || 'Auth code exchange failed',
        );
      }

      const result = await signIn('credentials', {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: String(tokens.expiresIn),
        redirect: false,
      });

      if (result?.ok) {
        router.push('/dashboard');
      } else {
        const error = result?.error || 'CredentialsSignInFailed';
        router.push(`/login?error=${encodeURIComponent(error)}`);
      }
    };

    exchangeCode().catch((error) => {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'AuthFailed';
      router.push(`/login?error=${encodeURIComponent(message)}`);
    });
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

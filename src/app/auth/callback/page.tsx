'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  AUTH_POPUP_CHANNEL,
  AUTH_POPUP_EVENT_KEY,
  type AuthPopupEvent,
} from '@/lib/auth-popup';
import { getBrowserId, getBrowserIdHeader } from '@/lib/browser-id';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const exchangeStarted = useRef(false);
  const [statusMessage, setStatusMessage] = useState('Authenticating...');
  const [isWorking, setIsWorking] = useState(true);

  useEffect(() => {
    if (exchangeStarted.current) {
      return;
    }

    exchangeStarted.current = true;
    const code = searchParams.get('code');
    const isPopupCallback = searchParams.get('mode') === 'popup';

    if (!code) {
      if (isPopupCallback) {
        setStatusMessage('Authentication failed. You can close this window.');
        setIsWorking(false);
        notifyPopup({ type: 'AUTH_ERROR', error: 'MissingCode', at: Date.now() });
        closePopupWindow();
      } else {
        router.push('/login?error=MissingCode');
      }
      return;
    }

    window.history.replaceState(null, '', '/auth/callback');

    const exchangeCode = async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/exchange`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getBrowserIdHeader()
          },
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

      // Force sign out first to clear any existing session (Account A)
      // before we sign in with the new one (Account B)
      const { signOut } = await import('next-auth/react');
      await signOut({ redirect: false });

      const result = await signIn('credentials', {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: String(tokens.expiresIn),
        browserId: getBrowserId(),
        redirect: false,
      });

      if (result?.ok) {
        const isPopup =
          isPopupCallback ||
          (typeof window !== 'undefined' && Boolean(window.opener));

        if (isPopup) {
          setStatusMessage('Authentication complete. You can close this window.');
          setIsWorking(false);
          notifyPopup({ type: 'AUTH_SUCCESS', at: Date.now() });
          closePopupWindow();
        } else {
          router.push('/dashboard');
        }
      } else {
        const error = result?.error || 'CredentialsSignInFailed';
        if (isPopupCallback) {
          setStatusMessage('Authentication failed. You can close this window.');
          setIsWorking(false);
          notifyPopup({ type: 'AUTH_ERROR', error, at: Date.now() });
          closePopupWindow();
        } else {
          router.push(`/login?error=${encodeURIComponent(error)}`);
        }
      }
    };

    exchangeCode().catch((error) => {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'AuthFailed';

      if (isPopupCallback) {
        setStatusMessage('Authentication failed. You can close this window.');
        setIsWorking(false);
        notifyPopup({ type: 'AUTH_ERROR', error: message, at: Date.now() });
        closePopupWindow();
      } else {
        router.push(`/login?error=${encodeURIComponent(message)}`);
      }
    });
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">{statusMessage}</h1>
        {isWorking ? (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto" />
        ) : null}
      </div>
    </div>
  );
}

function notifyPopup(event: AuthPopupEvent) {
  try {
    localStorage.setItem(AUTH_POPUP_EVENT_KEY, JSON.stringify(event));
  } catch (error) {
    console.error('Failed to persist auth popup event:', error);
  }

  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(event, window.location.origin);

      if (event.type === 'AUTH_SUCCESS') {
        window.opener.location.reload();
      }
    }
  } catch (error) {
    console.error('Failed to notify auth opener:', error);
  }

  try {
    const channel = new BroadcastChannel(AUTH_POPUP_CHANNEL);
    channel.postMessage(event);
    channel.close();
  } catch (error) {
    console.error('Failed to broadcast auth popup event:', error);
  }
}

function closePopupWindow() {
  setTimeout(() => {
    window.close();
  }, 50);
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CallbackContent />
    </Suspense>
  );
}

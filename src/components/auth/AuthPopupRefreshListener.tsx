"use client";

import { useEffect, useRef } from "react";
import {
  AUTH_POPUP_CHANNEL,
  AUTH_POPUP_EVENT_KEY,
  AUTH_POPUP_PENDING_KEY,
  isAuthPopupEvent,
  parseAuthPopupEvent,
  type AuthPopupEvent,
} from "@/lib/auth-popup";

export function AuthPopupRefreshListener() {
  const lastHandledAt = useRef<number | null>(null);

  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    let reloadTimer: number | undefined;

    const cleanupStoredState = () => {
      localStorage.removeItem(AUTH_POPUP_EVENT_KEY);
      localStorage.removeItem(AUTH_POPUP_PENDING_KEY);
    };

    const reloadMainWindow = () => {
      if (reloadTimer) return;

      cleanupStoredState();
      reloadTimer = window.setTimeout(() => {
        window.location.reload();
      }, 100);
    };

    const handlePopupEvent = (event: AuthPopupEvent) => {
      if (lastHandledAt.current === event.at) return;

      lastHandledAt.current = event.at;

      if (event.type === "AUTH_SUCCESS") {
        reloadMainWindow();
        return;
      }

      cleanupStoredState();
      console.error("Popup auth failed:", event.error);
    };

    const handleMessage = (messageEvent: MessageEvent) => {
      if (messageEvent.origin !== window.location.origin) return;
      if (!isAuthPopupEvent(messageEvent.data)) return;

      handlePopupEvent(messageEvent.data);
    };

    const handleStorage = (storageEvent: StorageEvent) => {
      if (storageEvent.key !== AUTH_POPUP_EVENT_KEY) return;

      const popupEvent = parseAuthPopupEvent(storageEvent.newValue);
      if (popupEvent) {
        handlePopupEvent(popupEvent);
      }
    };

    const checkStoredPopupEvent = () => {
      const popupEvent = parseAuthPopupEvent(
        localStorage.getItem(AUTH_POPUP_EVENT_KEY),
      );

      if (popupEvent) {
        handlePopupEvent(popupEvent);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkStoredPopupEvent();
      }
    };

    window.addEventListener("message", handleMessage);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", checkStoredPopupEvent);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    try {
      channel = new BroadcastChannel(AUTH_POPUP_CHANNEL);
      channel.onmessage = (event) => {
        if (isAuthPopupEvent(event.data)) {
          handlePopupEvent(event.data);
        }
      };
    } catch (error) {
      console.error("Failed to listen for auth popup events:", error);
    }

    checkStoredPopupEvent();

    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", checkStoredPopupEvent);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      channel?.close();
      if (reloadTimer) {
        window.clearTimeout(reloadTimer);
      }
    };
  }, []);

  return null;
}

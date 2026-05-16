export const AUTH_POPUP_CHANNEL = "lime_auth_popup";
export const AUTH_POPUP_EVENT_KEY = "lime_auth_popup_event";
export const AUTH_POPUP_PENDING_KEY = "lime_auth_popup_pending";

export type AuthPopupEvent =
  | { type: "AUTH_SUCCESS"; at: number }
  | { type: "AUTH_ERROR"; error: string; at: number };

export function isAuthPopupEvent(value: unknown): value is AuthPopupEvent {
  if (!value || typeof value !== "object") return false;

  const event = value as Partial<AuthPopupEvent>;
  return event.type === "AUTH_SUCCESS" || event.type === "AUTH_ERROR";
}

export function parseAuthPopupEvent(value: string | null): AuthPopupEvent | null {
  if (!value) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    return isAuthPopupEvent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

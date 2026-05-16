const BROWSER_ID_KEY = 'lime_browser_id';

export function getBrowserId(): string {
  if (typeof window === 'undefined') return '';

  let browserId = localStorage.getItem(BROWSER_ID_KEY);

  if (!browserId) {
    browserId = crypto.randomUUID();
    localStorage.setItem(BROWSER_ID_KEY, browserId);
  }

  return browserId;
}

export function getBrowserIdHeader() {
  return { 'X-Browser-Id': getBrowserId() };
}

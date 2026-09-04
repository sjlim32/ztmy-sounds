const STORAGE_KEY = "ztmy_quiz_device_id";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 2;

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}

export function getDeviceId(): string {
  const fromStorage = window.localStorage.getItem(STORAGE_KEY);
  const fromCookie = readCookie(STORAGE_KEY);
  const deviceId = fromStorage ?? fromCookie ?? crypto.randomUUID();

  if (fromStorage !== deviceId) {
    window.localStorage.setItem(STORAGE_KEY, deviceId);
  }
  if (fromCookie !== deviceId) {
    writeCookie(STORAGE_KEY, deviceId);
  }

  return deviceId;
}

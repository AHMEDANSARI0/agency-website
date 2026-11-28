export const ADMIN_LOGIN_FAILURE_WINDOW_MS = 15 * 60 * 1000;
export const ADMIN_LOGIN_MAX_FAILURES = 5;
export const ADMIN_LOGIN_FIRST_LOCKOUT_MS = 15 * 60 * 1000;
const MAX_ADMIN_LOGIN_LOCKOUT_MS = 250_000 * 365 * 24 * 60 * 60 * 1000;

export function getAdminLoginLockoutDurationMs(lockoutCount: number): number {
  const completedLockouts = Math.max(0, Math.floor(lockoutCount));
  return Math.min(
    ADMIN_LOGIN_FIRST_LOCKOUT_MS * 2 ** completedLockouts,
    MAX_ADMIN_LOGIN_LOCKOUT_MS
  );
}

export function formatAdminLoginRetryTime(retryAfterSeconds: number): string {
  const seconds = Math.max(1, retryAfterSeconds);
  const minute = 60;
  const hour = 60 * minute;
  const totalHours = Math.ceil(seconds / hour);
  const day = 24;

  if (totalHours >= day) {
    const days = Math.floor(totalHours / day);
    const hours = totalHours % day;
    const dayLabel = `${days} ${days === 1 ? "day" : "days"}`;
    return hours > 0
      ? `${dayLabel} ${hours} ${hours === 1 ? "hour" : "hours"}`
      : dayLabel;
  }
  if (totalHours > 0) {
    return `${totalHours} ${totalHours === 1 ? "hour" : "hours"}`;
  }
  const minutes = Math.max(1, Math.ceil(seconds / minute));
  return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
}

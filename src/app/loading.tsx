/**
 * Neutral, minimal loading indicator (Section 6):
 * Uses a restrained horizontal progress pulse completely independent of any brand logo or symbol.
 */
export default function GlobalLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page content"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4"
    >
      <div className="h-1 w-32 overflow-hidden rounded-full bg-surface-muted">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
      </div>
      <span className="text-xs font-medium text-ink-muted">Loading…</span>
    </div>
  );
}

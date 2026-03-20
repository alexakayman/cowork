import type { UserState } from "@cowork/shared";

const TOP_APPS = 5;

interface AppTimeSegment {
  appName: string;
  seconds: number;
  label: string; // e.g. "10m" or "1h 5m"
}

/**
 * Format seconds as "Xm" or "Xh Ym". Rounds to nearest minute.
 */
function formatDuration(seconds: number): string {
  const totalMin = Math.round(seconds / 60);
  if (totalMin < 1) return "0m";
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * Session time by app for one user: accumulated seconds per app + current segment.
 * Returns top 5 apps by total time, longest first.
 */
export function getSessionAppBreakdown(
  user: UserState,
  appSeconds: Record<string, number> | undefined,
  nowMs: number
): AppTimeSegment[] {
  const buckets: Record<string, number> = { ...(appSeconds ?? {}) };
  const currentApp = user.appName?.trim() || "Idle";
  const currentSegmentSec = (nowMs - user.activityStartedAt) / 1000;
  if (currentSegmentSec > 0) {
    buckets[currentApp] = (buckets[currentApp] ?? 0) + currentSegmentSec;
  }

  const segments: AppTimeSegment[] = Object.entries(buckets)
    .filter(([, sec]) => sec > 0)
    .map(([appName, seconds]) => ({
      appName,
      seconds,
      label: formatDuration(seconds),
    }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, TOP_APPS);

  return segments;
}

import { useState, useEffect } from "react";

/**
 * Returns a human-readable elapsed-time string that updates every minute.
 * Discord-style: "1m", "15m", "1h 23m", "3h 0m"
 *
 * @param sinceMs – Unix ms timestamp when the activity started
 */
export function useElapsedTime(sinceMs: number): string {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Tick every 30s so the label stays reasonably fresh
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  return formatElapsed(now - sinceMs);
}

/**
 * Pure formatter — useful outside React too.
 * <1 min  → "just now"
 * <60 min → "12m"
 * ≥60 min → "1h 23m"
 */
function formatElapsed(ms: number): string {
  if (ms < 0) ms = 0;
  const totalMin = Math.floor(ms / 60_000);

  if (totalMin < 1) return "just now";
  if (totalMin < 60) return `${totalMin}m`;

  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}m`;
}

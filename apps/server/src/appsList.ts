/**
 * Fetches the crowdsourced app list from the landing API (APPS_LIST_URL) and
 * feeds it to the classifier so submitted apps are recognized without a deploy.
 */
import { setDynamicAppList, type AppEntry } from "./classifier.js";

const REFRESH_MS = 5 * 60 * 1000; // 5 min

export async function loadAppsList(url: string): Promise<void> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[apps-list] fetch failed: ${res.status} ${url}`);
      return;
    }
    const data = await res.json();
    const list = Array.isArray(data)
      ? (data as AppEntry[]).filter(
          (e) =>
            e &&
            typeof e.appName === "string" &&
            typeof e.category === "string"
        )
      : [];
    setDynamicAppList(list);
    console.log(`[apps-list] loaded ${list.length} app(s) from ${url}`);
  } catch (e) {
    console.warn("[apps-list] load failed:", e);
  }
}

export function startAppsListPolling(url: string): void {
  loadAppsList(url);
  setInterval(() => loadAppsList(url), REFRESH_MS);
}

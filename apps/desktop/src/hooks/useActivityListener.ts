import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../stores/app";
import { useSessionStore } from "../stores/session";
import type { ActivityType } from "@cowork/shared";

const log = (...args: unknown[]) => console.log("[activity]", ...args);

interface ActivityChangedPayload {
  activity: ActivityType;
  app_name: string;
  process: string;
  bundle_id: string;
}

export function useActivityListener() {
  const setActivity = useAppStore((s) => s.setActivity);
  const blocklist = useAppStore((s) => s.blocklist);

  useEffect(() => {
    // Sync blocklist to Rust on mount and when it changes
    log(`syncing blocklist (${blocklist.length} entries) to native`);
    invoke("set_blocklist", { blocklist }).catch((e) => {
      console.error("[activity] set_blocklist failed:", e);
    });
  }, [blocklist]);

  useEffect(() => {
    log("starting native activity listener");

    const unlisten = listen<ActivityChangedPayload>(
      "activity-changed",
      (event) => {
        const { activity, app_name, process, bundle_id } = event.payload;
        // Do not update when Cowork is in foreground — keep showing previous app
        if (app_name && app_name.toLowerCase().includes("cowork")) {
          log(`ignoring (Cowork in foreground), keeping previous app`);
          return;
        }
        log(`detected: ${activity} app="${app_name}" process="${process}"`);

        // Accumulate previous app segment into our own appSeconds so the session breakdown list grows.
        // (We never receive our own USER_UPDATED, so we must do this on the client that switched.)
        const { sessionCode } = useSessionStore.getState();
        if (sessionCode) {
          const { userId, currentAppName, activityStartedAt } = useAppStore.getState();
          const elapsedMs = Date.now() - activityStartedAt;
          if (elapsedMs > 0) {
            useSessionStore.getState().addAppTime(userId, currentAppName ?? "", elapsedMs / 1000);
          }
        }

        setActivity(activity, app_name, process ?? "", bundle_id ?? "");
      },
    );

    return () => {
      log("stopping native activity listener");
      unlisten.then((fn) => fn());
    };
  }, [setActivity]);
}

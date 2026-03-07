import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../stores/app";
import type { ActivityType } from "@cowork/shared";

const log = (...args: unknown[]) => console.log("[activity]", ...args);

interface ActivityChangedPayload {
  activity: ActivityType;
  app_name: string;
  process: string;
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
        const { activity, app_name, process } = event.payload;
        log(`detected: ${activity} app="${app_name}" process="${process}"`);
        setActivity(activity, app_name);
      },
    );

    return () => {
      log("stopping native activity listener");
      unlisten.then((fn) => fn());
    };
  }, [setActivity]);
}

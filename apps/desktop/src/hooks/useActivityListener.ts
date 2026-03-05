import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../stores/app";
import type { ActivityType } from "@cowork/shared";

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
    invoke("set_blocklist", { blocklist });
  }, [blocklist]);

  useEffect(() => {
    const unlisten = listen<ActivityChangedPayload>(
      "activity-changed",
      (event) => {
        const { activity, app_name } = event.payload;
        setActivity(activity, app_name);
      }
    );

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [setActivity]);
}

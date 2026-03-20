import { useCallback, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

type UpdateState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "up_to_date" }
  | { status: "available"; version: string; body: string | null; date: string | null }
  | { status: "downloading"; progress: number }
  | { status: "ready" }
  | { status: "check_error"; message: string }
  | { status: "install_error"; message: string };

/**
 * Hook to check for app updates, download, and install.
 * Uses Tauri's built-in updater (see AUTO_UPDATE.md for Sparkle on macOS).
 */
export function useUpdater() {
  const [state, setState] = useState<UpdateState>({ status: "idle" });

  const checkForUpdates = useCallback(async () => {
    setState({ status: "checking" });
    try {
      const update = await check();
      if (!update) {
        setState({ status: "up_to_date" });
        return null;
      }
      setState({
        status: "available",
        version: update.version,
        body: update.body ?? null,
        date: update.date ?? null,
      });
      return update;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState({ status: "check_error", message });
      return null;
    }
  }, []);

  const downloadAndInstall = useCallback(async () => {
    try {
      const update = await check();
      if (!update) return;

      setState({ status: "downloading", progress: 0 });
      await update.downloadAndInstall((event) => {
        if (event.event === "Progress" && event.data.chunkLength !== undefined) {
          setState((s) =>
            s.status === "downloading"
              ? { ...s, progress: Math.min(100, s.progress + 5) }
              : s
          );
        }
        if (event.event === "Finished") {
          setState({ status: "ready" });
        }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState({ status: "install_error", message });
    }
  }, []);

  const restart = useCallback(async () => {
    await relaunch();
  }, []);

  return {
    state,
    checkForUpdates,
    downloadAndInstall,
    restart,
  };
}

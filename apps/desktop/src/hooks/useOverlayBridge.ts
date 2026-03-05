import { useEffect } from "react";
import { emit } from "@tauri-apps/api/event";
import { useAppStore } from "../stores/app";
import { useSessionStore } from "../stores/session";
import { ActivityType, type UserState } from "@cowork/shared";

/**
 * Runs in the main window (Dashboard).
 *
 * The overlay is a separate Tauri webview with its own JS runtime, so it
 * cannot access Zustand stores in the main window. This hook bridges that
 * gap by emitting an `overlay-sync` Tauri event whenever the local user
 * state or session state changes.  The overlay listens for this event and
 * renders accordingly.
 */
export function useOverlayBridge() {
  const userId = useAppStore((s) => s.userId);
  const displayName = useAppStore((s) => s.displayName);
  const avatarId = useAppStore((s) => s.avatarId);
  const currentActivity = useAppStore((s) => s.currentActivity);
  const currentAppName = useAppStore((s) => s.currentAppName);

  const users = useSessionStore((s) => s.users);
  const sessionCode = useSessionStore((s) => s.sessionCode);

  useEffect(() => {
    // Build self user from app store (always the freshest local data)
    const selfUser: UserState = {
      userId,
      displayName,
      avatarId,
      activity: currentActivity ?? ActivityType.IDLE,
      appName: currentAppName,
      updatedAt: Date.now(),
    };

    // Other session members (exclude self to avoid duplication)
    const others = Array.from(users.values()).filter(
      (u) => u.userId !== userId,
    );

    emit("overlay-sync", { selfUser, others, sessionCode }).catch(() => {});
  }, [
    userId,
    displayName,
    avatarId,
    currentActivity,
    currentAppName,
    users,
    sessionCode,
  ]);
}

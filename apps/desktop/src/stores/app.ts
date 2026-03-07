import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ActivityType } from "@cowork/shared";
import { DEFAULT_AVATAR, resolveAvatarId } from "../lib/avatars";

interface AppState {
  // Persisted
  userId: string;
  displayName: string;
  avatarId: string;
  blocklist: string[];
  hasProfile: boolean;
  // Transient
  currentActivity: ActivityType | null;
  currentAppName: string;
  activityStartedAt: number; // Unix ms — when current activity began (rich presence)
  // Actions
  setProfile: (name: string, avatarId: string) => void;
  setAvatar: (avatarId: string) => void;
  addToBlocklist: (process: string) => void;
  removeFromBlocklist: (process: string) => void;
  setActivity: (activity: ActivityType, appName: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userId: crypto.randomUUID(),
      displayName: "",
      avatarId: DEFAULT_AVATAR,
      blocklist: [],
      hasProfile: false,
      currentActivity: null,
      currentAppName: "",
      activityStartedAt: Date.now(),
      setProfile: (displayName, avatarId) =>
        set({ displayName, avatarId, hasProfile: true }),
      setAvatar: (avatarId) => set({ avatarId }),
      addToBlocklist: (process) =>
        set((s) => ({ blocklist: [...s.blocklist, process] })),
      removeFromBlocklist: (process) =>
        set((s) => ({
          blocklist: s.blocklist.filter((p) => p !== process),
        })),
      setActivity: (currentActivity, currentAppName) =>
        set((s) => ({
          currentActivity,
          currentAppName,
          // Reset timer when activity type changes; keep it if only app name changed
          activityStartedAt:
            s.currentActivity !== currentActivity ? Date.now() : s.activityStartedAt,
        })),
    }),
    {
      name: "cowork-app-state",
      version: 1,
      partialize: (s) => ({
        userId: s.userId,
        displayName: s.displayName,
        avatarId: s.avatarId,
        blocklist: s.blocklist,
        hasProfile: s.hasProfile,
      }),
      // Migrate old avatar IDs (default, bear, dog, koala, panda) → new set
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version === 0 || !version) {
          if (typeof state.avatarId === "string") {
            state.avatarId = resolveAvatarId(state.avatarId);
          }
        }
        return state as unknown as AppState;
      },
    }
  )
);

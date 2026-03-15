import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ActivityType } from "@cowork/shared";
import { DEFAULT_AVATAR, resolveAvatarId, SPECIAL_CHARACTER_CODES } from "../lib/avatars";

interface AppState {
  // Persisted
  userId: string;
  displayName: string;
  avatarId: string;
  /** Avatar IDs unlocked via redeem codes (e.g. whiteferret). */
  unlockedSpecialAvatarIds: string[];
  blocklist: string[];
  hasProfile: boolean;
  lastSessionCode: string;
  // Transient
  currentActivity: ActivityType | null;
  currentAppName: string;
  activityStartedAt: number; // Unix ms — when current activity began (rich presence)
  /** Raw app identifiers for server-side classification (process, bundle_id from native). */
  rawProcess: string;
  rawBundleId: string;
  /** Session goal/todo — shown on overlay as 📝 + tooltip. Not persisted. */
  sessionTodo: string;
  /** Focus status: false = can chat (green), true = locked in (red). Not persisted. */
  isFocused: boolean;
  // Actions
  setProfile: (name: string, avatarId: string) => void;
  setSessionTodo: (text: string) => void;
  setFocusMode: (isFocused: boolean) => void;
  setAvatar: (avatarId: string) => void;
  /** Redeem a special character code. Returns true if code was valid and unlocked an avatar. */
  redeemSpecialCode: (code: string) => boolean;
  addToBlocklist: (process: string) => void;
  removeFromBlocklist: (process: string) => void;
  setActivity: (activity: ActivityType, appName: string, rawProcess?: string, rawBundleId?: string) => void;
  setLastSessionCode: (code: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userId: crypto.randomUUID(),
      displayName: "",
      avatarId: DEFAULT_AVATAR,
      blocklist: [],
      hasProfile: false,
      unlockedSpecialAvatarIds: [],
      lastSessionCode: "",
      currentActivity: null,
      currentAppName: "",
      activityStartedAt: Date.now(),
      rawProcess: "",
      rawBundleId: "",
      sessionTodo: "",
      isFocused: false,
      setProfile: (displayName, avatarId) =>
        set({ displayName, avatarId, hasProfile: true }),
      setAvatar: (avatarId) => set({ avatarId }),
      redeemSpecialCode: (code) => {
        const normalized = code.trim().toUpperCase();
        const avatarId = SPECIAL_CHARACTER_CODES[normalized];
        if (!avatarId) return false;
        set((s) => ({
          unlockedSpecialAvatarIds: s.unlockedSpecialAvatarIds.includes(avatarId)
            ? s.unlockedSpecialAvatarIds
            : [...s.unlockedSpecialAvatarIds, avatarId],
        }));
        return true;
      },
      addToBlocklist: (process) =>
        set((s) => ({ blocklist: [...s.blocklist, process] })),
      removeFromBlocklist: (process) =>
        set((s) => ({
          blocklist: s.blocklist.filter((p) => p !== process),
        })),
      setActivity: (currentActivity, currentAppName, rawProcess = "", rawBundleId = "") =>
        set((s) => ({
          currentActivity,
          currentAppName,
          rawProcess,
          rawBundleId,
          // Reset timer when activity type changes; keep it if only app name changed
          activityStartedAt:
            s.currentActivity !== currentActivity ? Date.now() : s.activityStartedAt,
        })),
      setLastSessionCode: (lastSessionCode) => set({ lastSessionCode }),
      setSessionTodo: (sessionTodo) => set({ sessionTodo }),
      setFocusMode: (isFocused) => set({ isFocused }),
    }),
    {
      name: "cowork-app-state",
      version: 1,
      partialize: (s) => ({
        userId: s.userId,
        displayName: s.displayName,
        avatarId: s.avatarId,
        unlockedSpecialAvatarIds: s.unlockedSpecialAvatarIds,
        blocklist: s.blocklist,
        hasProfile: s.hasProfile,
        lastSessionCode: s.lastSessionCode,
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

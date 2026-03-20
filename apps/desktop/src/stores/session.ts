import { create } from "zustand";
import type { UserState } from "@cowork/shared";
import { useAppStore } from "./app";

const log = (...args: unknown[]) => console.log("[session-store]", ...args);

/** Per-user accumulated seconds per app name (session-scoped). */
type AppSeconds = Record<string, Record<string, number>>;

interface SessionState {
  sessionCode: string | null;
  connected: boolean;
  users: Map<string, UserState>;
  /** Accumulated seconds per user per app name. Cleared on setSession. */
  appSeconds: AppSeconds;
  // Actions
  setConnected: (v: boolean) => void;
  setSession: (code: string, users: UserState[]) => void;
  upsertUser: (user: UserState) => void;
  removeUser: (userId: string) => void;
  /** Add elapsed seconds to a user's app bucket (called when they switch app). */
  addAppTime: (userId: string, appName: string, seconds: number) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  sessionCode: null,
  connected: false,
  users: new Map(),
  appSeconds: {},
  setConnected: (connected) => {
    log(`connected=${connected}`);
    set({ connected });
  },
  setSession: (sessionCode, users) => {
    log(`setSession code=${sessionCode} users=${users.length}`);
    useAppStore.getState().setLastSessionCode(sessionCode);
    set({
      sessionCode,
      users: new Map(users.map((u) => [u.userId, u])),
      appSeconds: {}, // fresh session = reset time breakdown
    });
  },
  upsertUser: (user) =>
    set((s) => {
      const isNew = !s.users.has(user.userId);
      if (isNew) {
        log(`+ user "${user.displayName}" (${user.userId.slice(0, 8)})`);
      }
      const m = new Map(s.users);
      m.set(user.userId, user);
      return { users: m };
    }),
  removeUser: (userId) =>
    set((s) => {
      const user = s.users.get(userId);
      log(`- user "${user?.displayName ?? "?"}" (${userId.slice(0, 8)})`);
      const m = new Map(s.users);
      m.delete(userId);
      const next = { ...s.appSeconds };
      delete next[userId];
      return { users: m, appSeconds: next };
    }),
  addAppTime: (userId, appName, seconds) =>
    set((s) => {
      const key = appName?.trim() || "Idle";
      const prev = s.appSeconds[userId] ?? {};
      const next: AppSeconds = { ...s.appSeconds, [userId]: { ...prev } };
      const bucket = next[userId]!;
      bucket[key] = (bucket[key] ?? 0) + seconds;
      return { appSeconds: next };
    }),
  clearSession: () => {
    log("session cleared");
    set({ sessionCode: null, connected: false, users: new Map(), appSeconds: {} });
  },
}));

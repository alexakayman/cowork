import { create } from "zustand";
import type { UserState } from "@cowork/shared";
import { useAppStore } from "./app";

const log = (...args: unknown[]) => console.log("[session-store]", ...args);

interface SessionState {
  sessionCode: string | null;
  connected: boolean;
  users: Map<string, UserState>;
  // Actions
  setConnected: (v: boolean) => void;
  setSession: (code: string, users: UserState[]) => void;
  upsertUser: (user: UserState) => void;
  removeUser: (userId: string) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  sessionCode: null,
  connected: false,
  users: new Map(),
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
      return { users: m };
    }),
  clearSession: () => {
    log("session cleared");
    set({ sessionCode: null, connected: false, users: new Map() });
  },
}));

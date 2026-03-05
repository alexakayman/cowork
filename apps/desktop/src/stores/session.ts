import { create } from "zustand";
import type { UserState } from "@cowork/shared";

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
  setConnected: (connected) => set({ connected }),
  setSession: (sessionCode, users) =>
    set({
      sessionCode,
      users: new Map(users.map((u) => [u.userId, u])),
    }),
  upsertUser: (user) =>
    set((s) => {
      const m = new Map(s.users);
      m.set(user.userId, user);
      return { users: m };
    }),
  removeUser: (userId) =>
    set((s) => {
      const m = new Map(s.users);
      m.delete(userId);
      return { users: m };
    }),
  clearSession: () =>
    set({ sessionCode: null, connected: false, users: new Map() }),
}));

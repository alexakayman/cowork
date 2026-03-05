import type { UserState } from '@cowork/shared';
import type { WsUserData } from './server.js';
import uWS from 'uWebSockets.js';

export interface Session {
  code: string;
  users: Map<string, UserState>;
  sockets: Map<string, uWS.WebSocket<WsUserData>>;
}

export type SessionStore = Map<string, Session>;

export function getOrCreateSession(store: SessionStore, code: string): Session {
  if (!store.has(code)) {
    store.set(code, { code, users: new Map(), sockets: new Map() });
  }
  return store.get(code)!;
}

export function broadcast(
  session: Session,
  message: object,
  excludeUserId?: string
): void {
  const payload = JSON.stringify(message);
  for (const [userId, ws] of session.sockets) {
    if (userId !== excludeUserId) {
      try {
        ws.send(payload);
      } catch {}
    }
  }
}

export function broadcastAll(session: Session, message: object): void {
  broadcast(session, message);
}

export function removeUser(
  store: SessionStore,
  userId: string,
  code: string
): void {
  const session = store.get(code);
  if (!session) return;
  session.users.delete(userId);
  session.sockets.delete(userId);
  // Clean up empty sessions after a grace period
  if (session.users.size === 0) {
    setTimeout(() => {
      if (store.get(code)?.users.size === 0) store.delete(code);
    }, 30_000);
  }
}

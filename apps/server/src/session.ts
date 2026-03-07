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
    console.log(`[session] created session="${code}" (${store.size} active sessions)`);
  }
  return store.get(code)!;
}

export function broadcast(
  session: Session,
  message: object,
  excludeUserId?: string
): void {
  const payload = JSON.stringify(message);
  const type = (message as any).type ?? '?';
  let sent = 0;
  let failed = 0;

  for (const [userId, ws] of session.sockets) {
    if (userId !== excludeUserId) {
      try {
        ws.send(payload);
        sent++;
      } catch (e) {
        failed++;
        console.error(`[broadcast] failed to send to ${userId.slice(0, 8)}:`, e);
      }
    }
  }

  if (sent > 0 || failed > 0) {
    console.log(
      `[broadcast] ${type} → session=${session.code} sent=${sent} failed=${failed}`,
    );
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
    console.log(`[session] session="${code}" is now empty — will clean up in 30s`);
    setTimeout(() => {
      if (store.get(code)?.users.size === 0) {
        store.delete(code);
        console.log(`[session] deleted empty session="${code}" (${store.size} active sessions)`);
      }
    }, 30_000);
  }
}

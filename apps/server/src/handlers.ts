import type { ClientMessage, ServerMessage } from '@cowork/shared';
import type { SessionStore } from './session.js';
import type { WsUserData } from './server.js';
import {
  getOrCreateSession,
  broadcast,
  broadcastAll,
  removeUser,
} from './session.js';
import uWS from 'uWebSockets.js';

export function handleMessage(
  ws: uWS.WebSocket<WsUserData>,
  msg: ClientMessage,
  store: SessionStore
): void {
  switch (msg.type) {
    case 'JOIN': {
      const { sessionCode, user } = msg.payload;
      const isNew = !store.has(sessionCode);
      const session = getOrCreateSession(store, sessionCode);

      // Bind socket metadata
      ws.getUserData().userId = user.userId;
      ws.getUserData().sessionCode = sessionCode;
      ws.subscribe(sessionCode);

      // Register user
      session.users.set(user.userId, user);
      session.sockets.set(user.userId, ws);

      console.log(
        `[join]  user="${user.displayName}" (${user.userId.slice(0, 8)}) → session=${sessionCode} ${isNew ? '(new session)' : ''} members=${session.users.size}`,
      );

      // Send full session state to the joining user
      const stateMsg: ServerMessage = {
        type: 'SESSION_STATE',
        payload: {
          sessionCode,
          users: Array.from(session.users.values()),
        },
      };
      ws.send(JSON.stringify(stateMsg));

      // Tell everyone else about the new user
      const joinMsg: ServerMessage = {
        type: 'USER_JOINED',
        payload: { user },
      };
      broadcast(session, joinMsg, user.userId);
      break;
    }

    case 'UPDATE': {
      const { userId, activity, appName } = msg.payload;
      const code = ws.getUserData().sessionCode;
      const session = store.get(code);
      if (!session) {
        console.warn(`[update] session not found for code=${code}`);
        break;
      }

      const user = session.users.get(userId);
      if (!user) {
        console.warn(`[update] user not found: ${userId.slice(0, 8)} in session=${code}`);
        break;
      }

      const prevActivity = user.activity;
      user.activity = activity;
      user.appName = appName;
      user.updatedAt = Date.now();

      if (prevActivity !== activity) {
        console.log(
          `[update] user="${user.displayName}" (${userId.slice(0, 8)}) ${prevActivity} → ${activity} app="${appName}" session=${code}`,
        );
      }

      const updateMsg: ServerMessage = {
        type: 'USER_UPDATED',
        payload: { user },
      };
      broadcastAll(session, updateMsg);
      break;
    }

    case 'LEAVE': {
      const { userId } = msg.payload;
      const code = ws.getUserData().sessionCode;
      const session = store.get(code);
      if (session) {
        const user = session.users.get(userId);
        console.log(
          `[leave] user="${user?.displayName ?? '?'}" (${userId.slice(0, 8)}) ← session=${code} remaining=${session.users.size - 1}`,
        );
        removeUser(store, userId, code);
        const leaveMsg: ServerMessage = {
          type: 'USER_LEFT',
          payload: { userId },
        };
        broadcast(session, leaveMsg);
      }
      break;
    }

    case 'PING': {
      const pong: ServerMessage = {
        type: 'PONG',
        payload: { serverTime: Date.now() },
      };
      ws.send(JSON.stringify(pong));
      break;
    }

    default:
      console.warn(`[server] unknown message type: ${(msg as any).type}`);
  }
}

export function handleClose(
  ws: uWS.WebSocket<WsUserData>,
  store: SessionStore
): void {
  const { userId, sessionCode } = ws.getUserData();
  if (!userId || !sessionCode) return;

  const session = store.get(sessionCode);
  if (!session) return;

  const user = session.users.get(userId);
  console.log(
    `[disconnect] user="${user?.displayName ?? '?'}" (${userId.slice(0, 8)}) ← session=${sessionCode} remaining=${session.users.size - 1}`,
  );

  removeUser(store, userId, sessionCode);

  const leaveMsg: ServerMessage = {
    type: 'USER_LEFT',
    payload: { userId },
  };
  broadcast(session, leaveMsg);
}

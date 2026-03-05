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
      const session = getOrCreateSession(store, sessionCode);

      // Bind socket metadata
      ws.getUserData().userId = user.userId;
      ws.getUserData().sessionCode = sessionCode;
      ws.subscribe(sessionCode);

      // Register user
      session.users.set(user.userId, user);
      session.sockets.set(user.userId, ws);

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
      if (!session) break;

      const user = session.users.get(userId);
      if (!user) break;
      user.activity = activity;
      user.appName = appName;
      user.updatedAt = Date.now();

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

  removeUser(store, userId, sessionCode);

  const leaveMsg: ServerMessage = {
    type: 'USER_LEFT',
    payload: { userId },
  };
  broadcast(session, leaveMsg);
}

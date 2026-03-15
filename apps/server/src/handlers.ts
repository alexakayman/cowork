import type { ClientMessage, ServerMessage } from '@cowork/shared';
import type { SessionStore } from './session.js';
import type { WsUserData } from './server.js';
import {
  getOrCreateSession,
  broadcast,
  broadcastAll,
  removeUser,
} from './session.js';
import { classifyActivity } from './classifier.js';
import uWS from 'uWebSockets.js';

export function handleMessage(
  ws: uWS.WebSocket<WsUserData>,
  msg: ClientMessage,
  store: SessionStore
): void {
  switch (msg.type) {
    case 'JOIN': {
      const { sessionCode, user, rawProcess, rawBundleId } = msg.payload;
      const isNew = !store.has(sessionCode);
      const session = getOrCreateSession(store, sessionCode);

      // Server-side activity classification when raw app identifiers are provided
      const joinUser = { ...user };
      if (rawProcess !== undefined || rawBundleId !== undefined) {
        joinUser.activity = classifyActivity(
          rawProcess ?? '',
          rawBundleId ?? '',
          user.appName ?? ''
        );
      }

      // Bind socket metadata
      ws.getUserData().userId = joinUser.userId;
      ws.getUserData().sessionCode = sessionCode;
      ws.subscribe(sessionCode);

      // Register user
      session.users.set(joinUser.userId, joinUser);
      session.sockets.set(joinUser.userId, ws);

      console.log(
        `[join]  user="${joinUser.displayName}" (${joinUser.userId.slice(0, 8)}) → session=${sessionCode} ${isNew ? '(new session)' : ''} members=${session.users.size}`,
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

      // Send latest state of each existing user to the joiner so they get goals/focus
      // that may have been set after SESSION_STATE was built (avoids race with in-flight UPDATEs)
      for (const existingUser of session.users.values()) {
        if (existingUser.userId === joinUser.userId) continue;
        const updateMsg: ServerMessage = {
          type: 'USER_UPDATED',
          payload: { user: existingUser },
        };
        ws.send(JSON.stringify(updateMsg));
      }

      // Tell everyone else about the new user
      const joinMsg: ServerMessage = {
        type: 'USER_JOINED',
        payload: { user: joinUser },
      };
      broadcast(session, joinMsg, joinUser.userId);
      break;
    }

    case 'UPDATE': {
      const { userId, displayName, avatarId, activity, appName, activityStartedAt, rawProcess, rawBundleId } = msg.payload;
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

      // Server-side activity classification when raw app identifiers are provided
      const resolvedActivity =
        rawProcess !== undefined || rawBundleId !== undefined
          ? classifyActivity(rawProcess ?? '', rawBundleId ?? '', appName ?? '')
          : activity;

      const prevActivity = user.activity;
      const prevAvatar = user.avatarId;
      user.displayName = displayName;
      user.avatarId = avatarId;
      user.activity = resolvedActivity;
      user.appName = appName;
      user.updatedAt = Date.now();
      user.activityStartedAt = activityStartedAt;
      if ('sessionTodo' in msg.payload) {
        user.sessionTodo = msg.payload.sessionTodo ?? null;
      }
      if ('isFocused' in msg.payload) {
        user.isFocused = Boolean(msg.payload.isFocused);
      }

      if (prevActivity !== resolvedActivity || prevAvatar !== avatarId) {
        console.log(
          `[update] user="${user.displayName}" (${userId.slice(0, 8)}) ${prevActivity} → ${resolvedActivity} avatar=${avatarId} app="${appName}" session=${code}`,
        );
      }
      if ('sessionTodo' in msg.payload) {
        console.log(
          `[update] user="${user.displayName}" (${userId.slice(0, 8)}) goal="${user.sessionTodo ?? ''}" session=${code}`,
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

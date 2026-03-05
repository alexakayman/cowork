import { useEffect, useRef, useCallback } from "react";
import { ActivityType, type ClientMessage, type ServerMessage } from "@cowork/shared";
import { useAppStore } from "../stores/app";
import { useSessionStore } from "../stores/session";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:3333";
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_DELAY_MS = 30000;

export function usePresenceSocket() {
  const ws = useRef<WebSocket | null>(null);
  const reconnectDelay = useRef(RECONNECT_DELAY_MS);
  const sessionCode = useSessionStore((s) => s.sessionCode);
  const currentActivity = useAppStore((s) => s.currentActivity);
  const currentAppName = useAppStore((s) => s.currentAppName);
  const setConnected = useSessionStore((s) => s.setConnected);
  const setSession = useSessionStore((s) => s.setSession);
  const upsertUser = useSessionStore((s) => s.upsertUser);
  const removeUser = useSessionStore((s) => s.removeUser);

  const send = useCallback((msg: ClientMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg));
    }
  }, []);

  // Connect/disconnect based on sessionCode only.
  // Reads user/activity state from the store at call-time to avoid
  // tearing down the socket on every activity change.
  useEffect(() => {
    if (!sessionCode) return;

    let disposed = false;

    function openSocket() {
      if (disposed) return;
      const socket = new WebSocket(WS_URL);

      socket.onopen = () => {
        reconnectDelay.current = RECONNECT_DELAY_MS;
        setConnected(true);

        const { userId, displayName, avatarId, currentActivity, currentAppName } =
          useAppStore.getState();
        socket.send(
          JSON.stringify({
            type: "JOIN",
            payload: {
              sessionCode,
              user: {
                userId,
                displayName,
                avatarId,
                activity: currentActivity ?? ActivityType.IDLE,
                appName: currentAppName,
                updatedAt: Date.now(),
              },
            },
          })
        );
      };

      socket.onmessage = (event) => {
        const msg: ServerMessage = JSON.parse(event.data);
        switch (msg.type) {
          case "SESSION_STATE":
            setSession(msg.payload.sessionCode, msg.payload.users);
            break;
          case "USER_JOINED":
            upsertUser(msg.payload.user);
            break;
          case "USER_LEFT":
            removeUser(msg.payload.userId);
            break;
          case "USER_UPDATED":
            upsertUser(msg.payload.user);
            break;
        }
      };

      socket.onclose = () => {
        setConnected(false);
        if (!disposed) {
          setTimeout(() => {
            reconnectDelay.current = Math.min(
              reconnectDelay.current * 2,
              MAX_RECONNECT_DELAY_MS
            );
            openSocket();
          }, reconnectDelay.current);
        }
      };

      ws.current = socket;
    }

    openSocket();

    return () => {
      disposed = true;
      ws.current?.close();
      ws.current = null;
    };
  }, [sessionCode, setConnected, setSession, upsertUser, removeUser]);

  // Broadcast activity changes to the session (separate from connection lifecycle)
  useEffect(() => {
    if (!sessionCode || !currentActivity) return;
    const { userId } = useAppStore.getState();
    send({
      type: "UPDATE",
      payload: { userId, activity: currentActivity, appName: currentAppName },
    });
  }, [currentActivity, currentAppName, sessionCode, send]);

  return { send };
}

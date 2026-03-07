import { useEffect, useRef, useCallback } from "react";
import { ActivityType, type ClientMessage, type ServerMessage } from "@cowork/shared";
import { useAppStore } from "../stores/app";
import { useSessionStore } from "../stores/session";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:3333";
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_DELAY_MS = 30000;

// ── Logging helpers ─────────────────────────────────────────────────
const log = (...args: unknown[]) => console.log("[ws]", ...args);
const warn = (...args: unknown[]) => console.warn("[ws]", ...args);
const err = (...args: unknown[]) => console.error("[ws]", ...args);

export function usePresenceSocket() {
  const ws = useRef<WebSocket | null>(null);
  const reconnectDelay = useRef(RECONNECT_DELAY_MS);
  const reconnectCount = useRef(0);
  const sessionCode = useSessionStore((s) => s.sessionCode);
  const currentActivity = useAppStore((s) => s.currentActivity);
  const currentAppName = useAppStore((s) => s.currentAppName);
  const setConnected = useSessionStore((s) => s.setConnected);
  const setSession = useSessionStore((s) => s.setSession);
  const upsertUser = useSessionStore((s) => s.upsertUser);
  const removeUser = useSessionStore((s) => s.removeUser);

  const send = useCallback((msg: ClientMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      log(`→ ${msg.type}`, msg.payload);
      ws.current.send(JSON.stringify(msg));
    } else {
      warn(`→ ${msg.type} dropped (socket not open, readyState=${ws.current?.readyState})`);
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

      log(`connecting to ${WS_URL} (session=${sessionCode})...`);
      const socket = new WebSocket(WS_URL);

      socket.onopen = () => {
        reconnectDelay.current = RECONNECT_DELAY_MS;
        reconnectCount.current = 0;
        setConnected(true);

        log(`✓ connected to ${WS_URL}`);

        const { userId, displayName, avatarId, currentActivity, currentAppName, activityStartedAt } =
          useAppStore.getState();

        const joinPayload = {
          sessionCode,
          user: {
            userId,
            displayName,
            avatarId,
            activity: currentActivity ?? ActivityType.IDLE,
            appName: currentAppName,
            updatedAt: Date.now(),
            activityStartedAt,
          },
        };
        log(`→ JOIN`, joinPayload);
        socket.send(JSON.stringify({ type: "JOIN", payload: joinPayload }));
      };

      socket.onmessage = (event) => {
        try {
          const msg: ServerMessage = JSON.parse(event.data);

          switch (msg.type) {
            case "SESSION_STATE":
              log(
                `← SESSION_STATE session=${msg.payload.sessionCode} users=[${msg.payload.users.map((u) => u.displayName).join(", ")}]`,
              );
              setSession(msg.payload.sessionCode, msg.payload.users);
              break;
            case "USER_JOINED":
              log(
                `← USER_JOINED "${msg.payload.user.displayName}" (${msg.payload.user.userId.slice(0, 8)}) activity=${msg.payload.user.activity}`,
              );
              upsertUser(msg.payload.user);
              break;
            case "USER_LEFT":
              log(`← USER_LEFT ${msg.payload.userId.slice(0, 8)}`);
              removeUser(msg.payload.userId);
              break;
            case "USER_UPDATED":
              log(
                `← USER_UPDATED "${msg.payload.user.displayName}" activity=${msg.payload.user.activity} app="${msg.payload.user.appName}"`,
              );
              upsertUser(msg.payload.user);
              break;
            case "PONG":
              log(`← PONG serverTime=${msg.payload.serverTime}`);
              break;
            case "ERROR":
              err(`← ERROR [${msg.payload.code}] ${msg.payload.message}`);
              break;
            default:
              warn(`← unknown message type:`, msg);
          }
        } catch (e) {
          err("failed to parse server message:", e, event.data);
        }
      };

      socket.onerror = (event) => {
        err("socket error:", event);
      };

      socket.onclose = (event) => {
        setConnected(false);
        log(
          `✗ disconnected code=${event.code} reason="${event.reason}" wasClean=${event.wasClean}`,
        );

        if (!disposed) {
          reconnectCount.current++;
          const delay = reconnectDelay.current;
          log(
            `  reconnecting in ${(delay / 1000).toFixed(1)}s (attempt #${reconnectCount.current})`,
          );
          setTimeout(() => {
            reconnectDelay.current = Math.min(
              reconnectDelay.current * 2,
              MAX_RECONNECT_DELAY_MS,
            );
            openSocket();
          }, delay);
        }
      };

      ws.current = socket;
    }

    openSocket();

    return () => {
      log("cleanup — closing socket");
      disposed = true;
      ws.current?.close();
      ws.current = null;
    };
  }, [sessionCode, setConnected, setSession, upsertUser, removeUser]);

  // Broadcast activity changes to the session (separate from connection lifecycle)
  useEffect(() => {
    if (!sessionCode || !currentActivity) return;
    const { userId, activityStartedAt } = useAppStore.getState();
    log(`activity changed → ${currentActivity} app="${currentAppName}" since=${new Date(activityStartedAt).toLocaleTimeString()}`);
    send({
      type: "UPDATE",
      payload: { userId, activity: currentActivity, appName: currentAppName, activityStartedAt },
    });
  }, [currentActivity, currentAppName, sessionCode, send]);

  return { send };
}

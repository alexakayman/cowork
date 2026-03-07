import uWS from 'uWebSockets.js';
import { handleMessage, handleClose } from './handlers.js';
import type { SessionStore } from './session.js';

// Each WS connection carries this user data
export interface WsUserData {
  userId: string;
  sessionCode: string;
  connectedAt: number;
}

export const sessions: SessionStore = new Map();

let connectionCount = 0;

export function createServer(port: number, cb?: () => void) {
  const app = uWS.App();

  app.ws<WsUserData>('/*', {
    compression: uWS.SHARED_COMPRESSOR,
    maxPayloadLength: 16 * 1024, // 16KB
    idleTimeout: 60,

    open: (ws) => {
      connectionCount++;
      ws.getUserData().userId = '';
      ws.getUserData().sessionCode = '';
      ws.getUserData().connectedAt = Date.now();
      console.log(
        `[ws] connection opened  (#${connectionCount} total)`,
      );
    },

    message: (ws, message, isBinary) => {
      if (isBinary) {
        console.warn('[ws] ignored binary message');
        return;
      }
      try {
        const text = Buffer.from(message).toString('utf8');
        const msg = JSON.parse(text);
        handleMessage(ws, msg, sessions);
      } catch (e) {
        console.error('[ws] invalid message:', e);
      }
    },

    close: (ws, code, _message) => {
      connectionCount--;
      const { userId, sessionCode, connectedAt } = ws.getUserData();
      const duration = connectedAt ? ((Date.now() - connectedAt) / 1000).toFixed(1) : '?';
      console.log(
        `[ws] connection closed   user=${userId || '(none)'} session=${sessionCode || '(none)'} code=${code} duration=${duration}s (#${connectionCount} remaining)`,
      );
      handleClose(ws, sessions);
    },
  });

  app.listen(port, (token) => {
    if (token) {
      console.log(`[cowork-server] ✓ Listening on ws://0.0.0.0:${port}`);
      console.log(`[cowork-server]   env=${process.env.NODE_ENV ?? 'development'}`);
      if (cb) cb();
    } else {
      console.error(`[cowork-server] ✗ Failed to listen on port ${port}`);
    }
  });
}

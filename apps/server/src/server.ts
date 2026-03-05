import uWS from 'uWebSockets.js';
import { handleMessage, handleClose } from './handlers.js';
import type { SessionStore } from './session.js';

// Each WS connection carries this user data
export interface WsUserData {
  userId: string;
  sessionCode: string;
}

export const sessions: SessionStore = new Map();

export function createServer(port: number, cb?: () => void) {
  const app = uWS.App();

  app.ws<WsUserData>('/*', {
    compression: uWS.SHARED_COMPRESSOR,
    maxPayloadLength: 16 * 1024, // 16KB
    idleTimeout: 60,

    open: (ws) => {
      ws.getUserData().userId = '';
      ws.getUserData().sessionCode = '';
    },

    message: (ws, message, isBinary) => {
      if (isBinary) return;
      try {
        const text = Buffer.from(message).toString('utf8');
        const msg = JSON.parse(text);
        handleMessage(ws, msg, sessions);
      } catch (e) {
        console.error('[server] Invalid message', e);
      }
    },

    close: (ws, _code, _message) => {
      handleClose(ws, sessions);
    },
  });

  app.listen(port, (token) => {
    if (token && cb) cb();
  });
}

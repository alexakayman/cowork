import { createServer } from './server.js';
import { startAppsListPolling } from './appsList.js';

const PORT = Number(process.env.PORT ?? 3333);
const APPS_LIST_URL = process.env.APPS_LIST_URL?.trim();

createServer(PORT, () => {
  console.log(`[cowork-server] Listening on ws://0.0.0.0:${PORT}`);
  if (APPS_LIST_URL) {
    startAppsListPolling(APPS_LIST_URL);
  }
});

import { createServer } from './server.js';

const PORT = Number(process.env.PORT ?? 3333);

createServer(PORT, () => {
  console.log(`[cowork-server] Listening on ws://0.0.0.0:${PORT}`);
});

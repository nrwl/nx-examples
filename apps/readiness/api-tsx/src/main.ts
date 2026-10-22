#!/usr/bin/env tsx
// @nx-target-name: serve
import { createServer } from 'node:http';
import { connect } from 'node:net';

const port = Number(process.env.PORT ?? 3334);
const queuePort = Number(process.env.QUEUE_PORT ?? 3336);

// Delay the listen so dependents that start before readiness hit a closed port.
const startupDelayMs = Number(process.env.STARTUP_DELAY_MS ?? 2000);

const server = createServer((req, res) => {
  if (req.url === '/api/tsx') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ message: 'Hello from tsx' }));
    return;
  }
  res.writeHead(404).end();
});

console.log(`readiness-api-tsx starting in ${startupDelayMs}ms`);

// Reach the queue first, with no retry: if Nx started this before
// readiness-queue was ready, the connection is refused.
const queue = connect(queuePort, 'localhost', () => {
  queue.destroy();
  setTimeout(listen, startupDelayMs);
});
queue.on('error', (error: NodeJS.ErrnoException) => {
  console.error(
    `readiness-api-tsx cannot reach readiness-queue on port ${queuePort}: ${error.code}`
  );
  process.exit(1);
});

function listen() {
  server.listen(port, async () => {
    console.log(`readiness-api-tsx listening on http://localhost:${port}`);
    // Set when Nx waits for this server to be ready
    if (process.env.NX_READY_SIGNAL_SOCKET) {
      try {
        // Function keeps TypeScript and bundlers from rewriting or bundling the import
        const load = new Function('s', 'return import(s)') as (
          s: string
        ) => Promise<{ emitReadySignal(server: unknown): boolean }>;
        (await load('@nx/js/ready-signal')).emitReadySignal(server);
      } catch {
        // @nx/js isn't installed
      }
    }
  });
}

#!/usr/bin/env node
// @nx-target-name: serve
import { createServer } from 'node:net';

const port = Number(process.env.PORT ?? 3335);

// Delay the listen so dependents that start before readiness are refused.
const startupDelayMs = Number(process.env.STARTUP_DELAY_MS ?? 2000);

// Stands in for a database: a TCP service with no HTTP endpoint to probe.
const server = createServer((socket) => {
  // The readiness probe and clients may drop the connection first.
  socket.on('error', () => {});
  socket.end();
});

console.log(`readiness-db starting in ${startupDelayMs}ms`);
setTimeout(() => {
  server.listen(port, () => {
    console.log(`readiness-db listening on port ${port}`);
  });
}, startupDelayMs);

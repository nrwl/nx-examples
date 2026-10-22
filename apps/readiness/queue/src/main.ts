#!/usr/bin/env node
// @nx-target-name: serve
import { createServer } from 'node:net';

const port = Number(process.env.PORT ?? 3336);

// Delay the listen so dependents that start before readiness are refused.
const startupDelayMs = Number(process.env.STARTUP_DELAY_MS ?? 2000);

// Stands in for a message queue: a TCP service checked by a ping command.
const server = createServer((socket) => {
  // The readiness check and clients may drop the connection first.
  socket.on('error', () => {});
  socket.end();
});

console.log(`readiness-queue starting in ${startupDelayMs}ms`);
setTimeout(() => {
  server.listen(port, () => {
    console.log(`readiness-queue listening on port ${port}`);
  });
}, startupDelayMs);

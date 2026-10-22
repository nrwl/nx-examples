#!/usr/bin/env node
// @nx-target-name: serve
import { createServer } from 'node:http';
import { connect } from 'node:net';

const port = Number(process.env.PORT ?? 3333);
const dbPort = Number(process.env.DB_PORT ?? 3335);

// Delay the listen so dependents that start before readiness hit a closed port.
const startupDelayMs = Number(process.env.STARTUP_DELAY_MS ?? 2000);

const server = createServer((req, res) => {
  if (req.url === '/api/node') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ message: 'Hello from node' }));
    return;
  }
  res.writeHead(404).end();
});

console.log(`readiness-api-node starting in ${startupDelayMs}ms`);

// Reach the database first, the way an app opens its pool, with no retry: if
// Nx started this before readiness-db was ready, the connection is refused.
const db = connect(dbPort, 'localhost', () => {
  db.destroy();
  setTimeout(() => {
    server.listen(port, () => {
      console.log(`readiness-api-node listening on http://localhost:${port}`);
    });
  }, startupDelayMs);
});
db.on('error', (error: NodeJS.ErrnoException) => {
  console.error(
    `readiness-api-node cannot reach readiness-db on port ${dbPort}: ${error.code}`
  );
  process.exit(1);
});

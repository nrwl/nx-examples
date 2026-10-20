#!/usr/bin/env node
// @nx-target-name: serve
import { createServer } from 'node:http';

const port = Number(process.env.PORT ?? 3333);

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
setTimeout(() => {
  server.listen(port, () => {
    console.log(`readiness-api-node listening on http://localhost:${port}`);
  });
}, startupDelayMs);

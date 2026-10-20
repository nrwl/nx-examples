#!/usr/bin/env tsx
// @nx-target-name: serve
import { createServer } from 'node:http';

const port = Number(process.env.PORT ?? 3334);

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
setTimeout(() => {
  server.listen(port, () => {
    console.log(`readiness-api-tsx listening on http://localhost:${port}`);
  });
}, startupDelayMs);

# Readiness rig

A full stack that exercises `readyWhen` on continuous targets and `waitFor: 'ready'` on their dependents. Each e2e suite waits for its frontend, each frontend waits for both APIs, and each API waits for the service behind it.

```
readiness-*-e2e:e2e ──ready──▶ readiness-<bundler>:serve ──ready──▶ readiness-api-node:serve ──ready──▶ readiness-db:serve
                                                          └─ready──▶ readiness-api-tsx:serve ──ready──▶ readiness-queue:serve
```

Every server tells Nx it is ready in a different way. Between them, they use all five `readyWhen` checks: `url`, `port`, `command`, `logMatches` and `signal`.

## Projects

| Project                 | Runs                                       | Port | `readyWhen`                                                 |
| ----------------------- | ------------------------------------------ | ---- | ----------------------------------------------------------- |
| `readiness-db`          | `node --watch src/main.ts` (`@nx/js/node`) | 3335 | `port`                                                      |
| `readiness-queue`       | `node --watch src/main.ts` (`@nx/js/node`) | 3336 | `command` (`node -e "require('node:net')..."`)              |
| `readiness-api-node`    | `node --watch src/main.ts` (`@nx/js/node`) | 3333 | `url` with `{env.PORT}`                                     |
| `readiness-api-tsx`     | `tsx watch src/main.ts` (`@nx/js/tsx`)     | 3334 | `signal`                                                    |
| `readiness-vite`        | Vite                                       | 4310 | inferred `command` (no `nxReadySignal()`), longer `timeout` |
| `readiness-webpack`     | webpack                                    | 4320 | inferred `signal`                                           |
| `readiness-rspack`      | Rspack                                     | 4330 | `logMatches`                                                |
| `readiness-vite-e2e`    | Playwright                                 |      |                                                             |
| `readiness-webpack-e2e` | Cypress                                    |      |                                                             |
| `readiness-rspack-e2e`  | Playwright                                 |      |                                                             |

## What each server shows

- `readiness-db` stands in for a database. It is a TCP service with no HTTP endpoint, so a `port` check is the one that fits.
- `readiness-queue` stands in for a message queue. Its hand-written `command` works like a health-check CLI such as `redis-cli ping`. It exits with 1 until the queue accepts a connection, and Nx runs it again after each failure.
- `readiness-api-node` has a hand-written `url` check. `PORT` is set in the target's `env` option, and both the server and the check read it, the check through `{env.PORT}`.
- `readiness-api-tsx` reports itself with `emitReadySignal` from `@nx/js/ready-signal`, using the block that `@nx/node:application` generates for Express apps.
- `readiness-vite` has no `nxReadySignal()`, so `@nx/vite` infers a `command` check that waits for the dev server's port. Its `readyWhen` keeps that check with `"...": true` and doubles the timeout, as Nx's timeout error suggests.
- `readiness-webpack` gets an inferred `signal`, sent by `NxAppWebpackPlugin` once the dev server listens.
- `readiness-rspack` waits for the first successful compile with `logMatches`.

The database, the queue and both APIs wait 2 seconds before they listen (`STARTUP_DELAY_MS`), so a dependent that starts before readiness fails instead of passing by luck. Each API connects to its service before its own delay and exits if the connection is refused. The frontends fail to fetch from an API that isn't listening, and vite's proxy answers with a 502.

Only a `signal` check reports an address. Nx passes it to a dependent as `NX_READY_URL` when exactly one of the tasks it waits for reported one. The webpack suite's Cypress run tests against the address webpack reported. The frontends receive the address `readiness-api-tsx` reported and don't use it.

The `serve` targets of the database, the queue and the APIs come from the shebang in `src/main.ts`. The `@nx-target-name: serve` comment names the target, and `watch: true` on the plugin entry in `nx.json` makes it continuous.

## Running

Node 22.18 or later runs `readiness-db`, `readiness-queue` and `readiness-api-node`, because they rely on Node's built-in TypeScript support.

```shell
yarn install
yarn playwright install chromium
yarn nx run-many -t e2e -p "readiness-*"
```

The frontends render `Hello from node` and `Hello from tsx` once both API calls succeed, and every suite asserts on those messages.

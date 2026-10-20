# Readiness rig

A full stack that exercises `readyWhen` on continuous targets and `waitFor: 'ready'` on their dependents. Each e2e suite waits for its frontend, and each frontend waits for both APIs.

```
readiness-*-e2e:e2e ──ready──▶ readiness-<bundler>:serve ──ready──▶ readiness-api-node:serve
                                                          └─ready──▶ readiness-api-tsx:serve
```

## Projects

| Project                 | Runs                                       | Port | `readyWhen`                               |
| ----------------------- | ------------------------------------------ | ---- | ----------------------------------------- |
| `readiness-api-node`    | `node --watch src/main.ts` (`@nx/js/node`) | 3333 | `url`                                     |
| `readiness-api-tsx`     | `tsx watch src/main.ts` (`@nx/js/tsx`)     | 3334 | `command` (`node -e "fetch(...)"`)        |
| `readiness-vite`        | Vite                                       | 4310 | inferred `command` (no `nxReadySignal()`) |
| `readiness-webpack`     | webpack                                    | 4320 | inferred `signal`                         |
| `readiness-rspack`      | Rspack                                     | 4330 | `logMatches`                              |
| `readiness-vite-e2e`    | Playwright                                 |      |                                           |
| `readiness-webpack-e2e` | Cypress                                    |      |                                           |
| `readiness-rspack-e2e`  | Playwright                                 |      |                                           |

Both APIs wait 2 seconds before they listen (`STARTUP_DELAY_MS`). A dependent that starts before readiness fails to fetch instead of passing by luck.

The API serve targets come from the shebang in `src/main.ts`. The `@nx-target-name: serve` comment names the target, and `watch: true` on the plugin entry in `nx.json` makes it continuous.

## Running

Node 22.18 or later runs `readiness-api-node`, because it relies on Node's built-in TypeScript support.

```shell
yarn install
yarn playwright install chromium
yarn nx run-many -t e2e -p "readiness-*"
```

The frontends render `Hello from node` and `Hello from tsx` once both API calls succeed, and every suite asserts on those messages.

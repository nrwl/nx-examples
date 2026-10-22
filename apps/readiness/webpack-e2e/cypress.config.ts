const { nxE2EPreset } = require('@nx/cypress/plugins/cypress-preset');
const { defineConfig } = require('cypress');
module.exports = defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      cypressDir: 'src',
      webServerCommands: {
        default: 'yarn nx run readiness-webpack:serve',
      },
      ciWebServerCommand: 'yarn nx run readiness-webpack:serve',
      ciBaseUrl: 'http://localhost:4320',
    }),
    baseUrl: 'http://localhost:4320',
  },
});

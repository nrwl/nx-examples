import { defineConfig } from 'cypress';
import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';

export default defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      webServerCommands: {
        default: 'nx serve cart',
      },
      ciWebServerCommand: 'nx run cart:serve',
      webServerConfig: {
        timeout: 30000,
      },
    }),
    baseUrl: 'http://localhost:4200',
    fileServerFolder: '.',
    fixturesFolder: './src/fixtures',
    video: true,
    videosFolder: '../../dist/cypress/apps/cart-e2e/videos',
    screenshotsFolder: '../../dist/cypress/apps/cart-e2e/screenshots',
    chromeWebSecurity: false,
    specPattern: 'src/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: false,
    testIsolation: false,
  },
});

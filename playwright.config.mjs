import { env, platform } from 'node:process';
import { defineConfig } from '@playwright/test';

const puerto = 5175;
const baseURL = `http://127.0.0.1:${puerto}`;

export default defineConfig({
  testDir: './tests/visual',
  outputDir: './.local/playwright/results',
  reporter: [['list'], ['html', { outputFolder: '.local/playwright/report', open: 'never' }]],
  snapshotPathTemplate: '{testDir}/baselines/{projectName}/{platform}/{testFilePath}/{arg}{ext}',
  updateSnapshots: 'none',
  use: {
    baseURL,
    browserName: 'chromium',
    channel: env.SIA_VISUAL_CHROME === '1' ? 'chrome' : undefined,
    locale: 'es-CR',
    timezoneId: 'America/Costa_Rica',
    colorScheme: 'light',
    reducedMotion: 'reduce',
    serviceWorkers: 'block'
  },
  projects: [
    { name: 'escritorio', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'tableta', use: { viewport: { width: 768, height: 1024 }, hasTouch: true } },
    { name: 'movil', use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } }
  ],
  webServer: {
    command: `${platform === 'win32' ? 'npm.cmd' : 'npm'} exec --workspace @sia/web -- vite --host 127.0.0.1 --port ${puerto} --strictPort`,
    env: { VITE_API_BASE_URL: `${baseURL}/__api_visual` },
    url: baseURL,
    reuseExistingServer: false,
    stdout: 'ignore',
    stderr: 'pipe'
  }
});

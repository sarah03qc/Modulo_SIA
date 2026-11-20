/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-18.
 * Prueba de navegador contra la aplicación y la API ya levantadas.
 * No arranca servidores ni usa el proxy visual.
 */
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './apps/web/tests/e2e',
  timeout: 240000,
  expect: { timeout: 20000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5174',
    browserName: 'chromium',
    channel: 'chrome',
    locale: 'es-CR',
    timezoneId: 'America/Costa_Rica',
    viewport: { width: 1440, height: 900 },
    screenshot: 'off',
    trace: 'off',
    video: 'off'
  }
});

import { existsSync } from 'node:fs';
import { URL } from 'node:url';
import { expect, test as base } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const ETIQUETAS_WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

export const test = base.extend({
  apiSintetica: [async ({ page, baseURL }, usar) => {
    const rutas = new Map();
    const solicitudesBloqueadas = [];
    const origen = new URL(baseURL).origin;

    await page.route('**/*', async (ruta) => {
      const solicitud = ruta.request();
      const url = new URL(solicitud.url());
      if (url.origin === origen && !url.pathname.startsWith('/__api_visual/')) {
        await ruta.continue();
        return;
      }

      const respuesta = url.origin === origen && rutas.get(url.pathname);
      if (respuesta) {
        await ruta.fulfill(await respuesta(solicitud));
      } else {
        solicitudesBloqueadas.push(`${solicitud.method()} ${url.origin}${url.pathname}`);
        await ruta.abort('blockedbyclient');
      }
    });

    const fallos = [];
    page.on('pageerror', (error) => fallos.push(error.message));
    page.on('console', (mensaje) => {
      if (mensaje.type() === 'error') fallos.push(mensaje.text());
    });
    page.on('requestfailed', (solicitud) => {
      const codigo = solicitud.failure()?.errorText;
      if (codigo !== 'net::ERR_ABORTED') {
        const url = new URL(solicitud.url());
        fallos.push(`${codigo} ${url.origin}${url.pathname}`);
      }
    });
    page.on('response', (respuesta) => {
      if (respuesta.status() >= 400) {
        const url = new URL(respuesta.url());
        fallos.push(`HTTP ${respuesta.status()} ${url.origin}${url.pathname}`);
      }
    });

    await usar((camino, responder) => rutas.set(`/__api_visual${camino}`, responder));
    expect(solicitudesBloqueadas, 'Solicitudes sin fixture o fuera del origen de pruebas').toEqual([]);
    expect(fallos, 'Errores de navegador y fallos de recursos').toEqual([]);
  }, { auto: true }]
});

export async function ComprobarAccesibilidad(page, info, estado) {
  const { violations, incomplete } = await new AxeBuilder({ page })
    .withTags(ETIQUETAS_WCAG_AA)
    .analyze();
  await info.attach(`axe-${estado}`, {
    body: JSON.stringify({ violations, incomplete }, null, 2),
    contentType: 'application/json'
  });
  expect(violations, `Infracciones axe en ${estado}`).toEqual([]);
}

export async function ComprobarDesbordamiento(page) {
  await expect.poll(() => page.locator('html').evaluate((elemento) => (
    elemento.scrollWidth - elemento.clientWidth
  ))).toBeLessThanOrEqual(1);
}

export async function CapturarParaRevision(page, info, nombre) {
  await page.evaluate(() => globalThis.document.fonts.ready.then(() => undefined));
  const ruta = info.outputPath(nombre);
  await page.screenshot({ path: ruta, fullPage: true, animations: 'disabled', scale: 'css' });
  await info.attach(nombre, { path: ruta, contentType: 'image/png' });

  if (info.project.use.channel === 'chrome') {
    info.annotations.push({ type: 'captura de Chrome', description: nombre });
    return;
  }

  if (existsSync(info.snapshotPath(nombre, { kind: 'screenshot' }))) {
    await expect(page).toHaveScreenshot(nombre, { fullPage: true, scale: 'css' });
  } else {
    info.annotations.push({ type: 'baseline pendiente', description: nombre });
  }
}

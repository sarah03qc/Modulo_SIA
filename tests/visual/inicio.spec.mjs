import { expect } from '@playwright/test';
import { CapturarParaRevision, ComprobarAccesibilidad, ComprobarDesbordamiento, test } from './fixtures.mjs';

const DISPONIBLE = { disponibilidad: 'DISPONIBLE', cantidad: 2 };
const RESUMEN = {
  referencias: DISPONIBLE,
  referenciasPendientes: DISPONIBLE,
  casosActivos: { ...DISPONIBLE, personas: 2 },
  proximasSesiones: { disponibilidad: 'DISPONIBLE', items: [] },
  posiblesReferencias: DISPONIBLE,
  atencionesRegistradas: DISPONIBLE,
  actividadesVencidas: { ...DISPONIBLE, cantidad: 0 },
  proximasAcciones: { disponibilidad: 'DISPONIBLE', items: [] }
};

test('entrada de desarrollo e Inicio desde el navegador, HU-001 y HU-002', async ({ page, apiSintetica }, info) => {
  const salud = Promise.withResolvers();
  let healthMalformado = true;
  apiSintetica('/health', async () => {
    await salud.promise;
    return healthMalformado ? { body: 'Respuesta sintética inválida' } : { json: { status: 'ok' } };
  });
  apiSintetica('/ready', () => ({ json: { status: 'ready', checks: { sidinacc: { readOnly: true } } } }));
  apiSintetica('/api/proceso/contexto', (solicitud) => {
    const oficina = solicitud.headers().authorization === 'Bearer dev-oficina-hatillo';
    return { json: {
      nivel: oficina ? 'OFICINA_LOCAL' : 'ESTABLECIMIENTO',
      puedeConsultarReferencias: true,
      puedeGestionarSesiones: oficina,
      puedeVerListaSimplificada: !oficina,
      puedeVerCasosOficina: oficina
    } };
  });
  apiSintetica('/api/proceso/resumen', () => ({ json: RESUMEN }));

  const estado = page.getByRole('status');
  try {
    await page.goto('/');
    await expect(estado).toHaveText('Comprobando la API.');
    await expect(estado).toHaveAttribute('aria-busy', 'true');
  } finally {
    salud.resolve();
  }
  await expect(estado).toHaveText('La API no respondió correctamente.');

  await page.keyboard.press('Tab');
  const volver = page.getByRole('button', { name: 'Volver a comprobar' });
  await expect(volver).toBeFocused();
  await expect(volver).toHaveCSS('outline-style', 'solid');
  healthMalformado = false;
  await page.keyboard.press('Enter');
  await expect(estado).toHaveText('API en ejecución y dependencias disponibles.');
  await expect(estado).toHaveAttribute('aria-busy', 'false');

  await page.keyboard.press('Tab');
  const identidad = page.getByLabel('Identidad de desarrollo');
  await expect(identidad).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Continuar' })).toBeFocused();
  await page.keyboard.press('Enter');

  const navegacion = page.getByRole('navigation', { name: 'Principal' });
  const sesiones = navegacion.getByRole('button', { name: 'Sesiones', exact: true });
  await expect(page.getByRole('heading', { name: 'Inicio', exact: true })).toBeVisible();
  await expect(sesiones).toHaveCount(0);
  await navegacion.getByRole('button', { name: 'Salir' }).click();
  await expect(estado).toHaveText('API en ejecución y dependencias disponibles.');
  await identidad.selectOption('dev-oficina-hatillo');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(sesiones).toBeVisible();
  await expect(navegacion.getByRole('button', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByText('No hay sesiones próximas.')).toBeVisible();

  await ComprobarDesbordamiento(page);
  await CapturarParaRevision(page, info, 'inicio-oficina.png');
  await ComprobarAccesibilidad(page, info, 'inicio-oficina');
});

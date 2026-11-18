import { expect } from '@playwright/test';
import { CapturarParaRevision, ComprobarAccesibilidad, ComprobarDesbordamiento, test } from './fixtures.mjs';

test('gráfico SVG y tabla sintética disponibles por teclado', async ({ page }, info) => {
  await page.goto('/demos/ui-visual/index.html');
  await expect(page.getByRole('heading', { name: 'Laboratorio de interfaz' })).toBeVisible();
  const grafico = page.getByRole('tab', { name: 'Gráfico' });
  const tabla = page.getByRole('tab', { name: 'Tabla' });
  const panelGrafico = page.getByRole('tabpanel', { name: 'Gráfico' });
  const panelTabla = page.getByRole('tabpanel', { name: 'Tabla' });

  await expect(grafico).toHaveAttribute('aria-selected', 'true');
  await expect(panelGrafico.locator('svg')).toBeVisible();
  const tamanio = await panelGrafico.locator('svg').boundingBox();
  expect(tamanio.width).toBeGreaterThan(0);
  expect(tamanio.height).toBeGreaterThan(0);
  await ComprobarDesbordamiento(page);
  await CapturarParaRevision(page, info, 'laboratorio-grafico.png');
  await ComprobarAccesibilidad(page, info, 'laboratorio-grafico');

  await page.keyboard.press('Tab');
  await expect(grafico).toBeFocused();
  await expect(grafico).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('ArrowRight');
  await expect(tabla).toBeFocused();
  await expect(tabla).toHaveAttribute('aria-selected', 'true');
  await expect(panelGrafico).toBeHidden();
  await page.keyboard.press('Tab');
  await expect(panelTabla).toBeFocused();

  const datos = panelTabla.getByRole('table', { name: 'Datos de demostración' });
  await expect(datos.getByRole('columnheader')).toHaveCount(2);
  await expect(datos.getByRole('row')).toHaveCount(4);
  await ComprobarDesbordamiento(page);
  await CapturarParaRevision(page, info, 'laboratorio-tabla.png');
  await ComprobarAccesibilidad(page, info, 'laboratorio-tabla');
});

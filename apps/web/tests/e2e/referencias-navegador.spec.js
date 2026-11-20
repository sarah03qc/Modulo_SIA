/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-18.
 * Recorre en el navegador el envío, la evaluación y el permiso de referencias.
 * Usa la aplicación de http://127.0.0.1:5174 y la API real de desarrollo.
 * Cada corrida elige un consecutivo libre y una persona sintética sin caso activo.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { expect, test } from '@playwright/test';

const API = 'http://127.0.0.1:4000';
const CARPETA = '.local/referencias-navegador';
const MANIFIESTO = `${CARPETA}/manifiesto-prueba.json`;
const MARCA = 'Dato sintético de la prueba de navegador.';
const HATILLO = [
  'SYN-1100102-01',
  'SYN-1100102-02',
  'SYN-1100102-03',
  'SYN-1100102-04',
  'SYN-1100102-06',
  'SYN-1100102-07',
  'SYN-1100102-09',
  'SYN-1100102-10',
  'SYN-1100102-99'
];
const BRUNCA = [
  'SYN-6080404-01',
  'SYN-6080404-02',
  'SYN-6080404-04',
  'SYN-6080404-05'
];

function Encabezado(identidad) {
  return { Authorization: `Bearer ${identidad}` };
}

async function LeerJson(respuesta) {
  const texto = await respuesta.text();
  return texto ? JSON.parse(texto) : {};
}

async function Consultar(request, identidad, ruta, parametros = {}) {
  const respuesta = await request.get(`${API}${ruta}`, {
    headers: Encabezado(identidad),
    params: parametros
  });
  return { status: respuesta.status(), cuerpo: await LeerJson(respuesta) };
}

async function PersonaDisponible(request, identidad, candidatos) {
  for (const persona of candidatos) {
    const ficha = await Consultar(
      request,
      identidad,
      '/api/institutional/persons/search',
      { q: persona }
    );
    if (ficha.status !== 200 || ficha.cuerpo.result?.total !== 1) {
      continue;
    }
    const pendientes = await Consultar(request, identidad, '/api/references', {
      identification: persona,
      status: 'PENDIENTE_REVISION',
      pageSize: 5
    });
    const casos = await Consultar(request, identidad, '/api/proceso/casos', {
      identificacion: persona,
      estado: 'ACTIVO'
    });
    const sinPendiente = pendientes.cuerpo.result?.total === 0;
    const sinCaso = Array.isArray(casos.cuerpo.items) && casos.cuerpo.items.length === 0;
    if (pendientes.status === 200 && casos.status === 200 && sinPendiente && sinCaso) {
      return persona;
    }
  }
  throw new Error(`No hay persona sintética disponible para ${identidad}.`);
}

async function ConsecutivoLibre(request, identidad, base) {
  const lista = await Consultar(request, identidad, '/api/references', {
    consecutive: base,
    pageSize: 50
  });
  if (lista.status !== 200) {
    throw new Error(`No se pudo consultar consecutivos de ${base}: ${lista.status}.`);
  }
  if ((lista.cuerpo.result?.total || 0) > (lista.cuerpo.result?.items || []).length) {
    throw new Error(`La bandeja de ${base} no cupo en una página.`);
  }
  const usados = new Set((lista.cuerpo.result?.items || []).map((item) => item.consecutive));
  for (let numero = 850; numero <= 899; numero += 1) {
    const candidato = `${base}-REF-${String(numero).padStart(3, '0')}-2026`;
    if (!usados.has(candidato)) {
      return candidato;
    }
  }
  throw new Error(`No queda consecutivo libre para ${base}.`);
}

async function Entrar(page, etiqueta) {
  await page.goto('/');
  await page.getByLabel('Identidad de desarrollo').selectOption({ label: etiqueta });
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByRole('button', { name: 'Referencias', exact: true })).toBeVisible();
}

async function Capturar(page, nombre) {
  await page.screenshot({
    path: `${CARPETA}/${nombre}.png`,
    fullPage: true
  });
}

function RetirarCorrida() {
  if (!fs.existsSync(MANIFIESTO)) {
    return;
  }
  const resultado = spawnSync('node', [
    'scripts/retirar-residuo-referencia-prueba.js',
    MANIFIESTO
  ], { encoding: 'utf8' });
  if (resultado.status !== 0) {
    const detalle = resultado.stderr || resultado.stdout || 'No se retiró la corrida.';
    throw new Error(detalle.trim());
  }
}

async function EnviarReferencia(page, persona, consecutivo) {
  await page.getByRole('button', { name: 'Referencias', exact: true }).click();
  await page.getByRole('button', { name: 'Nueva referencia' }).click();
  await expect(page.getByRole('heading', { name: 'Nueva referencia' })).toBeVisible();
  await page.getByLabel('Buscar por identificación o nombre').fill(persona);
  await page.getByRole('button', { name: 'Buscar en el ámbito' }).click();
  await page.getByRole('button', { name: persona }).click();
  await expect(page.getByText(`Identificación: ${persona}`)).toBeVisible();
  await page.getByLabel('Fecha de la referencia').fill('2026-11-18');
  await page.getByLabel('Vía de Atención').selectOption('NO_INMEDIATA');
  await page.getByLabel('Origen').selectOption('VIGILANCIA_TAMIZAJE');
  await page.getByLabel('Consecutivo institucional').fill(consecutivo);
  await Capturar(page, `01-formulario-${persona}`);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('checkbox', { name: 'Condición de malnutrición' }).check();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByLabel('Acciones realizadas previo a la referencia').fill(
    'Observación sintética en el establecimiento.'
  );
  await page.getByLabel('Resultados obtenidos previo a la referencia').fill(
    'El hallazgo sintético se mantiene.'
  );
  await page.locator('#informacion-complementaria').fill(MARCA);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('checkbox', { name: 'Confirmo el envío de esta referencia.' }).check();
  await page.getByRole('button', { name: 'Validar consecutivo y datos' }).click();
  const enviar = page.getByRole('button', { name: 'Confirmar y enviar referencia' });
  await expect(enviar).toBeEnabled();
  await enviar.click();
  const confirmacion = page.getByText('Referencia enviada.');
  await expect(confirmacion).toBeVisible();
  await expect(confirmacion).toContainText(consecutivo);
}

async function AbrirDetalle(page, consecutivo) {
  await page.getByRole('button', { name: 'Referencias', exact: true }).click();
  await page.getByRole('tab', { name: 'Pendientes' }).click();
  await page.getByLabel('Consecutivo').fill(consecutivo);
  const fila = page.getByRole('row', { name: consecutivo });
  await expect(fila).toBeVisible();
  await fila.getByRole('button', { name: 'Ver referencia' }).click();
  await expect(page.getByRole('heading', { name: consecutivo })).toBeVisible();
}

async function MarcarNinguno(page) {
  const categorias = page.locator('details.categoria');
  const cantidad = await categorias.count();
  expect(cantidad).toBeGreaterThanOrEqual(9);
  for (let indice = 0; indice < cantidad; indice += 1) {
    const bloque = categorias.nth(indice);
    await bloque.locator('summary').click();
    await bloque.getByRole('checkbox', { name: 'Ninguno' }).check();
  }
}

async function PrepararSesion(page, lugar) {
  await page.getByRole('button', { name: 'Llevar a una sesión' }).click();
  await expect(page.getByRole('heading', { name: 'Sesiones interdisciplinarias' })).toBeVisible();
  await page.getByRole('button', { name: 'Nueva sesión' }).click();
  await page.getByLabel('Fecha', { exact: true }).fill('2026-11-18');
  await page.getByLabel('Hora de inicio').fill('08:00');
  await page.getByLabel('Hora de finalización').fill('09:00');
  await page.getByLabel('Lugar').fill(lugar);
  await page.getByRole('checkbox', { name: 'Nutrición' }).check();
  await page.getByRole('button', { name: 'Guardar sesión' }).click();
  await expect(page.getByText('Sesión registrada.')).toBeVisible();
  for (let pagina = 0; pagina < 8; pagina += 1) {
    const fila = page.getByRole('row', { name: lugar });
    if (await fila.count()) {
      await fila.getByRole('button', { name: 'Ver sesión' }).click();
      return;
    }
    const siguiente = page.getByRole('button', { name: 'Página siguiente' });
    await expect(siguiente).toBeEnabled();
    await siguiente.click();
  }
  throw new Error(`No apareció la sesión ${lugar}.`);
}

async function Valorar(page) {
  await page.getByRole('button', { name: 'Asociar a la sesión' }).click();
  await expect(page.getByText('Situación asociada.')).toBeVisible();
  await MarcarNinguno(page);
  await page.getByLabel('Nivel de riesgo').selectOption('BAJO');
  await page.getByLabel('Nivel de protección').selectOption('MODERADA');
  await page.getByRole('button', { name: 'Registrar valoración' }).click();
  await expect(page.getByText('Valoración registrada.')).toBeVisible();
}

test('recorre admisión, no requiere y el permiso entre oficinas', async ({ page }) => {
  fs.mkdirSync(CARPETA, { recursive: true });
  RetirarCorrida();
  const errores = [];
  page.on('pageerror', (fallo) => errores.push(fallo.message));
  page.on('console', (mensaje) => {
    if (mensaje.type() !== 'error') {
      return;
    }
    errores.push(`${mensaje.text()} ${mensaje.location()?.url || ''}`.trim());
  });
  page.on('response', (respuesta) => {
    if (respuesta.status() < 400) {
      return;
    }
    const url = respuesta.url();
    if (url.startsWith(API)) {
      return;
    }
    errores.push(`${respuesta.status()} ${url}`);
  });

  const personaHatillo = await PersonaDisponible(
    page.request,
    'dev-oficina-hatillo',
    HATILLO
  );
  const personaBrunca = await PersonaDisponible(
    page.request,
    'dev-oficina-504',
    BRUNCA
  );
  const consecutivoHatillo = await ConsecutivoLibre(
    page.request,
    'dev-oficina-hatillo',
    'DNCC-DRCS-OL101-1100102'
  );
  const consecutivoBrunca = await ConsecutivoLibre(
    page.request,
    'dev-oficina-504',
    'DNCC-DRBR-OL504-6080404'
  );
  const evidencia = {
    personaHatillo,
    personaBrunca,
    consecutivoHatillo,
    consecutivoBrunca
  };
  fs.writeFileSync(MANIFIESTO, JSON.stringify({
    marca: MARCA,
    consecutivos: [consecutivoHatillo, consecutivoBrunca]
  }, null, 2));

  let falloPrueba = null;
  try {
  await Entrar(page, 'Establecimiento de demostración');
  await EnviarReferencia(page, personaHatillo, consecutivoHatillo);
  await Capturar(page, '02-confirmacion-admitida');

  await page.getByRole('button', { name: 'Salir' }).click();
  await Entrar(page, 'Oficina Local de demostración');
  await AbrirDetalle(page, consecutivoHatillo);
  await expect(page.getByText('Pendiente de revisión')).toBeVisible();
  await Capturar(page, '03-pendiente-oficina-101');

  const propia = await Consultar(page.request, 'dev-oficina-hatillo', '/api/references', {
    consecutive: consecutivoHatillo,
    status: 'PENDIENTE_REVISION'
  });
  expect(propia.cuerpo.result.total).toBe(1);
  const referenciaHatillo = propia.cuerpo.result.items[0].referenceId;
  evidencia.referenciaHatillo = referenciaHatillo;

  await page.getByRole('button', { name: 'Salir' }).click();
  await Entrar(page, 'Oficina Local 504');
  await page.getByRole('button', { name: 'Referencias', exact: true }).click();
  await page.getByRole('tab', { name: 'Pendientes' }).click();
  await page.getByLabel('Consecutivo').fill(consecutivoHatillo);
  await expect(page.getByText('No hay referencias para ese criterio.')).toBeVisible();
  await Capturar(page, '04-oficina-504-no-ve-hatillo');

  const ajenaLista = await Consultar(page.request, 'dev-oficina-504', '/api/references', {
    consecutive: consecutivoHatillo
  });
  const ajenaDetalle = await page.request.get(`${API}/api/references/${referenciaHatillo}`, {
    headers: Encabezado('dev-oficina-504')
  });
  const ajenaDecision = await page.request.post(`${API}/api/proceso/resoluciones`, {
    headers: {
      ...Encabezado('dev-oficina-504'),
      'Content-Type': 'application/json'
    },
    data: {
      referenciaId: referenciaHatillo,
      sesionId: 1,
      valoracionId: 1,
      decision: 'NO_REQUIERE_AI',
      justificacion: 'Intento sintético fuera de la Oficina Local.'
    }
  });
  evidencia.permiso = {
    lista: ajenaLista.status,
    total: ajenaLista.cuerpo.result?.total,
    detalle: ajenaDetalle.status(),
    decision: ajenaDecision.status()
  };
  expect(ajenaLista.cuerpo.result.total).toBe(0);
  expect(ajenaDetalle.status()).toBeGreaterThanOrEqual(400);
  expect(ajenaDecision.status()).toBeGreaterThanOrEqual(400);
  const siguePendiente = await Consultar(
    page.request,
    'dev-oficina-hatillo',
    `/api/references/${referenciaHatillo}`
  );
  expect(siguePendiente.cuerpo.status).toBe('PENDIENTE_REVISION');

  await page.getByRole('button', { name: 'Salir' }).click();
  await Entrar(page, 'Oficina Local de demostración');
  await AbrirDetalle(page, consecutivoHatillo);
  await PrepararSesion(page, `Sala ${consecutivoHatillo}`);
  await expect(page.getByText(`Seleccionado: Referencia ${referenciaHatillo}`)).toBeVisible();
  await Valorar(page);
  await Capturar(page, '05-valoracion-admitida');
  await page.getByRole('button', { name: 'Registrar decisión' }).click();
  await expect(page.getByText('La apertura del caso es un paso aparte.')).toBeVisible();
  await page.getByLabel('Propósitos, uno por línea').fill(
    'Acompañar el hallazgo sintético de malnutrición.'
  );
  await page.getByRole('group', { name: 'Estrategias' })
    .getByRole('checkbox', { name: 'Consejería' })
    .check();
  await page.getByRole('group', { name: 'Disciplinas del abordaje' })
    .getByRole('checkbox', { name: 'Nutrición' })
    .check();
  await page.getByLabel('Frecuencia planificada').selectOption({ index: 1 });
  await page.getByRole('checkbox', {
    name: 'Confirmo la apertura del caso de Atención Interdisciplinaria.'
  }).check();
  await page.getByRole('button', { name: 'Abrir caso' }).click();
  await expect(page.getByText(/Caso \d+ abierto/)).toBeVisible();
  await Capturar(page, '06-caso-abierto');

  await page.getByRole('button', { name: 'Casos', exact: true }).click();
  await page.locator('#caso-identificacion').fill(personaHatillo);
  await page.getByLabel('Estado del caso').selectOption('ACTIVO');
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await expect(page.getByRole('row', { name: personaHatillo })).toHaveCount(1);
  await expect(page.getByRole('cell', { name: 'ACTIVO', exact: true })).toBeVisible();
  await Capturar(page, '07-caso-en-lista');

  await page.getByRole('button', { name: 'Referencias', exact: true }).click();
  await page.getByRole('tab', { name: 'Pendientes' }).click();
  await page.getByLabel('Consecutivo').fill(consecutivoHatillo);
  await expect(page.getByText('No hay referencias para ese criterio.')).toBeVisible();
  await page.getByRole('tab', { name: 'Todas' }).click();
  await page.getByLabel('Consecutivo').fill(consecutivoHatillo);
  await expect(page.getByRole('cell', { name: 'Admitida a A.I.' })).toBeVisible();
  await Capturar(page, '08-historial-admitida');

  await page.reload();
  await Entrar(page, 'Oficina Local de demostración');
  await page.getByRole('button', { name: 'Referencias', exact: true }).click();
  await page.getByRole('tab', { name: 'Todas' }).click();
  await page.getByLabel('Consecutivo').fill(consecutivoHatillo);
  await expect(page.getByRole('cell', { name: 'Admitida a A.I.' })).toBeVisible();
  await Capturar(page, '09-persistencia-admitida');

  await page.getByRole('button', { name: 'Salir' }).click();
  await Entrar(page, 'Establecimiento de la Oficina Local 504');
  await EnviarReferencia(page, personaBrunca, consecutivoBrunca);
  await Capturar(page, '10-confirmacion-no-requiere');

  await page.getByRole('button', { name: 'Salir' }).click();
  await Entrar(page, 'Oficina Local de demostración');
  await page.getByRole('button', { name: 'Referencias', exact: true }).click();
  await page.getByLabel('Consecutivo').fill(consecutivoBrunca);
  await expect(page.getByText('No hay referencias para ese criterio.')).toBeVisible();
  await Capturar(page, '11-oficina-101-no-ve-brunca');

  const bruncaPendiente = await Consultar(page.request, 'dev-oficina-504', '/api/references', {
    consecutive: consecutivoBrunca,
    status: 'PENDIENTE_REVISION'
  });
  expect(bruncaPendiente.cuerpo.result.total).toBe(1);
  evidencia.referenciaBrunca = bruncaPendiente.cuerpo.result.items[0].referenceId;
  const hatilloNoEvalua = await page.request.post(`${API}/api/proceso/resoluciones`, {
    headers: {
      ...Encabezado('dev-oficina-hatillo'),
      'Content-Type': 'application/json'
    },
    data: {
      referenciaId: evidencia.referenciaBrunca,
      sesionId: 1,
      valoracionId: 1,
      decision: 'NO_REQUIERE_AI',
      justificacion: 'Intento sintético fuera de la Oficina Local.'
    }
  });
  evidencia.permiso.decisionInversa = hatilloNoEvalua.status();
  expect(hatilloNoEvalua.status()).toBeGreaterThanOrEqual(400);

  await page.getByRole('button', { name: 'Salir' }).click();
  await Entrar(page, 'Oficina Local 504');
  await AbrirDetalle(page, consecutivoBrunca);
  await PrepararSesion(page, `Sala ${consecutivoBrunca}`);
  await Valorar(page);
  await page.getByLabel('Decisión del equipo').selectOption('NO_REQUIERE_AI');
  await page.getByLabel('Justificación').fill(
    'La valoración sintética no muestra necesidad de Atención Interdisciplinaria.'
  );
  await page.getByRole('button', { name: 'Registrar decisión' }).click();
  await expect(page.getByText('La referencia quedó como No requiere A.I.')).toBeVisible();
  await Capturar(page, '12-decision-no-requiere');

  await page.getByRole('button', { name: 'Casos', exact: true }).click();
  await page.locator('#caso-identificacion').fill(personaBrunca);
  await page.getByLabel('Estado del caso').selectOption('ACTIVO');
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await expect(page.getByText('No hay casos que coincidan con el criterio.')).toBeVisible();
  await Capturar(page, '13-sin-caso-activo');

  await page.getByRole('button', { name: 'Referencias', exact: true }).click();
  await page.getByRole('tab', { name: 'Todas' }).click();
  await page.getByLabel('Consecutivo').fill(consecutivoBrunca);
  await expect(page.getByRole('cell', { name: 'No requiere A.I.' })).toBeVisible();
  await page.reload();
  await Entrar(page, 'Oficina Local 504');
  await page.getByRole('button', { name: 'Referencias', exact: true }).click();
  await page.getByRole('tab', { name: 'Todas' }).click();
  await page.getByLabel('Consecutivo').fill(consecutivoBrunca);
  await expect(page.getByRole('cell', { name: 'No requiere A.I.' })).toBeVisible();
  await Capturar(page, '14-persistencia-no-requiere');

  evidencia.erroresConsola = errores;
  fs.writeFileSync(`${CARPETA}/evidencia.json`, JSON.stringify(evidencia, null, 2));
  expect(errores, errores.join('\n')).toEqual([]);
  } catch (fallo) {
    falloPrueba = fallo;
  } finally {
    try {
      RetirarCorrida();
    } catch (limpieza) {
      if (!falloPrueba) {
        falloPrueba = limpieza;
      }
    }
  }
  if (falloPrueba) {
    throw falloPrueba;
  }
});

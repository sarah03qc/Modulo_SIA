/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-18.
 * HU-049, RF-127 y RF-102. Mapeos de códigos nutricionales.
 *
 * TODO-UTIC: confirmar si EVM_estadoNutricionalPe/Pt/Te/Imc almacenan
 * ANT_id global o códigos relativos por indicador.
 * TODO-UTIC: confirmar la representación de indicador no aplicable
 * (NULL, 0 u otro).
 */
'use strict';

const MODO_SINTETICO = 'SINTETICO';
const MODO_INSTITUCIONAL = 'INSTITUCIONAL';
const FRECUENCIA_HORAS = 24;

const CAMPOS = Object.freeze(['PE', 'PT', 'TE', 'IMC']);

const COLUMNAS = Object.freeze({
  PE: 'codigo_pe',
  PT: 'codigo_pt',
  TE: 'codigo_te',
  IMC: 'codigo_imc'
});

/*
 * El código 9 es una señal de la semilla local. No es una clasificación clínica.
 * El código 1 es el ejemplo normal de esa misma semilla.
 */
const MAPEO_SINTETICO = Object.freeze({
  version: 'MOCK-1',
  fuente: 'SIDINACC_LOCAL',
  estadoValidacion: 'SINTETICO',
  procedencia: 'database/sidinacc-local/040_seed_synthetic_population.sql',
  campos: Object.freeze({
    PE: Object.freeze({ 9: 'SENAL_DEMOSTRACION', 1: 'NORMAL' }),
    PT: Object.freeze({ 9: 'SENAL_DEMOSTRACION', 1: 'NORMAL' }),
    TE: Object.freeze({ 9: 'SENAL_DEMOSTRACION', 1: 'NORMAL' }),
    IMC: Object.freeze({ 9: 'SENAL_DEMOSTRACION', 1: 'NORMAL' })
  })
});

/*
 * Sin equivalencias. Un objeto presente no habilita la lectura clínica.
 */
const MAPEO_INSTITUCIONAL = Object.freeze({
  version: 'INSTITUCIONAL-0',
  fuente: 'CAH',
  estadoValidacion: 'NO_VALIDADO',
  procedencia: 'Pendiente de confirmación con UTIC. No se asume ANT_id.',
  campos: Object.freeze({
    PE: Object.freeze({}),
    PT: Object.freeze({}),
    TE: Object.freeze({}),
    IMC: Object.freeze({})
  })
});

const ALERTAS = Object.freeze({
  PE: Object.freeze(['PESO_ALTO', 'BAJO_PESO', 'BAJO_PESO_SEVERO']),
  PT: Object.freeze(['DESNUTRICION', 'DESNUTRICION_SEVERA', 'SOBREPESO', 'OBESIDAD']),
  TE: Object.freeze(['BAJA_TALLA', 'BAJA_TALLA_SEVERA']),
  IMC: Object.freeze(['DESNUTRICION', 'DESNUTRICION_SEVERA', 'SOBREPESO', 'OBESIDAD'])
});

const CRITERIO_DEMO = 'NUTRICION_DEMO';
const CRITERIO_CLINICO = 'NUTRICION_CAH';
const ORIGEN_SINTETICO = 'SIDINACC_LOCAL_SINTETICO';

/**
 * El modo institucional solo se acepta si el entorno lo pide de forma explícita.
 * Aun así, el mapeo no validado impide generar sugerencias clínicas.
 *
 * @param {NodeJS.ProcessEnv} env Entorno del proceso.
 * @returns {string} SINTETICO o INSTITUCIONAL.
 */
function LeerModo(env) {
  if (env && env.POSIBLES_MODO === MODO_INSTITUCIONAL) {
    return MODO_INSTITUCIONAL;
  }
  return MODO_SINTETICO;
}

/**
 * La programación no arranca con la API salvo una marca explícita.
 *
 * @param {NodeJS.ProcessEnv} env Entorno del proceso.
 * @returns {boolean} true cuando la ejecución periódica está habilitada.
 */
function DeteccionAutomaticaHabilitada(env) {
  return Boolean(env && env.POSIBLES_DETECCION_AUTOMATICA === '1');
}

module.exports = {
  MODO_SINTETICO,
  MODO_INSTITUCIONAL,
  FRECUENCIA_HORAS,
  CAMPOS,
  COLUMNAS,
  MAPEO_SINTETICO,
  MAPEO_INSTITUCIONAL,
  ALERTAS,
  CRITERIO_DEMO,
  CRITERIO_CLINICO,
  ORIGEN_SINTETICO,
  LeerModo,
  DeteccionAutomaticaHabilitada
};

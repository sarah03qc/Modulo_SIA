/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-18.
 * Aplica reglas sobre clasificaciones ya interpretadas.
 * No conoce los códigos tinyint de la réplica.
 *
 * TODO-FUNCIONAL: confirmar si una alerta vuelve a sugerirse después de
 * una referencia equivalente ya gestionada.
 */
'use strict';

const {
  ALERTAS,
  CRITERIO_DEMO,
  CRITERIO_CLINICO,
  MODO_INSTITUCIONAL
} = require('./configuracion-nutricion');
const { AplicabilidadPorEdad } = require('./interprete-nutricional');

const SIN_ALERTA = new Set(['NORMAL', 'ALTO', 'MUY_ALTO']);

/**
 * Evalúa si las clasificaciones producen una sola señal candidata.
 *
 * @param {object} entrada Indicadores interpretados, edad y modo.
 * @returns {object} Resultado de detección, sin identificadores de persona.
 */
function EvaluarReglas(entrada) {
  const modo = entrada && entrada.modo;
  const indicadores = entrada && Array.isArray(entrada.indicadores) ? entrada.indicadores : [];
  if (modo === MODO_INSTITUCIONAL) {
    return {
      detectar: false,
      estado: 'CODIGOS_NO_VALIDADOS',
      criterioCodigo: null,
      demostracion: false,
      evidencias: []
    };
  }
  if (indicadores.some((item) => item && item.estado === 'MAPEO_NO_VALIDADO')) {
    return {
      detectar: false,
      estado: 'CODIGOS_NO_VALIDADOS',
      criterioCodigo: null,
      demostracion: false,
      evidencias: []
    };
  }
  const evidencias = [];
  for (const item of indicadores) {
    if (!item || item.estado !== 'RECONOCIDO' || !item.clasificacion) {
      continue;
    }
    if (item.clasificacion === 'SENAL_DEMOSTRACION') {
      evidencias.push({
        campo: item.campo,
        clasificacion: item.clasificacion,
        demostracion: true
      });
      continue;
    }
    if (SIN_ALERTA.has(item.clasificacion)) {
      continue;
    }
    const permitidas = ALERTAS[item.campo];
    if (!permitidas || !permitidas.includes(item.clasificacion)) {
      continue;
    }
    if (AplicabilidadPorEdad(item.campo, entrada.edadAnios) !== 'APLICABLE') {
      continue;
    }
    evidencias.push({
      campo: item.campo,
      clasificacion: item.clasificacion,
      demostracion: false
    });
  }
  if (evidencias.length === 0) {
    return {
      detectar: false,
      estado: 'SIN_SENAL',
      criterioCodigo: null,
      demostracion: false,
      evidencias: []
    };
  }
  const soloDemostracion = evidencias.every((item) => item.demostracion);
  return {
    detectar: true,
    estado: 'CANDIDATA',
    criterioCodigo: soloDemostracion ? CRITERIO_DEMO : CRITERIO_CLINICO,
    demostracion: soloDemostracion,
    evidencias
  };
}

module.exports = { EvaluarReglas };

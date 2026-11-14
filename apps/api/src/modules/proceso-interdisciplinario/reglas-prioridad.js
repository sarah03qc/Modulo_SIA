/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-14.
 * RN-009. La prioridad no se elige ni se deduce de la cantidad de factores.
 */
'use strict';

const RIESGO = Object.freeze(['ALTO', 'MODERADO', 'BAJO']);
const PROTECCION = Object.freeze(['ALTA', 'MODERADA', 'BAJA']);

const ETIQUETA_PRIORIDAD = Object.freeze({
  ALTO: 'Alto',
  MODERADO: 'Moderado',
  BAJO: 'Bajo'
});

const ETIQUETA_RIESGO = Object.freeze({
  ALTO: 'Alto',
  MODERADO: 'Moderado',
  BAJO: 'Bajo'
});

const ETIQUETA_PROTECCION = Object.freeze({
  ALTA: 'Alta',
  MODERADA: 'Moderada',
  BAJA: 'Baja'
});

/**
 * Matriz confirmada. La persistencia debe coincidir con la versión vigente.
 * Si la fila almacenada difiere, la operación se detiene.
 */
const MATRIZ_RN009 = Object.freeze({
  'ALTO|BAJA': 'ALTO',
  'ALTO|MODERADA': 'ALTO',
  'ALTO|ALTA': 'MODERADO',
  'MODERADO|BAJA': 'ALTO',
  'MODERADO|MODERADA': 'MODERADO',
  'MODERADO|ALTA': 'MODERADO',
  'BAJO|BAJA': 'MODERADO',
  'BAJO|MODERADA': 'BAJO',
  'BAJO|ALTA': 'BAJO'
});

/**
 * Calcula la prioridad A.I. exclusivamente con RN-009.
 *
 * @param {string} riesgo Nivel profesional Alto, Moderado o Bajo.
 * @param {string} proteccion Nivel profesional Alta, Moderada o Baja.
 * @returns {string|null} Código de prioridad, o null si la combinación no existe.
 */
function CalcularPrioridadRn009(riesgo, proteccion) {
  return MATRIZ_RN009[`${riesgo}|${proteccion}`] || null;
}

module.exports = {
  RIESGO,
  PROTECCION,
  ETIQUETA_PRIORIDAD,
  ETIQUETA_RIESGO,
  ETIQUETA_PROTECCION,
  MATRIZ_RN009,
  CalcularPrioridadRn009
};

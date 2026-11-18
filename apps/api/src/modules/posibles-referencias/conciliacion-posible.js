/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-18.
 * Contrasta una señal con caso, referencia y sugerencias ya registradas.
 * No interpreta códigos nutricionales.
 *
 * TODO-FUNCIONAL: confirmar la recurrencia después de una referencia
 * equivalente gestionada o creada de forma manual.
 */
'use strict';

/**
 * Elige la evaluación más reciente de cada persona.
 * Una fecha anterior no queda como alerta pendiente actual.
 *
 * @param {object[]} filas Evaluaciones ya filtradas por borrado lógico.
 * @returns {{vigentes: object[], historicas: number}} Selección y conteo.
 */
function SeleccionarVigentes(filas) {
  const grupos = new Map();
  for (const fila of filas || []) {
    const lista = grupos.get(fila.personId) || [];
    lista.push(fila);
    grupos.set(fila.personId, lista);
  }
  const vigentes = [];
  let historicas = 0;
  for (const lista of grupos.values()) {
    const ordenadas = lista.slice().sort((a, b) => {
      if (a.fechaEvaluacion !== b.fechaEvaluacion) {
        return a.fechaEvaluacion < b.fechaEvaluacion ? 1 : -1;
      }
      return Number(b.evaluacionId) - Number(a.evaluacionId);
    });
    vigentes.push(ordenadas[0]);
    historicas += ordenadas.length - 1;
  }
  return { vigentes, historicas };
}

/**
 * Decide si una candidata puede guardarse.
 * Un caso activo se consulta como hecho global y no trae datos del expediente.
 *
 * @param {object} hechos Hechos ya resueltos por el servicio.
 * @returns {{accion: string, motivo: string}} CREAR u OMITIR, con el motivo.
 */
function Conciliar(hechos) {
  const datos = hechos || {};
  if (!datos.fechaEvaluacion) {
    return { accion: 'OMITIR', motivo: 'SIN_FECHA' };
  }
  if (datos.ubicacionAmbigua) {
    return { accion: 'OMITIR', motivo: 'UBICACION_AMBIGUA' };
  }
  if (datos.casoActivo) {
    return { accion: 'OMITIR', motivo: 'CASO_ACTIVO' };
  }
  if (datos.pendiente && datos.pendiente.idExterno === datos.idExterno) {
    return { accion: 'OMITIR', motivo: 'DUPLICADO' };
  }
  if (datos.pendiente) {
    return { accion: 'OMITIR', motivo: 'PENDIENTE_EXISTENTE' };
  }
  if (datos.resueltaMismaEvaluacion) {
    return { accion: 'OMITIR', motivo: 'YA_GESTIONADA' };
  }
  if (datos.resueltaMismoCriterio) {
    return { accion: 'OMITIR', motivo: 'RECURRENCIA' };
  }
  return { accion: 'CREAR', motivo: 'NUEVA' };
}

module.exports = {
  SeleccionarVigentes,
  Conciliar
};

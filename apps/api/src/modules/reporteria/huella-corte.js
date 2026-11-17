/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * HU-050. La huella identifica el corte mostrado. No acepta cifras del cliente.
 */
'use strict';

const crypto = require('crypto');

function SerieEstable(serie) {
  return (serie || []).map((fila) => [
    fila.clave == null ? null : String(fila.clave),
    fila.etiqueta == null ? null : String(fila.etiqueta),
    fila.cantidad
  ]);
}

/**
 * Resume el corte que vio la pantalla, sin identidad ni textos de análisis.
 *
 * @param {object} respuesta Respuesta ya armada por el servidor.
 * @returns {string} Huella hexadecimal.
 */
function HuellaCorte(respuesta) {
  const canonico = {
    anio: respuesta.anio,
    fechaConsulta: respuesta.fechaConsulta,
    filtros: (respuesta.filtrosActivos || []).map((filtro) => filtro.etiqueta),
    personasUnicas: respuesta.personasUnicas,
    totalAtenciones: respuesta.totalAtenciones,
    cobertura: {
      numerador: respuesta.cobertura.numerador,
      denominador: respuesta.cobertura.denominador,
      porcentaje: respuesta.cobertura.porcentaje,
      estado: respuesta.cobertura.estado
    },
    visualizaciones: (respuesta.visualizaciones || []).map((item) => ({
      numero: item.numero,
      estado: item.estado,
      titulo: item.titulo,
      serie: SerieEstable(item.serie)
    }))
  };
  return crypto.createHash('sha256').update(JSON.stringify(canonico)).digest('hex');
}

module.exports = { HuellaCorte };

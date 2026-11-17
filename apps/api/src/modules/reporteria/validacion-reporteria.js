/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * HU-038. El ámbito territorial no se acepta en la consulta.
 */
'use strict';

const { ErrorValidacion } = require('../../common/errors');
const { EtiquetaPrioridad, EtiquetaEstado } = require('./definiciones-analiticas');

const CLAVES_PROHIBIDAS = [
  'oficinaLocalId',
  'localOfficeId',
  'regionId',
  'oficina',
  'region',
  'ambito'
];

function Texto(valor) {
  if (valor === undefined || valor === null) {
    return '';
  }
  return String(valor).trim();
}

function RechazarAmbito(consulta) {
  for (const clave of CLAVES_PROHIBIDAS) {
    if (Object.prototype.hasOwnProperty.call(consulta, clave)) {
      throw new ErrorValidacion(
        'La Oficina Local y la región salen de la sesión. No se aceptan en la consulta.'
      );
    }
  }
}

function EnteroOpcional(valor, nombre, minimo, maximo) {
  const texto = Texto(valor);
  if (texto.length === 0) {
    return null;
  }
  if (!/^\d+$/.test(texto)) {
    throw new ErrorValidacion(`El valor de ${nombre} no es válido.`);
  }
  const numero = Number(texto);
  if (numero < minimo || numero > maximo) {
    throw new ErrorValidacion(`El valor de ${nombre} no es válido.`);
  }
  return numero;
}

/**
 * Lee los filtros de reportería. Rechaza un ámbito manipulado.
 *
 * @param {object} consulta Parámetros de la solicitud.
 * @param {number} anioPredeterminado Año de la fecha del servidor.
 * @returns {object} Filtros normalizados.
 */
function LeerFiltrosReporteria(consulta, anioPredeterminado) {
  const origen = consulta && typeof consulta === 'object' ? consulta : {};
  RechazarAmbito(origen);
  const anioTexto = Texto(origen.anio);
  const anio = anioTexto.length === 0
    ? anioPredeterminado
    : EnteroOpcional(anioTexto, 'año', 2000, 2100);
  const estadoTexto = Texto(origen.estado).toUpperCase();
  let estado = 'TODOS';
  if (estadoTexto.length > 0 && estadoTexto !== 'TODOS') {
    if (!EtiquetaEstado(estadoTexto)) {
      throw new ErrorValidacion('El estado debe ser Activo, Cerrado o Todos.');
    }
    estado = estadoTexto;
  }
  const prioridadTexto = Texto(origen.prioridad).toUpperCase();
  if (prioridadTexto.length > 0 && !EtiquetaPrioridad(prioridadTexto)) {
    throw new ErrorValidacion('La prioridad debe ser Alto, Moderado o Bajo.');
  }
  const profesional = Texto(origen.profesional);
  if (profesional.length > 128) {
    throw new ErrorValidacion('El profesional indicado no es válido.');
  }
  const sexo = Texto(origen.sexo);
  if (sexo.length > 80) {
    throw new ErrorValidacion('El sexo indicado no es válido.');
  }
  return {
    anio,
    establecimientoId: EnteroOpcional(origen.establecimientoId, 'establecimiento', 1, 2147483647),
    estado,
    prioridad: prioridadTexto.length === 0 ? null : prioridadTexto,
    disciplinaId: EnteroOpcional(origen.disciplinaId, 'disciplina', 1, 2147483647),
    profesional: profesional.length === 0 ? null : profesional,
    sexo: sexo.length === 0 ? null : sexo,
    edad: EnteroOpcional(origen.edad, 'edad', 0, 120)
  };
}

module.exports = { LeerFiltrosReporteria };

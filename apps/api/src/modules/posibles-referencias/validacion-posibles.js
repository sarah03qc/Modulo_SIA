/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-18.
 * Lectura de la consulta de posibles referencias. No interpreta nutrición.
 */
'use strict';

const { ErrorValidacion } = require('../../common/errors');
const { TAMANO_MAXIMO, TAMANO_PAGINA } = require('./servicio-posibles');

function Entero(valor, predeterminado) {
  if (valor === undefined || valor === null || valor === '') {
    return predeterminado;
  }
  const numero = Number(valor);
  if (!Number.isInteger(numero)) {
    throw new ErrorValidacion('La página o el tamaño no es válido.');
  }
  return numero;
}

/**
 * @param {object} consulta Query de Express.
 * @returns {object} Criterios ya acotados.
 */
function LeerConsulta(consulta) {
  const origen = consulta || {};
  const pagina = Entero(origen.page, 1);
  const tamano = Entero(origen.pageSize, TAMANO_PAGINA);
  if (pagina < 1 || tamano < 1 || tamano > TAMANO_MAXIMO) {
    throw new ErrorValidacion('La página o el tamaño no es válido.');
  }
  const estado = origen.estado || '';
  if (estado && estado !== 'PENDIENTE' && estado !== 'REFERENCIA_CREADA') {
    throw new ErrorValidacion('El estado de gestión no es válido.');
  }
  const fecha = origen.fecha || '';
  if (fecha && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw new ErrorValidacion('La fecha de detección no es válida.');
  }
  let establecimientoId = null;
  if (origen.establecimientoId) {
    establecimientoId = Number(origen.establecimientoId);
    if (!Number.isInteger(establecimientoId) || establecimientoId <= 0) {
      throw new ErrorValidacion('El establecimiento no es válido.');
    }
  }
  return {
    pagina,
    tamano,
    texto: typeof origen.q === 'string' ? origen.q : '',
    estado,
    fecha,
    criterio: typeof origen.criterio === 'string' ? origen.criterio.trim() : '',
    establecimientoId
  };
}

/**
 * @param {string} valor Identificador de ruta.
 * @returns {number} Identificador entero.
 */
function LeerIdentificador(valor) {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new ErrorValidacion('La posible referencia no es válida.');
  }
  return numero;
}

module.exports = {
  LeerConsulta,
  LeerIdentificador
};

/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * HU-027, HU-028, HU-030 y HU-031. HU-029 permanece fuera de alcance.
 * La clave de operación permite repetir un envío sin duplicar el registro.
 */
'use strict';

const { FechaCalendarioLocal } = require('../../common/fecha-local');
const { ErrorValidacion } = require('../../common/errors');

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const ENTERO = /^[1-9][0-9]*$/;
const CLAVE = /^[A-Za-z0-9-]{8,64}$/;
const ENTERO_MAXIMO = 2147483647;
const ANIO_MINIMO = 2000;
const ANIO_MAXIMO = 2100;

function EntradaInvalida(mensaje) {
  throw new ErrorValidacion(mensaje);
}

function Objeto(valor, mensaje) {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) {
    EntradaInvalida(mensaje);
  }
}

function LeerFecha(valor, etiqueta) {
  if (typeof valor !== 'string' || !FECHA.test(valor)) {
    EntradaInvalida(`La ${etiqueta} no es válida.`);
  }
  const anio = Number(valor.slice(0, 4));
  const mes = Number(valor.slice(5, 7));
  const dia = Number(valor.slice(8, 10));
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  const coincide = fecha.getUTCFullYear() === anio
    && fecha.getUTCMonth() === mes - 1
    && fecha.getUTCDate() === dia;
  if (!coincide || anio < ANIO_MINIMO || anio > ANIO_MAXIMO) {
    EntradaInvalida(`La ${etiqueta} no es válida.`);
  }
  const hoy = FechaCalendarioLocal();
  if (valor > hoy) {
    EntradaInvalida(`La ${etiqueta} no puede ser posterior a hoy.`);
  }
  return valor;
}

function LeerEntero(valor, etiqueta, maximo = ENTERO_MAXIMO) {
  const texto = typeof valor === 'number' && Number.isInteger(valor)
    ? String(valor)
    : valor;
  if (typeof texto !== 'string' || !ENTERO.test(texto)) {
    EntradaInvalida(`El dato ${etiqueta} no es válido.`);
  }
  const numero = Number(texto);
  if (!Number.isSafeInteger(numero) || numero > maximo) {
    EntradaInvalida(`El dato ${etiqueta} no es válido.`);
  }
  return numero;
}

function LeerEnteroOpcional(valor, etiqueta, maximo = ENTERO_MAXIMO) {
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }
  return LeerEntero(valor, etiqueta, maximo);
}

function LeerTexto(valor, etiqueta, maximo) {
  if (typeof valor !== 'string') {
    EntradaInvalida(`El dato ${etiqueta} no es válido.`);
  }
  const texto = valor.trim();
  if (texto.length === 0 || texto.length > maximo) {
    EntradaInvalida(`El dato ${etiqueta} no es válido.`);
  }
  return texto;
}

function LeerTextoOpcional(valor, etiqueta, maximo) {
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }
  return LeerTexto(valor, etiqueta, maximo);
}

function LeerClave(valor) {
  if (typeof valor !== 'string' || !CLAVE.test(valor)) {
    EntradaInvalida('La clave de la operación no es válida.');
  }
  return valor;
}

function LeerCasoId(valor) {
  return LeerEntero(valor, 'caso', Number.MAX_SAFE_INTEGER);
}

/**
 * Lee una coordinación. El catálogo, si existe, se resuelve en el servicio.
 *
 * @param {object} valor Cuerpo ya interpretado.
 * @returns {object} Datos de la coordinación.
 */
function LeerCoordinacion(valor) {
  Objeto(valor, 'La coordinación no tiene el formato esperado.');
  return {
    casoId: LeerCasoId(valor.casoId),
    institucionItemId: LeerEnteroOpcional(valor.institucionItemId, 'institución'),
    institucionTexto: LeerTextoOpcional(valor.institucionTexto, 'institución', 200),
    profesional: LeerTextoOpcional(valor.profesional, 'profesional responsable', 200),
    fecha: LeerFecha(valor.fecha, 'fecha de coordinación'),
    motivo: LeerTexto(valor.motivo, 'motivo', 1000),
    estadoItemId: LeerEnteroOpcional(valor.estadoItemId, 'estado'),
    estadoTexto: LeerTextoOpcional(valor.estadoTexto, 'estado', 80),
    claveOperacion: LeerClave(valor.claveOperacion)
  };
}

/**
 * Lee el reporte que se conserva. La vista se arma aparte y no viaja en el cuerpo.
 *
 * @param {object} valor Cuerpo ya interpretado.
 * @returns {object} Tipo, motivo y clave.
 */
function LeerReporte(valor) {
  Objeto(valor, 'El reporte no tiene el formato esperado.');
  return {
    casoId: LeerCasoId(valor.casoId),
    tipoProposito: LeerTexto(valor.tipoProposito, 'tipo o propósito', 200),
    motivo: LeerTextoOpcional(valor.motivo, 'motivo', 1000),
    claveOperacion: LeerClave(valor.claveOperacion)
  };
}

/**
 * Lee el cierre. La oficina y la región de destino no se aceptan del cliente.
 *
 * @param {object} valor Cuerpo ya interpretado.
 * @returns {object} Motivo, fecha, destino y clave.
 */
function LeerCierre(valor) {
  Objeto(valor, 'El cierre no tiene el formato esperado.');
  if (Object.prototype.hasOwnProperty.call(valor, 'destinoOficinaLocalId')
    || Object.prototype.hasOwnProperty.call(valor, 'destinoRegionId')) {
    EntradaInvalida('El destino territorial se resuelve en el servicio.');
  }
  return {
    casoId: LeerCasoId(valor.casoId),
    motivoItemId: LeerEntero(valor.motivoItemId, 'motivo', Number.MAX_SAFE_INTEGER),
    explicacion: LeerTextoOpcional(valor.explicacion, 'explicación', 2000),
    fechaCierre: LeerFecha(valor.fechaCierre, 'fecha de cierre'),
    destinoEstablecimientoId: LeerEnteroOpcional(
      valor.destinoEstablecimientoId,
      'establecimiento de destino'
    ),
    destinoNombre: LeerTextoOpcional(valor.destinoNombre, 'destino', 200),
    claveOperacion: LeerClave(valor.claveOperacion)
  };
}

function LeerCasoDeRuta(valor) {
  return LeerCasoId(valor);
}

module.exports = {
  LeerCierre,
  LeerCasoDeRuta,
  LeerCoordinacion,
  LeerReporte
};

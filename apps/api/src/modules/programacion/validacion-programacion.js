/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * HU-044, RF-075 a RF-080. La oficina y la región no se aceptan del cliente.
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
const TITULO_MAXIMO = 300;
const TEXTO_MAXIMO = 1000;
const MOTIVO_MAXIMO = 500;
const CASOS_MAXIMO = 30;
const EFECTOS = ['REALIZADA', 'REPROGRAMADA', 'CANCELADA'];

function EntradaInvalida(mensaje) {
  throw new ErrorValidacion(mensaje);
}

function Objeto(valor, mensaje) {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) {
    EntradaInvalida(mensaje);
  }
}

function FechaValida(valor, etiqueta) {
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

function LeerEnteroOpcional(valor, etiqueta) {
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }
  return LeerEntero(valor, etiqueta);
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

function RechazarTerritorio(cuerpo) {
  if (cuerpo.oficinaLocalId !== undefined || cuerpo.regionId !== undefined) {
    EntradaInvalida('La oficina y la región salen de la sesión, no de la solicitud.');
  }
}

function LeerCasos(valor) {
  if (valor === undefined || valor === null) {
    return [];
  }
  if (!Array.isArray(valor) || valor.length > CASOS_MAXIMO) {
    EntradaInvalida('Los casos asociados no son válidos.');
  }
  const vistos = new Set();
  return valor.map((item) => {
    const casoId = LeerEntero(item, 'caso');
    if (vistos.has(casoId)) {
      EntradaInvalida('Un caso no puede asociarse dos veces a la misma actividad.');
    }
    vistos.add(casoId);
    return casoId;
  });
}

function LeerActividad(cuerpo) {
  Objeto(cuerpo, 'La actividad no es válida.');
  RechazarTerritorio(cuerpo);
  if (cuerpo.estado !== undefined) {
    EntradaInvalida('La actividad nueva inicia programada.');
  }
  const fecha = FechaValida(cuerpo.fecha, 'fecha prevista');
  const hoy = FechaCalendarioLocal();
  if (fecha < hoy) {
    EntradaInvalida('La fecha prevista de una actividad nueva no puede ser anterior a hoy.');
  }
  return {
    fecha,
    tipoItemId: LeerEntero(cuerpo.tipoItemId, 'tipo'),
    titulo: LeerTexto(cuerpo.titulo, 'título o propósito', TITULO_MAXIMO),
    establecimientoId: LeerEnteroOpcional(cuerpo.establecimientoId, 'establecimiento'),
    observaciones: LeerTextoOpcional(cuerpo.observaciones, 'observaciones', TEXTO_MAXIMO),
    casos: LeerCasos(cuerpo.casos),
    claveOperacion: LeerClave(cuerpo.claveOperacion)
  };
}

function LeerResolucion(cuerpo) {
  Objeto(cuerpo, 'La resolución no es válida.');
  RechazarTerritorio(cuerpo);
  if (!EFECTOS.includes(cuerpo.efecto)) {
    EntradaInvalida('La resolución no es válida.');
  }
  const motivo = LeerTextoOpcional(cuerpo.motivo, 'motivo', MOTIVO_MAXIMO);
  const nuevaFecha = cuerpo.nuevaFecha === undefined || cuerpo.nuevaFecha === null
    || cuerpo.nuevaFecha === ''
    ? null
    : FechaValida(cuerpo.nuevaFecha, 'nueva fecha');
  if (cuerpo.efecto === 'REALIZADA' && (motivo || nuevaFecha)) {
    EntradaInvalida('Marcar realizada no usa motivo ni una fecha nueva.');
  }
  if (cuerpo.efecto === 'CANCELADA' && (!motivo || nuevaFecha)) {
    EntradaInvalida('Cancelar exige motivo y conserva la fecha.');
  }
  if (cuerpo.efecto === 'REPROGRAMADA' && (!motivo || !nuevaFecha)) {
    EntradaInvalida('Reprogramar exige una nueva fecha y un motivo.');
  }
  return {
    efecto: cuerpo.efecto,
    motivo,
    nuevaFecha,
    claveOperacion: LeerClave(cuerpo.claveOperacion)
  };
}

function LeerConsulta(consulta) {
  const origen = consulta || {};
  return {
    establecimientoId: LeerEnteroOpcional(origen.establecimientoId, 'establecimiento'),
    estado: origen.estado === undefined || origen.estado === null || origen.estado === ''
      ? null
      : origen.estado
  };
}

function LeerEstadoFiltro(estado) {
  if (estado === null) {
    return null;
  }
  if (!['PROGRAMADA', 'REALIZADA', 'REPROGRAMADA', 'CANCELADA'].includes(estado)) {
    EntradaInvalida('El estado de la consulta no es válido.');
  }
  return estado;
}

module.exports = {
  LeerActividad,
  LeerResolucion,
  LeerConsulta,
  LeerEstadoFiltro,
  LeerEntero
};

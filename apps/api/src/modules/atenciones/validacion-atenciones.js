/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * Modificación: 2026-11-18. Texto de la estrategia «Otra» y lectura del caso.
 * HU-036 y HU-037. La fecha de atención se distingue de la de registro.
 */
'use strict';

const { ErrorValidacion } = require('../../common/errors');

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const ENTERO = /^[1-9][0-9]*$/;
const ENTERO_MAXIMO = 2147483647;
const ANIO_MINIMO = 2000;
const ANIO_MAXIMO = 2100;
const TEXTO_ACCION = 2000;
const TEXTO_PROXIMA = 500;
const TEXTO_ESTRATEGIA_OTRA = 300;
const TEXTO_TEMA = 500;
const TEXTO_LUGAR = 200;
const TEXTO_USUARIO = 128;
const PROFESIONALES_MAXIMOS = 6;
const PARTICIPANTES_MAXIMOS = 40;

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
  return valor;
}

function LeerEntero(valor, etiqueta) {
  const texto = typeof valor === 'number' && Number.isInteger(valor) ? String(valor) : valor;
  if (typeof texto !== 'string' || !ENTERO.test(texto)) {
    EntradaInvalida(`El dato ${etiqueta} no es válido.`);
  }
  const numero = Number(texto);
  if (!Number.isSafeInteger(numero) || numero > ENTERO_MAXIMO) {
    EntradaInvalida(`El dato ${etiqueta} no es válido.`);
  }
  return numero;
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

function LeerListaEnteros(valor, etiqueta, maximo) {
  if (!Array.isArray(valor) || valor.length === 0 || valor.length > maximo) {
    EntradaInvalida(`El dato ${etiqueta} no es válido.`);
  }
  const vistos = new Set();
  return valor.map((item) => {
    const numero = LeerEntero(item, etiqueta);
    if (vistos.has(numero)) {
      EntradaInvalida(`El dato ${etiqueta} está repetido.`);
    }
    vistos.add(numero);
    return numero;
  });
}

/**
 * Atención individual. El profesional responsable lo fija el servicio
 * con la sesión, no este cuerpo.
 *
 * @param {object} cuerpo Solicitud HTTP.
 * @returns {object} Datos normalizados.
 */
function LeerAtencionIndividual(cuerpo) {
  Objeto(cuerpo, 'La atención no tiene un cuerpo utilizable.');
  const proximaAccion = LeerTextoOpcional(cuerpo.proximaAccion, 'próxima acción', TEXTO_PROXIMA);
  const fechaProxima = cuerpo.fechaProxima === undefined || cuerpo.fechaProxima === null
    || cuerpo.fechaProxima === ''
    ? null
    : LeerFecha(cuerpo.fechaProxima, 'fecha de la próxima acción');
  if (fechaProxima && !proximaAccion) {
    EntradaInvalida('La fecha de la próxima acción exige describir esa acción.');
  }
  return {
    casoId: LeerEntero(cuerpo.casoId, 'caso'),
    fechaAtencion: LeerFecha(cuerpo.fechaAtencion, 'fecha de atención'),
    disciplinaId: LeerEntero(cuerpo.disciplinaId, 'disciplina'),
    estrategiaId: LeerEntero(cuerpo.estrategiaId, 'estrategia'),
    estrategiaOtraTexto: LeerTextoOpcional(
      cuerpo.estrategiaOtraTexto,
      'especificación de la estrategia',
      TEXTO_ESTRATEGIA_OTRA
    ),
    acciones: LeerTexto(cuerpo.acciones, 'acciones', TEXTO_ACCION),
    recomendaciones: LeerTexto(cuerpo.recomendaciones, 'recomendaciones', TEXTO_ACCION),
    proximaAccion,
    fechaProxima
  };
}

function LeerParticipante(valor) {
  Objeto(valor, 'Cada participante debe indicar el caso y la asistencia.');
  if (typeof valor.asistio !== 'boolean') {
    EntradaInvalida('La asistencia de cada participante debe indicarse.');
  }
  return {
    casoId: LeerEntero(valor.casoId, 'caso'),
    asistio: valor.asistio
  };
}

/**
 * Una actividad grupal y sus participantes. No crea una atención por persona.
 *
 * @param {object} cuerpo Solicitud HTTP.
 * @returns {object} Actividad normalizada.
 */
function LeerAtencionGrupal(cuerpo) {
  Objeto(cuerpo, 'La atención grupal no tiene un cuerpo utilizable.');
  if (!Array.isArray(cuerpo.participantes)
    || cuerpo.participantes.length === 0
    || cuerpo.participantes.length > PARTICIPANTES_MAXIMOS) {
    EntradaInvalida('La actividad debe indicar sus participantes.');
  }
  const participantes = cuerpo.participantes.map(LeerParticipante);
  const casos = new Set();
  for (const participante of participantes) {
    if (casos.has(participante.casoId)) {
      EntradaInvalida('Un caso no puede repetirse en la misma actividad.');
    }
    casos.add(participante.casoId);
  }
  const profesionales = Array.isArray(cuerpo.profesionales) ? cuerpo.profesionales : [];
  if (profesionales.length > PROFESIONALES_MAXIMOS) {
    EntradaInvalida('La actividad supera la cantidad de profesionales permitida.');
  }
  return {
    fechaAtencion: LeerFecha(cuerpo.fechaAtencion, 'fecha de atención'),
    tipoId: LeerEntero(cuerpo.tipoId, 'tipo'),
    tema: LeerTexto(cuerpo.tema, 'tema', TEXTO_TEMA),
    lugar: LeerTextoOpcional(cuerpo.lugar, 'lugar', TEXTO_LUGAR),
    acciones: LeerTexto(cuerpo.acciones, 'acciones', TEXTO_ACCION),
    recomendaciones: LeerTexto(cuerpo.recomendaciones, 'recomendaciones', TEXTO_ACCION),
    disciplinas: LeerListaEnteros(cuerpo.disciplinas, 'disciplinas', 12),
    profesionales: profesionales.map((item) => LeerTexto(item, 'profesional', TEXTO_USUARIO)),
    participantes
  };
}

module.exports = {
  LeerAtencionIndividual,
  LeerAtencionGrupal,
  LeerEntero
};

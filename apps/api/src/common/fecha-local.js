/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 *
 * Separa tres momentos:
 * - fecha calendario local, para «hoy» y la consulta analítica;
 * - instante UTC, que conservan los registros históricos ya guardados;
 * - fecha y hora local de presentación, derivada del instante sin recorrerlo.
 *
 * America/Costa_Rica es la zona operativa de este desarrollo: UTC-6, sin
 * horario de verano. La zona institucional definitiva sigue NEEDS_VALIDATION.
 * Esta utilidad no reescribe fechas persistidas.
 */
'use strict';

const ZONA_HORARIA_OPERATIVA = 'America/Costa_Rica';
const ESTADO_ZONA_HORARIA = 'NEEDS_VALIDATION';

function PartesLocales(instante, zona) {
  const formato = new Intl.DateTimeFormat('en-CA', {
    timeZone: zona,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  });
  const mapa = {};
  for (const parte of formato.formatToParts(instante)) {
    if (parte.type !== 'literal') {
      mapa[parte.type] = parte.value;
    }
  }
  if (mapa.hour === '24') {
    mapa.hour = '00';
  }
  return mapa;
}

/**
 * Fecha calendario YYYY-MM-DD en la zona operativa.
 *
 * @param {Date} instante Instante absoluto. No es una fecha ya guardada.
 * @param {string} zona Zona IANA. La predeterminada es la operativa.
 * @returns {string} Fecha local, sin desplazar el día por UTC.
 */
function FechaCalendarioLocal(instante = new Date(), zona = ZONA_HORARIA_OPERATIVA) {
  const partes = PartesLocales(instante, zona);
  return `${partes.year}-${partes.month}-${partes.day}`;
}

/**
 * Fecha y hora local de presentación, sin zona en el texto.
 *
 * @param {Date} instante Instante absoluto.
 * @param {string} zona Zona IANA.
 * @returns {string} YYYY-MM-DDTHH:mm:ss en la zona indicada.
 */
function FechaHoraLocal(instante = new Date(), zona = ZONA_HORARIA_OPERATIVA) {
  const partes = PartesLocales(instante, zona);
  return `${partes.year}-${partes.month}-${partes.day}`
    + `T${partes.hour}:${partes.minute}:${partes.second}`;
}

/**
 * Año calendario local. No usa el año UTC.
 *
 * @param {Date} instante Instante absoluto.
 * @param {string} zona Zona IANA.
 * @returns {number} Año de cuatro dígitos.
 */
function AnioCalendarioLocal(instante = new Date(), zona = ZONA_HORARIA_OPERATIVA) {
  return Number(FechaCalendarioLocal(instante, zona).slice(0, 4));
}

module.exports = {
  ZONA_HORARIA_OPERATIVA,
  ESTADO_ZONA_HORARIA,
  FechaCalendarioLocal,
  FechaHoraLocal,
  AnioCalendarioLocal
};

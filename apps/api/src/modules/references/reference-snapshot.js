'use strict';

const { ageAtReference, blankToNull } = require('./reference-rules');

/**
 * Arma el nombre visible con las partes institucionales disponibles.
 *
 * @param {object} row Fila de persona de la réplica.
 * @returns {string} Nombre compuesto. Vacío si no hay partes.
 */
function fullName(row) {
  return [row.given_name, row.first_surname, row.second_surname]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter((part) => part.length > 0)
    .join(' ');
}

/**
 * Conserva la misma lectura de relación que la ficha institucional.
 * Madre y padre se reconocen por el identificador. Otra relación no se inventa.
 *
 * @param {object} row Fila del encargado.
 * @returns {string|null} MADRE, PADRE o null.
 */
function guardianRelationship(row) {
  if (row.guardian_id && row.mother_id && row.guardian_id === row.mother_id) {
    return 'MADRE';
  }
  if (row.guardian_id && row.father_id && row.guardian_id === row.father_id) {
    return 'PADRE';
  }
  return null;
}

/**
 * Recorta un texto al ancho de la columna histórica.
 *
 * @param {unknown} value Texto de origen.
 * @param {number} maxLength Ancho de la columna.
 * @returns {string|null} Texto utilizable.
 */
function clip(value, maxLength) {
  const text = blankToNull(value);
  if (!text) {
    return null;
  }
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

/**
 * Construye el contexto que se guarda con la referencia y no se vuelve a leer de la réplica.
 * El nombre y el sexo no tienen columna histórica. No se guardan dentro de otro campo.
 *
 * Requisitos: HU-013 CA-27 y RF-116.
 *
 * @param {object} input Fila de persona, servicios, encargado y fecha de referencia.
 * @returns {object} Contexto histórico listo para `ref_contexto` y para la revisión.
 */
function buildHistoricalContext(input) {
  const person = input.person;
  const birthDate = typeof person.birth_date === 'string' ? person.birth_date.slice(0, 10) : null;
  const services = (input.services || [])
    .map((row) => blankToNull(row.service_name))
    .filter(Boolean)
    .join('; ');
  const guardianRows = input.guardianRows || [];
  const guardian = guardianRows.length === 1 ? guardianRows[0] : null;
  const phones = [person.phone_one, person.phone_two]
    .map((value) => blankToNull(value))
    .filter(Boolean)
    .join(' / ');
  return {
    personId: person.person_id,
    establishmentId: Number(person.establishment_id),
    localOfficeId: Number(person.local_office_id),
    regionId: Number(person.region_id),
    guardianName: guardian ? clip(fullName(guardian), 200) : null,
    guardianRelationship: guardian ? guardianRelationship(guardian) : null,
    guardianRelationshipStatus: guardian ? 'CONFIRMADO' : (guardianRows.length > 1 ? 'NEEDS_VALIDATION' : 'ABSENT'),
    contact: clip(phones, 80),
    address: clip(person.address_line, 200),
    servicesText: clip(services, 500),
    regionName: clip(person.region_name, 200),
    localOfficeName: clip(person.local_office_name, 200),
    establishmentName: clip(person.establishment_name, 200),
    ageYears: ageAtReference(birthDate, input.referenceDate),
    birthDate: birthDate && /^\d{4}-\d{2}-\d{2}$/.test(birthDate) ? birthDate : null,
    currentName: fullName(person),
    currentSex: blankToNull(person.sex_name)
  };
}

module.exports = {
  fullName,
  buildHistoricalContext
};

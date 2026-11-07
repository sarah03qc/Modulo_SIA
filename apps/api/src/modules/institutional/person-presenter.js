'use strict';

const { applyFieldPolicy } = require('../../infrastructure/auth/field-policy');

const CASE_FIELDS = Object.freeze([
  'caseId',
  'status',
  'priority',
  'openedOn',
  'closedOn'
]);

function cleanPart(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

function fullName(row) {
  return [row.given_name, row.first_surname, row.second_surname]
    .map(cleanPart)
    .filter((part) => part.length > 0)
    .join(' ');
}

function isoDate(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const text = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return null;
  }
  return text;
}

function completedYears(iso, today) {
  // Edad con la fecha local del proceso. La zona institucional sigue NEEDS_VALIDATION.
  if (!iso) {
    return null;
  }
  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(5, 7));
  const day = Number(iso.slice(8, 10));
  let age = today.getFullYear() - year;
  const currentMonth = today.getMonth() + 1;
  if (currentMonth < month || (currentMonth === month && today.getDate() < day)) {
    age -= 1;
  }
  if (!Number.isInteger(age) || age < 0 || age > 130) {
    return null;
  }
  return age;
}

function textOrNull(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const text = String(value).trim();
  return text.length === 0 ? null : text;
}

function territoryUnit(id, name) {
  if (id === null || id === undefined) {
    return null;
  }
  return {
    id: Number(id),
    name: textOrNull(name)
  };
}

function presentIdentity(row, today) {
  const birthDate = isoDate(row.birth_date);
  return {
    personId: row.person_id,
    fullName: fullName(row),
    birthDate,
    ageYears: completedYears(birthDate, today),
    sex: textOrNull(row.sex_name),
    establishment: territoryUnit(row.establishment_id, row.establishment_name),
    localOffice: territoryUnit(row.local_office_id, row.local_office_name),
    region: territoryUnit(row.region_id, row.region_name)
  };
}

function provenance(periodId) {
  return {
    source: 'SIDINACC_LOCAL',
    periodId: String(periodId),
    integrationStatus: 'NEEDS_VALIDATION'
  };
}

/*
  Propósito: presentar la página de búsqueda sin campos restringidos
  Entrada: modo, página, filas, ámbito y contexto de acceso
  Salida: cuerpo HTTP de la búsqueda contextual
*/
function presentSearch(input) {
  const items = input.rows
    .map((row) => presentIdentity(row, input.today))
    .map((item) => applyFieldPolicy(item, input.access));
  return {
    query: {
      matchMode: input.matchMode,
      page: input.page,
      pageSize: input.pageSize
    },
    scope: input.scope,
    provenance: provenance(input.periodId),
    result: {
      total: input.total,
      returned: items.length,
      message: input.total === 0
        ? 'No hay coincidencias en el ámbito autorizado.'
        : null,
      items
    }
  };
}

function guardianRelationship(row) {
  if (row.guardian_id && row.mother_id && row.guardian_id === row.mother_id) {
    return 'MADRE';
  }
  if (row.guardian_id && row.father_id && row.guardian_id === row.father_id) {
    return 'PADRE';
  }
  // La replica no trae un catalogo para otras relaciones. No se inventa un valor.
  return null;
}

function presentGuardian(rows, contact) {
  if (!rows || rows.length === 0) {
    return {
      availability: 'ABSENT',
      interpretationStatus: 'NEEDS_VALIDATION',
      contextOnly: true,
      person: null,
      contact: null
    };
  }
  if (rows.length > 1) {
    return {
      availability: 'NEEDS_VALIDATION',
      interpretationStatus: 'NEEDS_VALIDATION',
      contextOnly: true,
      person: null,
      contact: null
    };
  }
  const row = rows[0];
  return {
    availability: 'AVAILABLE',
    interpretationStatus: 'NEEDS_VALIDATION',
    contextOnly: true,
    person: {
      personId: row.person_id,
      fullName: fullName(row),
      relationship: guardianRelationship(row)
    },
    contact: {
      address: textOrNull(contact && contact.address_line),
      phoneOne: textOrNull(contact && contact.phone_one),
      phoneTwo: textOrNull(contact && contact.phone_two),
      // Direccion y telefonos son del detalle familiar del periodo, no del encargado.
      scope: 'FAMILIA_PERIODO'
    }
  };
}

function presentServices(rows) {
  return {
    availability: 'AVAILABLE',
    interpretationStatus: 'NEEDS_VALIDATION',
    items: (rows || []).map((row) => ({
      id: Number(row.service_id),
      name: textOrNull(row.service_name)
    }))
  };
}

function presentCases(cases) {
  if (!cases || cases.availability === 'BLOCKED') {
    return {
      availability: 'BLOCKED',
      reasonCode: 'PERMISSION_PENDING',
      source: null,
      visibleCaseCount: null,
      message: 'La consulta de casos autorizados no está disponible para la cuenta técnica actual.',
      items: null
    };
  }
  const items = (cases.items || []).map((item) => ({
    caseId: String(item.caseId),
    status: item.status,
    priority: item.priority,
    openedOn: isoDate(item.openedOn),
    closedOn: isoDate(item.closedOn)
  }));
  return {
    availability: 'AVAILABLE',
    reasonCode: null,
    source: 'SIA_CENCINAI',
    visibleCaseCount: items.length,
    message: items.length === 0
      ? 'No hay casos de Atención Interdisciplinaria visibles en el ámbito autorizado.'
      : null,
    items
  };
}

/*
  Propósito: presentar la ficha básica y retirar los campos que el rol no puede ver
  Entrada: fila institucional, servicios, encargado, resumen de casos y contexto
  Salida: ficha ya filtrada por la política de campos
*/
function presentProfile(input) {
  const identity = presentIdentity(input.person, input.today);
  const cases = presentCases(input.cases);
  return applyFieldPolicy({
    ...identity,
    provenance: provenance(input.periodId),
    familyContext: {
      address: textOrNull(input.person.address_line),
      phoneOne: textOrNull(input.person.phone_one),
      phoneTwo: textOrNull(input.person.phone_two)
    },
    services: presentServices(input.services),
    guardian: presentGuardian(input.guardianRows, input.person),
    interdisciplinaryAttention: cases
  }, input.access);
}

module.exports = {
  CASE_FIELDS,
  completedYears,
  presentSearch,
  presentProfile,
  presentCases
};

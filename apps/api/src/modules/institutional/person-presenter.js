'use strict';

const { AplicarPoliticaCampos } = require('../../infrastructure/auth/field-policy');

const CASE_FIELDS = Object.freeze([
  'caseId',
  'status',
  'priority',
  'openedOn',
  'closedOn'
]);

function LimpiarParte(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

/**
 * Une nombre y apellidos y deja fuera las partes vacías.
 */
function NombreCompleto(row) {
  return [row.given_name, row.first_surname, row.second_surname]
    .map(LimpiarParte)
    .filter((part) => part.length > 0)
    .join(' ');
}

function FechaIso(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const text = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return null;
  }
  return text;
}

/**
 * Calcula los años cumplidos con la fecha local del proceso.
 * Si la fecha no es usable, o la edad queda fuera de un rango razonable, devuelve vacío.
 * La zona horaria institucional sigue pendiente de validación.
 */
function AniosCumplidos(iso, today) {
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

function TextoONulo(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const text = String(value).trim();
  return text.length === 0 ? null : text;
}

function UnidadTerritorial(id, name) {
  if (id === null || id === undefined) {
    return null;
  }
  return {
    id: Number(id),
    name: TextoONulo(name)
  };
}

/**
 * Arma la identidad visible de una persona a partir de la fila institucional.
 * La edad usa la fecha del proceso. Si la fecha de nacimiento no sirve, la edad queda vacía.
 */
function PresentarIdentidad(row, today) {
  const birthDate = FechaIso(row.birth_date);
  return {
    personId: row.person_id,
    fullName: NombreCompleto(row),
    birthDate,
    ageYears: AniosCumplidos(birthDate, today),
    sex: TextoONulo(row.sex_name),
    establishment: UnidadTerritorial(row.establishment_id, row.establishment_name),
    localOffice: UnidadTerritorial(row.local_office_id, row.local_office_name),
    region: UnidadTerritorial(row.region_id, row.region_name)
  };
}

/**
 * Marca de dónde salen los datos de persona: la réplica local y el periodo configurado.
 * El estado de la integración institucional sigue pendiente de validación.
 */
function Procedencia(periodId) {
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
function PresentarBusqueda(input) {
  const items = input.rows
    .map((row) => PresentarIdentidad(row, input.today))
    .map((item) => AplicarPoliticaCampos(item, input.acceso));
  return {
    query: {
      matchMode: input.matchMode,
      page: input.page,
      pageSize: input.pageSize
    },
    scope: input.scope,
    provenance: Procedencia(input.periodId),
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

/**
 * Clasifica la relación cuando el encargado coincide con la madre o el padre.
 * Otra relación no se inventa: la réplica no trae un catálogo para esos casos.
 */
function RelacionEncargado(row) {
  if (row.guardian_id && row.mother_id && row.guardian_id === row.mother_id) {
    return 'MADRE';
  }
  if (row.guardian_id && row.father_id && row.guardian_id === row.father_id) {
    return 'PADRE';
  }
  // La replica no trae un catalogo para otras relaciones. No se inventa un valor.
  return null;
}

/**
 * Presenta al encargado cuando hay una sola fila.
 * Sin filas queda ausente. Con más de una no elige una: informa que la relación
 * necesita validación. El contacto es el de la familia en el periodo.
 */
function PresentarEncargado(rows, contact) {
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
      fullName: NombreCompleto(row),
      relationship: RelacionEncargado(row)
    },
    contact: {
      address: TextoONulo(contact && contact.address_line),
      phoneOne: TextoONulo(contact && contact.phone_one),
      phoneTwo: TextoONulo(contact && contact.phone_two),
      // Direccion y telefonos son del detalle familiar del periodo, no del encargado.
      scope: 'FAMILIA_PERIODO'
    }
  };
}

/**
 * Lista los servicios leídos de la réplica.
 * No los traduce a una regla de atención: su interpretación sigue pendiente de validación.
 */
function PresentarServicios(rows) {
  return {
    availability: 'AVAILABLE',
    interpretationStatus: 'NEEDS_VALIDATION',
    items: (rows || []).map((row) => ({
      id: Number(row.service_id),
      name: TextoONulo(row.service_name)
    }))
  };
}

/**
 * Presenta el resumen de casos de SIA_CENCINAI.
 * Si la lectura vino bloqueada por permiso, no inventa filas ni un conteo.
 */
function PresentarCasos(cases) {
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
    openedOn: FechaIso(item.openedOn),
    closedOn: FechaIso(item.closedOn)
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
function PresentarFicha(input) {
  const identidad = PresentarIdentidad(input.person, input.today);
  const cases = PresentarCasos(input.cases);
  return AplicarPoliticaCampos({
    ...identidad,
    provenance: Procedencia(input.periodId),
    familyContext: {
      address: TextoONulo(input.person.address_line),
      phoneOne: TextoONulo(input.person.phone_one),
      phoneTwo: TextoONulo(input.person.phone_two)
    },
    services: PresentarServicios(input.services),
    guardian: PresentarEncargado(input.guardianRows, input.person),
    interdisciplinaryAttention: cases
  }, input.acceso);
}

module.exports = {
  CASE_FIELDS,
  AniosCumplidos,
  PresentarBusqueda,
  PresentarFicha,
  PresentarCasos
};

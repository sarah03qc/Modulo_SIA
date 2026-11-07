'use strict';

const { InfrastructureError } = require('../../common/errors');

/*
  Lectura parametrizada de SIDINACC_LOCAL.
  La ubicacion sale de CAF_FAMILIA_DETALLE del periodo configurado (spec seccion 6).
  Personas sin familia, como madre, padre o encargado, no entran en la busqueda.
  No se usa CAF_PERSONA_DETALLE para la ubicacion.
  CU-02, CU-03. RF-008, RF-009, RF-011, RF-112, RF-113.
*/

const PERSON_FROM = `
FROM dbo.CAF_PERSONA AS person
INNER JOIN dbo.CAF_FAMILIA_DETALLE AS family_detail
  ON family_detail.FAM_idFamilia = person.FAM_idFamilia
 AND family_detail.RCS_idPeriodo = @periodId
 AND COALESCE(family_detail.BIT_eliminado, 0) = 0
INNER JOIN dbo.RCS_ESTABLECIMIENTO AS establishment
  ON establishment.EST_idEstablecimiento = family_detail.EST_idEstablecimientoActual
 AND establishment.EST_inActivo = 1
 AND COALESCE(establishment.BIT_eliminado, 0) = 0
INNER JOIN dbo.CAF_CAT_OFICINA_LOCAL AS office
  ON office.CAT_idOficinaLocal = establishment.CAT_idOficinaLocal
 AND COALESCE(office.BIT_eliminado, 0) = 0
INNER JOIN dbo.CAF_CAT_REGION AS region
  ON region.CAT_idRegion = office.CAT_idRegion
 AND COALESCE(region.BIT_eliminado, 0) = 0
LEFT JOIN dbo.CAF_CAT_SEXO AS sex
  ON sex.CAT_idSexo = person.CAT_idSexo
 AND COALESCE(sex.BIT_eliminado, 0) = 0
`;

const IDENTITY_COLUMNS = `
  person.PER_idPersona AS person_id,
  person.PER_nombre AS given_name,
  person.PER_apellidoUno AS first_surname,
  person.PER_apellidoDos AS second_surname,
  CONVERT(char(10), person.PER_fechaNacimiento, 23) AS birth_date,
  sex.SNB_descripcion AS sex_name,
  establishment.EST_idEstablecimiento AS establishment_id,
  establishment.EST_descripcion AS establishment_name,
  office.CAT_idOficinaLocal AS local_office_id,
  office.OFL_nombre AS local_office_name,
  region.CAT_idRegion AS region_id,
  region.REG_nombre AS region_name
`;

const CONTACT_COLUMNS = `
  family_detail.FAD_direccion AS address_line,
  CONVERT(varchar(20), family_detail.FAD_telefonoUno) AS phone_one,
  CONVERT(varchar(20), family_detail.FAD_telefonoDos) AS phone_two
`;

const LOCATION_COUNT = `
(
  SELECT COUNT(*)
  FROM dbo.CAF_FAMILIA_DETALLE AS location_rows
  WHERE location_rows.FAM_idFamilia = person.FAM_idFamilia
    AND location_rows.RCS_idPeriodo = @periodId
    AND COALESCE(location_rows.BIT_eliminado, 0) = 0
)`

const NAME_MATCH = `
(
  UPPER(LTRIM(RTRIM(CONCAT(
    COALESCE(person.PER_nombre, N''),
    N' ',
    COALESCE(person.PER_apellidoUno, N''),
    N' ',
    COALESCE(person.PER_apellidoDos, N'')
  )))) LIKE @namePattern ESCAPE '\\'
  OR UPPER(COALESCE(person.PER_nombre, N'')) LIKE @namePattern ESCAPE '\\'
  OR UPPER(COALESCE(person.PER_apellidoUno, N'')) LIKE @namePattern ESCAPE '\\'
  OR UPPER(COALESCE(person.PER_apellidoDos, N'')) LIKE @namePattern ESCAPE '\\'
)
`;

function containsPattern(value) {
  const escaped = value.toUpperCase().replace(/[\\%_[\]]/g, (character) => `\\${character}`);
  return `%${escaped}%`;
}

function bindIdList(columnSql, ids, parameters, prefix) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new InfrastructureError('El ámbito de establecimientos no es utilizable.');
  }
  const names = ids.map((id, index) => {
    if (!Number.isInteger(id) || id <= 0) {
      throw new InfrastructureError('El ámbito de establecimientos no es utilizable.');
    }
    const name = `${prefix}${index}`;
    parameters[name] = id;
    return `@${name}`;
  });
  return `${columnSql} IN (${names.join(', ')})`;
}

function scopeClauses(scope, parameters) {
  const clauses = ['COALESCE(person.BIT_eliminado, 0) = 0'];
  if (scope.regionId !== null && scope.regionId !== undefined) {
    parameters.regionId = scope.regionId;
    clauses.push('region.CAT_idRegion = @regionId');
  }
  if (scope.localOfficeId !== null && scope.localOfficeId !== undefined) {
    parameters.localOfficeId = scope.localOfficeId;
    clauses.push('office.CAT_idOficinaLocal = @localOfficeId');
  }
  if (Array.isArray(scope.establishmentIds)) {
    clauses.push(bindIdList(
      'establishment.EST_idEstablecimiento',
      scope.establishmentIds,
      parameters,
      'establishment'
    ));
  }
  return clauses;
}

function buildPersonWhere(criteria, parameters) {
  parameters.periodId = criteria.periodId;
  const clauses = scopeClauses(criteria.scope, parameters);
  if (criteria.mode !== 'profile') {
    // Mas de un detalle en el periodo no se lista. La ficha informa la ambiguedad.
    clauses.push(`${LOCATION_COUNT} = 1`);
  }
  if (criteria.mode === 'identification') {
    parameters.personId = criteria.text;
    clauses.push('person.PER_idPersona = @personId');
  } else if (criteria.mode === 'name') {
    parameters.namePattern = containsPattern(criteria.text);
    clauses.push(NAME_MATCH);
  } else if (criteria.mode === 'profile') {
    parameters.personId = criteria.personId;
    clauses.push('person.PER_idPersona = @personId');
  } else {
    throw new InfrastructureError('El modo de consulta institucional no es válido.');
  }
  return clauses.join('\n  AND ');
}

function buildPersonCountSql(criteria) {
  const parameters = {};
  const whereSql = buildPersonWhere(criteria, parameters);
  return {
    parameters,
    sql: `SELECT COUNT(*) AS total_matches\n${PERSON_FROM}\nWHERE ${whereSql}`
  };
}

function buildPersonPageSql(criteria) {
  const parameters = {};
  const whereSql = buildPersonWhere(criteria, parameters);
  parameters.rowOffset = criteria.offset;
  parameters.pageSize = criteria.pageSize;
  return {
    parameters,
    sql: `SELECT ${IDENTITY_COLUMNS}\n${PERSON_FROM}\nWHERE ${whereSql}\nORDER BY person.PER_apellidoUno, person.PER_apellidoDos, person.PER_nombre, person.PER_idPersona\nOFFSET @rowOffset ROWS FETCH NEXT @pageSize ROWS ONLY`
  };
}

function buildPersonProfileSql(criteria) {
  const parameters = {};
  const whereSql = buildPersonWhere({ ...criteria, mode: 'profile' }, parameters);
  return {
    parameters,
    sql: `SELECT ${IDENTITY_COLUMNS}, ${CONTACT_COLUMNS}, ${LOCATION_COUNT} AS location_count\n${PERSON_FROM}\nWHERE ${whereSql}\nORDER BY establishment.EST_idEstablecimiento, family_detail.FAD_idFamiliaDetalle`
  };
}

function buildServiceSql() {
  return `
SELECT DISTINCT
  service.SER_idServicio AS service_id,
  service.SER_descripcion AS service_name
FROM dbo.CAF_SERVICIO_CLIENTE AS enrollment
INNER JOIN dbo.CAF_SERVICIO AS service
  ON service.SER_idServicio = enrollment.SER_idServicio
WHERE enrollment.PER_idPersona = @personId
  AND enrollment.RCS_idPeriodo = @periodId
  AND COALESCE(enrollment.BIT_eliminado, 0) = 0
ORDER BY service.SER_descripcion, service.SER_idServicio
`;
}

function buildGuardianSql() {
  return `
SELECT
  guardian.PER_idPersona AS person_id,
  guardian.PER_nombre AS given_name,
  guardian.PER_apellidoUno AS first_surname,
  guardian.PER_apellidoDos AS second_surname,
  minor.MEN_idMadre AS mother_id,
  minor.MEN_idPadre AS father_id,
  minor.MEN_idEncargado AS guardian_id
FROM dbo.CAF_MENOR AS minor
INNER JOIN dbo.CAF_PERSONA AS guardian
  ON guardian.PER_idPersona = minor.MEN_idEncargado
 AND COALESCE(guardian.BIT_eliminado, 0) = 0
WHERE minor.PER_idPersona = @personId
  AND minor.RCS_idPeriodo = @periodId
  AND COALESCE(minor.BIT_eliminado, 0) = 0
ORDER BY guardian.PER_idPersona, minor.MEN_idRegistroMenor
`;
}

function buildEstablishmentLookupSql() {
  return `
SELECT
  establishment.EST_idEstablecimiento AS establishment_id,
  establishment.CAT_idOficinaLocal AS local_office_id,
  region.CAT_idRegion AS region_id
FROM dbo.RCS_ESTABLECIMIENTO AS establishment
INNER JOIN dbo.CAF_CAT_OFICINA_LOCAL AS office
  ON office.CAT_idOficinaLocal = establishment.CAT_idOficinaLocal
 AND COALESCE(office.BIT_eliminado, 0) = 0
INNER JOIN dbo.CAF_CAT_REGION AS region
  ON region.CAT_idRegion = office.CAT_idRegion
 AND COALESCE(region.BIT_eliminado, 0) = 0
WHERE establishment.EST_idEstablecimiento = @establishmentId
  AND establishment.EST_inActivo = 1
  AND COALESCE(establishment.BIT_eliminado, 0) = 0
`;
}

function buildLocalOfficeLookupSql() {
  return `
SELECT
  office.CAT_idOficinaLocal AS local_office_id,
  office.CAT_idRegion AS region_id,
  office.OFL_nombre AS local_office_name
FROM dbo.CAF_CAT_OFICINA_LOCAL AS office
WHERE office.CAT_idOficinaLocal = @localOfficeId
  AND COALESCE(office.BIT_eliminado, 0) = 0
`;
}

function buildRegionLookupSql() {
  return `
SELECT
  region.CAT_idRegion AS region_id,
  region.REG_nombre AS region_name
FROM dbo.CAF_CAT_REGION AS region
WHERE region.CAT_idRegion = @regionId
  AND COALESCE(region.BIT_eliminado, 0) = 0
`;
}

function buildRegionListSql(scope) {
  const parameters = {};
  const restriction = scope && scope.regionId
    ? ' AND region.CAT_idRegion = @regionId'
    : '';
  if (scope && scope.regionId) {
    parameters.regionId = scope.regionId;
  }
  return {
    parameters,
    sql: `
SELECT
  region.CAT_idRegion AS region_id,
  region.REG_nombre AS region_name
FROM dbo.CAF_CAT_REGION AS region
WHERE COALESCE(region.BIT_eliminado, 0) = 0${restriction}
ORDER BY region.REG_nombre, region.CAT_idRegion
`
  };
}

function buildOfficeListSql(scope) {
  const parameters = {};
  const clauses = ['COALESCE(office.BIT_eliminado, 0) = 0'];
  if (scope.regionId) {
    parameters.regionId = scope.regionId;
    clauses.push('office.CAT_idRegion = @regionId');
  }
  if (scope.localOfficeId && !scope.regionId) {
    parameters.localOfficeId = scope.localOfficeId;
    clauses.push('office.CAT_idOficinaLocal = @localOfficeId');
  }
  if (scope.localOfficeId && scope.regionId && scope.onlySelectedOffice) {
    parameters.localOfficeId = scope.localOfficeId;
    clauses.push('office.CAT_idOficinaLocal = @localOfficeId');
  }
  return {
    parameters,
    sql: `
SELECT
  office.CAT_idOficinaLocal AS local_office_id,
  office.OFL_nombre AS local_office_name,
  office.CAT_idRegion AS region_id
FROM dbo.CAF_CAT_OFICINA_LOCAL AS office
WHERE ${clauses.join('\n  AND ')}
ORDER BY office.OFL_nombre, office.CAT_idOficinaLocal
`
  };
}

function buildEstablishmentListSql(scope) {
  const parameters = {};
  const clauses = [
    'establishment.EST_inActivo = 1',
    'COALESCE(establishment.BIT_eliminado, 0) = 0',
    'COALESCE(office.BIT_eliminado, 0) = 0',
    'COALESCE(region.BIT_eliminado, 0) = 0'
  ];
  if (Array.isArray(scope.establishmentIds)) {
    clauses.push(bindIdList(
      'establishment.EST_idEstablecimiento',
      scope.establishmentIds,
      parameters,
      'establishment'
    ));
  } else if (scope.localOfficeId) {
    parameters.localOfficeId = scope.localOfficeId;
    clauses.push('establishment.CAT_idOficinaLocal = @localOfficeId');
  } else {
    throw new InfrastructureError('El listado territorial requiere un ámbito.');
  }
  return {
    parameters,
    sql: `
SELECT
  establishment.EST_idEstablecimiento AS establishment_id,
  establishment.EST_descripcion AS establishment_name,
  office.CAT_idOficinaLocal AS local_office_id,
  office.OFL_nombre AS local_office_name,
  region.CAT_idRegion AS region_id,
  region.REG_nombre AS region_name
FROM dbo.RCS_ESTABLECIMIENTO AS establishment
INNER JOIN dbo.CAF_CAT_OFICINA_LOCAL AS office
  ON office.CAT_idOficinaLocal = establishment.CAT_idOficinaLocal
INNER JOIN dbo.CAF_CAT_REGION AS region
  ON region.CAT_idRegion = office.CAT_idRegion
WHERE ${clauses.join('\n  AND ')}
ORDER BY establishment.EST_descripcion, establishment.EST_idEstablecimiento
`
  };
}

function readTotal(rows) {
  const value = rows && rows[0] ? Number(rows[0].total_matches) : Number.NaN;
  if (!Number.isFinite(value) || value < 0) {
    throw new InfrastructureError('La búsqueda institucional no devolvió un conteo utilizable.');
  }
  return value;
}

function mapEstablishment(row) {
  if (!row) {
    return null;
  }
  return {
    establishmentId: Number(row.establishment_id),
    localOfficeId: Number(row.local_office_id),
    regionId: Number(row.region_id)
  };
}

function mapOffice(row) {
  if (!row) {
    return null;
  }
  return {
    localOfficeId: Number(row.local_office_id),
    regionId: Number(row.region_id),
    name: row.local_office_name
  };
}

function mapRegion(row) {
  if (!row) {
    return null;
  }
  return {
    regionId: Number(row.region_id),
    name: row.region_name
  };
}

function createSidinaccPersonReader(client) {
  return {
    async searchPersons(criteria) {
      const count = buildPersonCountSql(criteria);
      const countRows = await client.query(count.sql, count.parameters);
      const total = readTotal(countRows);
      if (total === 0 || criteria.offset >= total) {
        return { total, items: [] };
      }
      const page = buildPersonPageSql(criteria);
      const items = await client.query(page.sql, page.parameters);
      return { total, items };
    },

    async findPersonInScope(criteria) {
      const statement = buildPersonProfileSql(criteria);
      return client.query(statement.sql, statement.parameters);
    },

    async listServices(criteria) {
      return client.query(buildServiceSql(), {
        personId: criteria.personId,
        periodId: criteria.periodId
      });
    },

    async listGuardianRows(criteria) {
      return client.query(buildGuardianSql(), {
        personId: criteria.personId,
        periodId: criteria.periodId
      });
    },

    async findEstablishment(establishmentId) {
      const rows = await client.query(buildEstablishmentLookupSql(), { establishmentId });
      return mapEstablishment(rows[0]);
    },

    async findLocalOffice(localOfficeId) {
      const rows = await client.query(buildLocalOfficeLookupSql(), { localOfficeId });
      return mapOffice(rows[0]);
    },

    async findRegion(regionId) {
      const rows = await client.query(buildRegionLookupSql(), { regionId });
      return mapRegion(rows[0]);
    },

    async listRegions(scope) {
      const statement = buildRegionListSql(scope);
      const rows = await client.query(statement.sql, statement.parameters);
      return rows.map(mapRegion);
    },

    async listLocalOffices(scope) {
      const statement = buildOfficeListSql(scope);
      const rows = await client.query(statement.sql, statement.parameters);
      return rows.map((row) => ({
        localOfficeId: Number(row.local_office_id),
        regionId: Number(row.region_id),
        name: row.local_office_name
      }));
    },

    async listEstablishments(scope) {
      const statement = buildEstablishmentListSql(scope);
      const rows = await client.query(statement.sql, statement.parameters);
      return rows.map((row) => ({
        establishmentId: Number(row.establishment_id),
        name: row.establishment_name,
        localOfficeId: Number(row.local_office_id),
        localOfficeName: row.local_office_name,
        regionId: Number(row.region_id),
        regionName: row.region_name
      }));
    }
  };
}

function sampleInstitutionalStatements() {
  const scope = {
    regionId: 1,
    localOfficeId: 101,
    establishmentIds: [1100102, 1010320]
  };
  const search = {
    periodId: 2026,
    text: 'Campos',
    scope,
    offset: 0,
    pageSize: 20
  };
  return [
    buildPersonCountSql({ ...search, mode: 'identification' }).sql,
    buildPersonPageSql({ ...search, mode: 'name' }).sql,
    buildPersonProfileSql({ periodId: 2026, personId: 'SYN-1100102-01', scope }).sql,
    buildServiceSql(),
    buildGuardianSql(),
    buildEstablishmentLookupSql(),
    buildLocalOfficeLookupSql(),
    buildRegionLookupSql(),
    buildRegionListSql({}).sql,
    buildRegionListSql({ regionId: 1 }).sql,
    buildOfficeListSql({ regionId: 1 }).sql,
    buildOfficeListSql({ localOfficeId: 101 }).sql,
    buildEstablishmentListSql({ establishmentIds: [1100102, 1010320] }).sql,
    buildEstablishmentListSql({ localOfficeId: 101 }).sql
  ];
}

module.exports = {
  createSidinaccPersonReader,
  sampleInstitutionalStatements,
  containsPattern
};

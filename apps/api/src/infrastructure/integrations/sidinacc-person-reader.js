'use strict';

const { ErrorInfraestructura } = require('../../common/errors');

/*
  Lectura parametrizada de SIDINACC_LOCAL.
  La ubicacion sale de CAF_FAMILIA_DETALLE del periodo configurado (spec seccion 6).
  Personas sin familia, como madre, padre o encargado, no entran en la busqueda.
  No se usa CAF_PERSONA_DETALLE para la ubicacion.
  CU-02, CU-03. RF-008, RF-009, RF-011, RF-112, RF-113.
  Modificación: 2026-11-18. Etiqueta visible de sexo derivada del código CAT_idSexo.
*/

/*
  Solo Hombre y Mujer tienen etiqueta visible. Otro código registrado no se convierte
  en uno de ellos ni muestra la descripción técnica de la réplica.
  NEEDS_VALIDATION: correspondencia de códigos con el catálogo institucional real.
*/
const SEXO_VISIBLE = Object.freeze([
  Object.freeze({ codigo: 'HOMBRE', etiqueta: 'Hombre', codigoInstitucional: 1 }),
  Object.freeze({ codigo: 'MUJER', etiqueta: 'Mujer', codigoInstitucional: 2 })
]);

const SEXO_OTRO_VALOR = Object.freeze({
  codigo: 'OTRO_VALOR_REGISTRADO',
  etiqueta: 'Otro valor registrado'
});

/**
 * Clasifica el código CAT_idSexo de la persona.
 *
 * @param {number|string|null} codigoInstitucional Valor de CAF_PERSONA.CAT_idSexo.
 * @returns {{codigo: string, etiqueta: string}|null} Null cuando no hay valor registrado.
 */
function ClasificarSexo(codigoInstitucional) {
  if (codigoInstitucional === null || codigoInstitucional === undefined) {
    return null;
  }
  const texto = String(codigoInstitucional).trim();
  if (texto.length === 0) {
    return null;
  }
  const encontrado = SEXO_VISIBLE.find((item) => (
    String(item.codigoInstitucional) === texto
  ));
  const clase = encontrado || SEXO_OTRO_VALOR;
  return { codigo: clase.codigo, etiqueta: clase.etiqueta };
}

/**
 * Sustituye la descripción técnica por la etiqueta visible derivada del código.
 */
function NormalizarSexoFila(row) {
  if (!row || typeof row !== 'object') {
    return row;
  }
  const { sex_code: codigoSexo, ...resto } = row;
  const clase = ClasificarSexo(codigoSexo);
  return { ...resto, sex_name: clase ? clase.etiqueta : null };
}

/**
 * Une persona, familia del periodo, establecimiento, oficina y región.
 * La ubicación sale del detalle familiar. Las filas eliminadas
 * y el establecimiento inactivo quedan fuera.
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
`;

const IDENTITY_COLUMNS = `
  person.PER_idPersona AS person_id,
  person.PER_nombre AS given_name,
  person.PER_apellidoUno AS first_surname,
  person.PER_apellidoDos AS second_surname,
  CONVERT(char(10), person.PER_fechaNacimiento, 23) AS birth_date,
  person.CAT_idSexo AS sex_code,
  establishment.EST_idEstablecimiento AS establishment_id,
  establishment.EST_descripcion AS establishment_name,
  office.CAT_idOficinaLocal AS local_office_id,
  office.OFL_nombre AS local_office_name,
  region.CAT_idRegion AS region_id,
  region.REG_nombre AS region_name
`;

/**
 * Dirección y teléfonos del detalle familiar del periodo.
 * No son un dato suelto de la persona ni del encargado.
 */
const CONTACT_COLUMNS = `
  family_detail.FAD_direccion AS address_line,
  CONVERT(varchar(20), family_detail.FAD_telefonoUno) AS phone_one,
  CONVERT(varchar(20), family_detail.FAD_telefonoDos) AS phone_two
`;

/**
 * Cuenta los detalles familiares de la persona en el periodo.
 * La búsqueda exige que haya uno solo. La ficha usa el número para detectar ambigüedad.
 */
const LOCATION_COUNT = `
(
  SELECT COUNT(*)
  FROM dbo.CAF_FAMILIA_DETALLE AS location_rows
  WHERE location_rows.FAM_idFamilia = person.FAM_idFamilia
    AND location_rows.RCS_idPeriodo = @periodId
    AND COALESCE(location_rows.BIT_eliminado, 0) = 0
)`

/**
 * Coincide si el nombre completo, o cualquiera de sus partes, contiene el texto.
 * Los comodines del texto ya vienen escapados.
 */
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

/**
 * Convierte el texto buscado en un patrón de "contiene".
 * Escapa los comodines de la búsqueda para que el nombre se trate como texto literal.
 */
function ContienePatron(value) {
  const escaped = value.toUpperCase().replace(/[\\%_[\]]/g, (character) => `\\${character}`);
  return `%${escaped}%`;
}

/**
 * Arma un filtro IN con un parámetro por establecimiento.
 * Rechaza una lista vacía o un identificador que no sea un entero positivo.
 */
function VincularListaIdentificadores(columnSql, ids, parameters, prefix) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ErrorInfraestructura('El ámbito de establecimientos no es utilizable.');
  }
  const names = ids.map((id, index) => {
    if (!Number.isInteger(id) || id <= 0) {
      throw new ErrorInfraestructura('El ámbito de establecimientos no es utilizable.');
    }
    const name = `${prefix}${index}`;
    parameters[name] = id;
    return `@${name}`;
  });
  return `${columnSql} IN (${names.join(', ')})`;
}

/**
 * Agrega el ámbito al filtro de personas: región, oficina o establecimientos.
 * Siempre excluye personas marcadas como eliminadas.
 */
function ClausulasDeAmbito(scope, parameters) {
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
    clauses.push(VincularListaIdentificadores(
      'establishment.EST_idEstablecimiento',
      scope.establishmentIds,
      parameters,
      'establishment'
    ));
  }
  return clauses;
}

/**
 * Completa el filtro según el modo de consulta.
 *
 * La búsqueda por identificación o por nombre exige una sola ubicación en el periodo.
 * La ficha busca el identificador aunque haya más de una, para poder informar
 * esa ambigüedad en lugar de ocultarla.
 */
function ConstruirFiltroPersona(criteria, parameters) {
  parameters.periodId = criteria.periodId;
  const clauses = ClausulasDeAmbito(criteria.scope, parameters);
  if (criteria.mode !== 'profile') {
    // Mas de un detalle en el periodo no se lista. La ficha informa la ambiguedad.
    clauses.push(`${LOCATION_COUNT} = 1`);
  }
  if (criteria.mode === 'identification') {
    parameters.personId = criteria.text;
    clauses.push('person.PER_idPersona = @personId');
  } else if (criteria.mode === 'name') {
    parameters.namePattern = ContienePatron(criteria.text);
    clauses.push(NAME_MATCH);
  } else if (criteria.mode === 'profile') {
    parameters.personId = criteria.personId;
    clauses.push('person.PER_idPersona = @personId');
  } else {
    throw new ErrorInfraestructura('El modo de consulta institucional no es válido.');
  }
  return clauses.join('\n  AND ');
}

/**
 * Cuenta coincidencias con los mismos filtros de la página, sin traer filas de persona.
 */
function ConstruirSqlConteoPersonas(criteria) {
  const parameters = {};
  const whereSql = ConstruirFiltroPersona(criteria, parameters);
  return {
    parameters,
    sql: `SELECT COUNT(*) AS total_matches\n${PERSON_FROM}\nWHERE ${whereSql}`
  };
}

/**
 * Arma la página de personas, ordenada por apellidos y nombre.
 * El desplazamiento y el tamaño viajan como parámetros.
 */
function ConstruirSqlPaginaPersonas(criteria) {
  const parameters = {};
  const whereSql = ConstruirFiltroPersona(criteria, parameters);
  parameters.rowOffset = criteria.offset;
  parameters.pageSize = criteria.pageSize;
  return {
    parameters,
    sql: `SELECT ${IDENTITY_COLUMNS}\n${PERSON_FROM}\nWHERE ${whereSql}\nORDER BY person.PER_apellidoUno, person.PER_apellidoDos, person.PER_nombre, person.PER_idPersona\nOFFSET @rowOffset ROWS FETCH NEXT @pageSize ROWS ONLY`
  };
}

/**
 * Arma la ficha de una persona, con contacto y la cantidad de ubicaciones del periodo.
 * No exige una sola ubicación: quien llama decide si esa cantidad es ambigua.
 */
function ConstruirSqlFichaPersona(criteria) {
  const parameters = {};
  const whereSql = ConstruirFiltroPersona({ ...criteria, mode: 'profile' }, parameters);
  return {
    parameters,
    sql: `SELECT ${IDENTITY_COLUMNS}, ${CONTACT_COLUMNS}, ${LOCATION_COUNT} AS location_count\n${PERSON_FROM}\nWHERE ${whereSql}\nORDER BY establishment.EST_idEstablecimiento, family_detail.FAD_idFamiliaDetalle`
  };
}

/**
 * Lista los servicios de la persona en el periodo configurado.
 * No vuelve a aplicar el ámbito: la persona ya debió localizarse dentro de él.
 */
function ConstruirSqlServicios() {
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

/**
 * Lee al encargado registrado para la persona y el periodo.
 * La relación de madre o padre se deduce después, comparando identificadores.
 */
function ConstruirSqlEncargado() {
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

/**
 * Busca un establecimiento activo y la oficina y región a las que pertenece.
 * Sirve para comprobar que un filtro territorial sigue dentro del ámbito.
 */
function ConstruirSqlBusquedaEstablecimiento() {
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

/**
 * Busca una oficina local activa y la región a la que pertenece.
 */
function ConstruirSqlBusquedaOficina() {
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

/**
 * Busca una región activa por su identificador.
 */
function ConstruirSqlBusquedaRegion() {
  return `
SELECT
  region.CAT_idRegion AS region_id,
  region.REG_nombre AS region_name
FROM dbo.CAF_CAT_REGION AS region
WHERE region.CAT_idRegion = @regionId
  AND COALESCE(region.BIT_eliminado, 0) = 0
`;
}

/**
 * Lista regiones activas. Si el ámbito trae región, devuelve solo esa.
 */
function ConstruirSqlListaRegiones(scope) {
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

/**
 * Lista oficinas activas dentro del ámbito recibido.
 *
 * Con región, devuelve las oficinas de esa región.
 * Con solo oficina, devuelve esa oficina.
 * Si vienen región y oficina, limita a esa oficina solo cuando
 * onlySelectedOffice está activo. Si no, prevalece la región.
 */
function ConstruirSqlListaOficinas(scope) {
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

/**
 * Lista establecimientos activos.
 * Si el ámbito trae identificadores, usa esa lista.
 * Si no, exige una oficina. Sin ninguno de los dos, no consulta.
 */
function ConstruirSqlListaEstablecimientos(scope) {
  const parameters = {};
  const clauses = [
    'establishment.EST_inActivo = 1',
    'COALESCE(establishment.BIT_eliminado, 0) = 0',
    'COALESCE(office.BIT_eliminado, 0) = 0',
    'COALESCE(region.BIT_eliminado, 0) = 0'
  ];
  if (Array.isArray(scope.establishmentIds)) {
    clauses.push(VincularListaIdentificadores(
      'establishment.EST_idEstablecimiento',
      scope.establishmentIds,
      parameters,
      'establishment'
    ));
  } else if (scope.localOfficeId) {
    parameters.localOfficeId = scope.localOfficeId;
    clauses.push('establishment.CAT_idOficinaLocal = @localOfficeId');
  } else {
    throw new ErrorInfraestructura('El listado territorial requiere un ámbito.');
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

/**
 * Lee el conteo devuelto por la búsqueda.
 * Un valor ausente o negativo se trata como fallo de la consulta.
 */
function LeerTotal(rows) {
  const value = rows && rows[0] ? Number(rows[0].total_matches) : Number.NaN;
  if (!Number.isFinite(value) || value < 0) {
    throw new ErrorInfraestructura('La búsqueda institucional no devolvió un conteo utilizable.');
  }
  return value;
}

/**
 * Pasa la fila de catálogo a identificadores numéricos.
 * Si la consulta no devolvió fila, el resultado es null: la unidad no está activa o no existe.
 */
function MapearEstablecimiento(row) {
  if (!row) {
    return null;
  }
  return {
    establishmentId: Number(row.establishment_id),
    localOfficeId: Number(row.local_office_id),
    regionId: Number(row.region_id)
  };
}

/**
 * Devuelve la oficina activa, o null si la consulta no trajo fila.
 */
function MapearOficina(row) {
  if (!row) {
    return null;
  }
  return {
    localOfficeId: Number(row.local_office_id),
    regionId: Number(row.region_id),
    name: row.local_office_name
  };
}

/**
 * Devuelve la región activa, o null si la consulta no trajo fila.
 */
function MapearRegion(row) {
  if (!row) {
    return null;
  }
  return {
    regionId: Number(row.region_id),
    name: row.region_name
  };
}

/**
 * Sexo y nacimiento de identificadores ya acotados por SIA.
 * No devuelve nombre, identificación visible ni ubicación.
 * La lista va parametrizada. No se concatena el identificador.
 */
function ConstruirSqlSexoYNacimiento(identificadores) {
  if (!Array.isArray(identificadores) || identificadores.length === 0) {
    throw new ErrorInfraestructura('La lectura demográfica no tiene identificadores.');
  }
  const parameters = {};
  const nombres = identificadores.map((identificador, indice) => {
    const usable = typeof identificador === 'string'
      && identificador.length > 0
      && identificador.length <= 20;
    if (!usable) {
      throw new ErrorInfraestructura('Un identificador demográfico no es utilizable.');
    }
    const nombre = `persona${indice}`;
    parameters[nombre] = identificador;
    return `@${nombre}`;
  });
  return {
    parameters,
    sql: `
SELECT
  person.PER_idPersona AS person_id,
  person.CAT_idSexo AS sex_code,
  CONVERT(char(10), person.PER_fechaNacimiento, 23) AS birth_date
FROM dbo.CAF_PERSONA AS person
WHERE COALESCE(person.BIT_eliminado, 0) = 0
  AND person.PER_idPersona IN (${nombres.join(', ')})
`
  };
}

/**
 * Lecturas de personas y territorio sobre SIDINACC_LOCAL.
 * Todas pasan por el cliente de solo lectura y no modifican la réplica.
 */
function CrearLectorPersonasSidinacc(client) {
  return {
    /**
     * Busca personas y devuelve el total junto con la página pedida.
     * Si no hay coincidencias, o la página queda fuera del total, la lista va vacía.
     */
    async BuscarPersonas(criteria) {
      const count = ConstruirSqlConteoPersonas(criteria);
      const countRows = await client.query(count.sql, count.parameters);
      const total = LeerTotal(countRows);
      if (total === 0 || criteria.offset >= total) {
        return { total, items: [] };
      }
      const page = ConstruirSqlPaginaPersonas(criteria);
      const items = await client.query(page.sql, page.parameters);
      return { total, items: items.map(NormalizarSexoFila) };
    },

    /**
     * Lee las filas de ficha de una persona dentro del ámbito.
     * Puede devolver más de una cuando la ubicación del periodo es ambigua.
     */
    async BuscarPersonaEnAmbito(criteria) {
      const statement = ConstruirSqlFichaPersona(criteria);
      const rows = await client.query(statement.sql, statement.parameters);
      return rows.map(NormalizarSexoFila);
    },

    /**
     * Servicios de la persona en el periodo.
     * No vuelve a comprobar el ámbito territorial.
     */
    async ListarServicios(criteria) {
      return client.query(ConstruirSqlServicios(), {
        personId: criteria.personId,
        periodId: criteria.periodId
      });
    },

    /**
     * Filas del encargado de la persona en el periodo.
     * No vuelve a comprobar el ámbito territorial.
     */
    async ListarFilasEncargado(criteria) {
      return client.query(ConstruirSqlEncargado(), {
        personId: criteria.personId,
        periodId: criteria.periodId
      });
    },

    /**
     * Busca un establecimiento activo. Devuelve null si no existe o no está activo.
     */
    async BuscarEstablecimiento(establishmentId) {
      const rows = await client.query(ConstruirSqlBusquedaEstablecimiento(), { establishmentId });
      return MapearEstablecimiento(rows[0]);
    },

    /**
     * Busca una oficina activa. Devuelve null si no existe.
     */
    async BuscarOficinaLocal(localOfficeId) {
      const rows = await client.query(ConstruirSqlBusquedaOficina(), { localOfficeId });
      return MapearOficina(rows[0]);
    },

    /**
     * Busca una región activa. Devuelve null si no existe.
     */
    async BuscarRegion(regionId) {
      const rows = await client.query(ConstruirSqlBusquedaRegion(), { regionId });
      return MapearRegion(rows[0]);
    },

    /**
     * Lista las regiones que el ámbito permite ver.
     */
    async ListarRegiones(scope) {
      const statement = ConstruirSqlListaRegiones(scope);
      const rows = await client.query(statement.sql, statement.parameters);
      return rows.map(MapearRegion);
    },

    /**
     * Lista las oficinas que el ámbito permite ver.
     */
    async ListarOficinasLocales(scope) {
      const statement = ConstruirSqlListaOficinas(scope);
      const rows = await client.query(statement.sql, statement.parameters);
      return rows.map((row) => ({
        localOfficeId: Number(row.local_office_id),
        regionId: Number(row.region_id),
        name: row.local_office_name
      }));
    },

    /**
     * Lista los establecimientos activos del ámbito recibido.
     */
    /**
     * Lee solo sexo y fecha de nacimiento. La reportería agrega después.
     * Una lista vacía no consulta. No devuelve el nombre.
     */
    async LeerSexoYNacimiento(identificadores) {
      if (!Array.isArray(identificadores) || identificadores.length === 0) {
        return [];
      }
      const statement = ConstruirSqlSexoYNacimiento(identificadores);
      const rows = await client.query(statement.sql, statement.parameters);
      return rows.map((row) => {
        const clase = ClasificarSexo(row.sex_code);
        return {
          personId: row.person_id === null || row.person_id === undefined
            ? null
            : String(row.person_id),
          sexCode: clase ? clase.codigo : null,
          sexName: clase ? clase.etiqueta : null,
          birthDate: row.birth_date ? String(row.birth_date).slice(0, 10) : null
        };
      });
    },

    async ListarEstablecimientos(scope) {
      const statement = ConstruirSqlListaEstablecimientos(scope);
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

/**
 * Arma ejemplos de las consultas de este lector, con datos sintéticos.
 * Sirven para comprobar que siguen siendo lecturas de una sola sentencia.
 * No se ejecutan contra la base desde aquí.
 */
function EjemplosSentenciasInstitucionales() {
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
    ConstruirSqlConteoPersonas({ ...search, mode: 'identification' }).sql,
    ConstruirSqlPaginaPersonas({ ...search, mode: 'name' }).sql,
    ConstruirSqlFichaPersona({ periodId: 2026, personId: 'SYN-1100102-01', scope }).sql,
    ConstruirSqlServicios(),
    ConstruirSqlEncargado(),
    ConstruirSqlBusquedaEstablecimiento(),
    ConstruirSqlBusquedaOficina(),
    ConstruirSqlBusquedaRegion(),
    ConstruirSqlListaRegiones({}).sql,
    ConstruirSqlListaRegiones({ regionId: 1 }).sql,
    ConstruirSqlListaOficinas({ regionId: 1 }).sql,
    ConstruirSqlListaOficinas({ localOfficeId: 101 }).sql,
    ConstruirSqlListaEstablecimientos({ establishmentIds: [1100102, 1010320] }).sql,
    ConstruirSqlListaEstablecimientos({ localOfficeId: 101 }).sql,
    ConstruirSqlSexoYNacimiento(['SYN-1100102-01', 'SYN-1100102-02']).sql
  ];
}

module.exports = {
  CrearLectorPersonasSidinacc,
  EjemplosSentenciasInstitucionales,
  ContienePatron,
  ClasificarSexo,
  SEXO_VISIBLE,
  SEXO_OTRO_VALOR
};

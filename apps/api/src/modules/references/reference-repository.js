'use strict';

const sql = require('mssql');
const { InfrastructureError } = require('../../common/errors');
const { SqlExecutionError } = require('../../infrastructure/database/sql-client');
const { ACCESS_LEVEL } = require('../../infrastructure/auth/institutional-roles');

const ACTIVE_CASE_SQL_NUMBER = 52110;

/**
 * Envuelve un valor con el tipo SQL que debe viajar, incluso cuando es NULL.
 *
 * @param {object} type Tipo de mssql.
 * @param {unknown} value Valor ya validado.
 * @returns {{type: object, value: unknown}} Parámetro tipado.
 */
function typed(type, value) {
  return { type, value: value === undefined ? null : value };
}

/**
 * Traduce un fallo del motor a un código que el servicio puede convertir en HTTP.
 * El texto del motor no se reenvía.
 *
 * @param {Error} error Error de la transacción.
 * @returns {Error} Error con `code` de dominio o el error original si no es reconocible.
 */
function toDomainError(error) {
  const sqlNumber = error && (error.sqlNumber || (error instanceof SqlExecutionError ? error.sqlNumber : null));
  const failure = new Error('La persistencia de la referencia no se completó.');
  failure.sqlNumber = sqlNumber;
  if (sqlNumber === ACTIVE_CASE_SQL_NUMBER) {
    failure.code = 'ACTIVE_CASE';
    return failure;
  }
  if (sqlNumber === 2601 || sqlNumber === 2627) {
    failure.code = 'DUPLICATE_CONSECUTIVE';
    return failure;
  }
  if (sqlNumber === 1205) {
    failure.code = 'DEADLOCK';
    failure.retryable = true;
    return failure;
  }
  if (error && error.permissionDenied) {
    failure.code = 'PERMISSION';
    return failure;
  }
  if (sqlNumber === 52112) {
    failure.code = 'DRAFT_MISMATCH';
    return failure;
  }
  if (sqlNumber === 547 || sqlNumber === 515 || sqlNumber === 2628) {
    failure.code = 'CONSTRAINT';
    return failure;
  }
  return error;
}

/**
 * Arma el predicado territorial sobre la tabla de referencia.
 * El ámbito se aplica en SQL. No se recupera el universo para filtrarlo después.
 *
 * @param {object} scope Ámbito ya resuelto.
 * @param {object} parameters Parámetros de la sentencia.
 * @param {string[]} clauses Cláusulas WHERE en construcción.
 * @returns {void}
 * @throws {InfrastructureError} Cuando el nivel no tiene una regla de referencias.
 */
function appendScope(scope, parameters, clauses) {
  if (!scope || scope.accessLevel === ACCESS_LEVEL.ESTABLISHMENT) {
    const ids = scope && scope.establishmentIds;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new InfrastructureError('El ámbito de establecimientos no es utilizable.');
    }
    const names = ids.map((id, index) => {
      const name = `scopeEstablishment${index}`;
      parameters[name] = typed(sql.Int, id);
      return `@${name}`;
    });
    clauses.push(`ref.establecimiento_id IN (${names.join(', ')})`);
    return;
  }
  if (scope.accessLevel === ACCESS_LEVEL.LOCAL_OFFICE) {
    parameters.scopeOffice = typed(sql.Int, scope.localOfficeId);
    parameters.scopeRegion = typed(sql.Int, scope.regionId);
    clauses.push('ref.oficina_local_id = @scopeOffice');
    clauses.push('ref.region_id = @scopeRegion');
    if (Array.isArray(scope.establishmentIds) && scope.establishmentIds.length > 0) {
      const names = scope.establishmentIds.map((id, index) => {
        const name = `scopeEstablishment${index}`;
        parameters[name] = typed(sql.Int, id);
        return `@${name}`;
      });
      clauses.push(`ref.establecimiento_id IN (${names.join(', ')})`);
    }
    return;
  }
  throw new InfrastructureError('El nivel de acceso no tiene una consulta de referencias confirmada.');
}

/**
 * Escapa comodines de LIKE para que el texto buscado sea literal.
 *
 * @param {string} value Texto de búsqueda.
 * @returns {string} Patrón contiene, con escape.
 */
function containsLike(value) {
  const escaped = value.toUpperCase().replace(/[\\%_[\]]/g, (character) => `\\${character}`);
  return `%${escaped}%`;
}

/**
 * Construye el listado y su conteo con los mismos filtros.
 * La búsqueda por nombre no entra aquí: el servicio resuelve identificadores antes.
 *
 * Requisitos: HU-015, HU-018 en su consulta, RF-015, RF-031 y RF-032.
 *
 * @param {object} criteria Filtros, ámbito y página.
 * @returns {{listSql: string, countSql: string, parameters: object}} Sentencias parametrizadas.
 */
function buildReferenceListQuery(criteria) {
  const parameters = {};
  const clauses = ['1 = 1'];
  appendScope(criteria.scope, parameters, clauses);
  if (Array.isArray(criteria.personIds)) {
    if (criteria.personIds.length === 0) {
      clauses.push('1 = 0');
    } else {
      const names = criteria.personIds.map((personId, index) => {
        const name = `personMatch${index}`;
        parameters[name] = typed(sql.NVarChar(20), personId);
        return `@${name}`;
      });
      clauses.push(`ref.per_id_persona IN (${names.join(', ')})`);
    }
  }
  if (criteria.identification) {
    parameters.identification = typed(sql.NVarChar(20), criteria.identification);
    clauses.push('ref.per_id_persona = @identification');
  }
  if (criteria.consecutive) {
    parameters.consecutivePattern = typed(sql.NVarChar(80), containsLike(criteria.consecutive));
    clauses.push("UPPER(ref.consecutivo) LIKE @consecutivePattern ESCAPE '\\'");
  }
  if (criteria.status) {
    parameters.status = typed(sql.NVarChar(30), criteria.status);
    clauses.push('ref.estado = @status');
  }
  if (criteria.attentionRoute) {
    parameters.attentionRoute = typed(sql.NVarChar(80), criteria.attentionRoute);
    clauses.push('via.codigo = @attentionRoute');
  }
  if (criteria.origin) {
    parameters.origin = typed(sql.NVarChar(80), criteria.origin);
    clauses.push('origin.codigo = @origin');
  }
  if (Array.isArray(criteria.motiveCodes) && criteria.motiveCodes.length > 0) {
    const names = criteria.motiveCodes.map((code, index) => {
      const name = `motiveCode${index}`;
      parameters[name] = typed(sql.NVarChar(80), code);
      return `@${name}`;
    });
    clauses.push(`EXISTS (
      SELECT 1
      FROM dbo.ref_motivo AS motive_filter
      INNER JOIN dbo.cat_item AS motive_item
        ON motive_item.cat_item_id = motive_filter.cat_item_id
       AND motive_item.codigo_catalogo = motive_filter.motivo_catalogo
      WHERE motive_filter.referencia_id = ref.referencia_id
        AND motive_item.codigo IN (${names.join(', ')})
    )`);
  }
  parameters.rowOffset = typed(sql.Int, criteria.offset);
  parameters.pageSize = typed(sql.Int, criteria.pageSize);
  const whereSql = clauses.join('\n  AND ');
  const fromSql = `
FROM dbo.ref_referencia AS ref
INNER JOIN dbo.ref_contexto AS context
  ON context.referencia_id = ref.referencia_id
INNER JOIN dbo.cat_item AS via
  ON via.cat_item_id = ref.via_item_id
 AND via.codigo_catalogo = ref.via_catalogo
INNER JOIN dbo.cat_item AS origin
  ON origin.cat_item_id = ref.origen_item_id
 AND origin.codigo_catalogo = ref.origen_catalogo
WHERE ${whereSql}`;
  return {
    parameters,
    countSql: `SELECT COUNT(*) AS total_matches\n${fromSql}`,
    listSql: `
SELECT
  ref.referencia_id,
  ref.consecutivo,
  ref.per_id_persona,
  ref.estado,
  ref.responsable_usuario,
  CONVERT(char(19), ref.enviada_en, 120) AS enviada_en,
  ref.establecimiento_id,
  context.establecimiento_nombre,
  via.codigo AS via_codigo,
  via.etiqueta AS via_etiqueta,
  origin.codigo AS origen_codigo
${fromSql}
ORDER BY ref.enviada_en DESC, ref.referencia_id DESC
OFFSET @rowOffset ROWS FETCH NEXT @pageSize ROWS ONLY`
  };
}

/**
 * Sentencia que bloquea el vínculo, impide el caso activo y inserta la referencia.
 * El consecutivo ya viene validado. El índice único rechaza el duplicado concurrente.
 * Si el vínculo todavía no existe, se crea en la misma transacción.
 * Un caso activo produce el error 52110 y no devuelve columnas del expediente.
 *
 * Contrato: envío de referencia en docs de transacciones. HU-013 CA-28 a CA-31. RF-021 y RF-030.
 */
const INSERT_REFERENCE_SQL = `
SET NOCOUNT ON;
SET XACT_ABORT OFF;
DECLARE @ahora datetime2(0) = CAST(SYSUTCDATETIME() AS datetime2(0));
DECLARE @vinculo nvarchar(20);

SELECT @vinculo = per_id_persona
FROM dbo.vinculo_persona WITH (UPDLOCK, HOLDLOCK)
WHERE per_id_persona = @personId;

IF @vinculo IS NULL
BEGIN
  BEGIN TRY
    INSERT INTO dbo.vinculo_persona (per_id_persona, primera_operacion_en)
    VALUES (@personId, @ahora);
  END TRY
  BEGIN CATCH
    IF ERROR_NUMBER() <> 2627 OR XACT_STATE() <> 1
      THROW;
    SELECT @vinculo = per_id_persona
    FROM dbo.vinculo_persona WITH (UPDLOCK, HOLDLOCK)
    WHERE per_id_persona = @personId;
    IF @vinculo IS NULL
      THROW 52111, N'VINCULO', 1;
  END CATCH
END

IF EXISTS (
  SELECT 1
  FROM dbo.caso_lista_establecimiento
  WHERE per_id_persona = @personId
    AND estado = N'ACTIVO'
)
  THROW 52110, N'ACTIVE_CASE', 1;

INSERT INTO dbo.ref_referencia (
  per_id_persona,
  estado,
  fecha_referencia,
  via_item_id,
  via_catalogo,
  origen_item_id,
  origen_catalogo,
  responsable_usuario,
  acciones_previas,
  resultados_previos,
  informacion_complementaria,
  origen_captura,
  plantilla_version,
  consecutivo,
  establecimiento_id,
  oficina_local_id,
  region_id,
  enviada_en,
  enviada_por,
  creada_en,
  creada_por
)
OUTPUT
  inserted.referencia_id,
  CONVERT(char(19), inserted.enviada_en, 120) AS enviada_en
VALUES (
  @personId,
  N'PENDIENTE_REVISION',
  @referenceDate,
  @routeItemId,
  N'VIA_ATENCION',
  @originItemId,
  N'ORIGEN_REFERENCIA',
  @responsible,
  @previousActions,
  @previousResults,
  @complementaryInformation,
  @captureOrigin,
  @templateVersion,
  @consecutive,
  @establishmentId,
  @localOfficeId,
  @regionId,
  @ahora,
  @responsible,
  @ahora,
  @responsible
);
`;

const INSERT_CONTEXT_SQL = `
INSERT INTO dbo.ref_contexto (
  referencia_id,
  encargado_nombre,
  relacion_encargado,
  contacto,
  direccion,
  servicios_texto,
  region_nombre,
  oficina_local_nombre,
  establecimiento_nombre,
  edad_anios,
  fecha_nacimiento_informada
)
VALUES (
  @referenceId,
  @guardianName,
  @guardianRelationship,
  @contact,
  @address,
  @servicesText,
  @regionName,
  @localOfficeName,
  @establishmentName,
  @ageYears,
  @birthDate
);
`;

const INSERT_MOTIVE_SQL = `
INSERT INTO dbo.ref_motivo (
  referencia_id,
  cat_item_id,
  motivo_catalogo,
  especificacion
)
VALUES (
  @referenceId,
  @itemId,
  N'MOTIVO_REFERENCIA',
  @specification
);
`;

/*
 * Al confirmar, solo se elimina el borrador del autor para la persona referida.
 * Si el identificador apunta a otro borrador del mismo autor, la transacción aborta
 * y ese borrador permanece. HU-013. El borrador no es una referencia enviada.
 */
const DELETE_DRAFT_SQL = `
IF @draftId IS NOT NULL
   AND NOT EXISTS (
     SELECT 1
     FROM dbo.bor_captura
     WHERE borrador_id = @draftId
       AND usuario = @responsible
       AND flujo = N'REFERENCIA'
       AND clave_negocio = @personId
   )
  THROW 52112, N'DRAFT_MISMATCH', 1;

DELETE FROM dbo.bor_captura
WHERE usuario = @responsible
  AND flujo = N'REFERENCIA'
  AND clave_negocio = @personId;
`;

const INSERT_AUDIT_SQL = `
INSERT INTO dbo.aud_evento (
  ocurrido_en,
  usuario,
  rol,
  accion,
  entidad,
  entidad_id,
  ambito,
  codigo_cambio
)
VALUES (
  CAST(SYSUTCDATETIME() AS datetime2(0)),
  @responsible,
  @role,
  @action,
  N'ref_referencia',
  @entityId,
  @scopeText,
  @changeCode
);
`;

/**
 * Crea el acceso a referencias, borradores, catálogo e impresiones.
 * Las escrituras del envío comparten una transacción. La impresión no actualiza la referencia.
 *
 * @param {object} client Cliente SQL de SIA_CENCINAI.
 * @returns {object} Operaciones de persistencia.
 */
function createReferenceRepository(client) {
  /**
   * Exige el cliente antes de abrir una sentencia.
   *
   * @returns {void}
   * @throws {InfrastructureError} Cuando la base del módulo no está inyectada.
   */
  function requireClient() {
    if (!client || typeof client.query !== 'function') {
      throw new InfrastructureError('La base del módulo no está disponible.');
    }
  }

  /**
   * Ejecuta una lectura y traduce la denegación de permiso.
   *
   * @param {string} sqlText Sentencia parametrizada.
   * @param {object} parameters Parámetros.
   * @returns {Promise<object[]>} Filas.
   */
  async function read(sqlText, parameters) {
    requireClient();
    try {
      return await client.query(sqlText, parameters);
    } catch (error) {
      if (error && error.permissionDenied) {
        const failure = new Error('La persistencia de la referencia no se completó.');
        failure.code = 'PERMISSION';
        throw failure;
      }
      throw error;
    }
  }

  return {
    buildReferenceListQuery,

    /**
     * Lee vías, orígenes y motivos de la versión vigente y activa.
     *
     * @returns {Promise<object[]>} Ítems de catálogo.
     */
    async listCatalog() {
      return read(`
SELECT
  item.cat_item_id,
  item.codigo_catalogo,
  item.codigo,
  item.etiqueta,
  item.orden
FROM dbo.cat_item AS item
INNER JOIN dbo.cat_version AS catalog_version
  ON catalog_version.cat_version_id = item.cat_version_id
 AND catalog_version.codigo_catalogo = item.codigo_catalogo
WHERE catalog_version.vigente = 1
  AND item.activo = 1
  AND item.codigo_catalogo IN (N'VIA_ATENCION', N'ORIGEN_REFERENCIA', N'MOTIVO_REFERENCIA')
ORDER BY item.codigo_catalogo, item.orden, item.codigo
`);
    },

    /**
     * Indica si la persona tiene un caso activo, sin devolver el expediente.
     * Sirve a la validación previa. El envío vuelve a comprobarlo dentro de la transacción.
     *
     * @param {string} personId Identificador institucional.
     * @returns {Promise<boolean>} true cuando existe un caso ACTIVO.
     */
    async personHasActiveCase(personId) {
      const rows = await read(`
SELECT CASE WHEN EXISTS (
  SELECT 1
  FROM dbo.caso_lista_establecimiento
  WHERE per_id_persona = @personId
    AND estado = N'ACTIVO'
) THEN 1 ELSE 0 END AS active_case
`, { personId: typed(sql.NVarChar(20), personId) });
      return Boolean(rows[0] && Number(rows[0].active_case) === 1);
    },

    /**
     * Consulta la página de referencias del ámbito.
     *
     * @param {object} criteria Filtros ya cerrados por el servicio.
     * @returns {Promise<{total: number, items: object[]}>} Conteo y página.
     */
    async listReferences(criteria) {
      const statement = buildReferenceListQuery(criteria);
      const counts = await read(statement.countSql, statement.parameters);
      const total = counts[0] ? Number(counts[0].total_matches) : 0;
      if (total === 0 || criteria.offset >= total) {
        return { total, items: [] };
      }
      const items = await read(statement.listSql, statement.parameters);
      return { total, items };
    },

    /**
     * Lee la cabecera y el contexto si la referencia está dentro del ámbito.
     * Fuera de ámbito no devuelve fila. No indica si existe en otro lado.
     *
     * @param {number} referenceId Identificador técnico.
     * @param {object} scope Ámbito autorizado.
     * @returns {Promise<object|null>} Fila o null.
     */
    async findReference(referenceId, scope) {
      const parameters = { referenceId: typed(sql.BigInt, referenceId) };
      const clauses = ['ref.referencia_id = @referenceId'];
      appendScope(scope, parameters, clauses);
      const rows = await read(`
SELECT
  ref.referencia_id,
  ref.consecutivo,
  ref.per_id_persona,
  ref.estado,
  CONVERT(char(10), ref.fecha_referencia, 23) AS fecha_referencia,
  CONVERT(char(19), ref.enviada_en, 120) AS enviada_en,
  ref.responsable_usuario,
  ref.enviada_por,
  ref.acciones_previas,
  ref.resultados_previos,
  ref.informacion_complementaria,
  ref.origen_captura,
  ref.plantilla_version,
  ref.establecimiento_id,
  ref.oficina_local_id,
  ref.region_id,
  via.codigo AS via_codigo,
  via.etiqueta AS via_etiqueta,
  origin.codigo AS origen_codigo,
  origin.etiqueta AS origen_etiqueta,
  context.encargado_nombre,
  context.relacion_encargado,
  context.contacto,
  context.direccion,
  context.servicios_texto,
  context.region_nombre,
  context.oficina_local_nombre,
  context.establecimiento_nombre,
  context.edad_anios,
  CONVERT(char(10), context.fecha_nacimiento_informada, 23) AS fecha_nacimiento_informada
FROM dbo.ref_referencia AS ref
INNER JOIN dbo.ref_contexto AS context
  ON context.referencia_id = ref.referencia_id
INNER JOIN dbo.cat_item AS via
  ON via.cat_item_id = ref.via_item_id
 AND via.codigo_catalogo = ref.via_catalogo
INNER JOIN dbo.cat_item AS origin
  ON origin.cat_item_id = ref.origen_item_id
 AND origin.codigo_catalogo = ref.origen_catalogo
WHERE ${clauses.join('\n  AND ')}
`, parameters);
      return rows[0] || null;
    },

    /**
     * Lee los motivos de una referencia que ya pasó el filtro de ámbito.
     *
     * @param {number} referenceId Identificador técnico.
     * @param {object} scope Ámbito autorizado. Se repite para no leer motivos ajenos.
     * @returns {Promise<object[]>} Motivos y especificaciones.
     */
    async listMotives(referenceId, scope) {
      const parameters = { referenceId: typed(sql.BigInt, referenceId) };
      const clauses = ['ref.referencia_id = @referenceId'];
      appendScope(scope, parameters, clauses);
      return read(`
SELECT
  item.codigo,
  item.etiqueta,
  motive.especificacion
FROM dbo.ref_motivo AS motive
INNER JOIN dbo.cat_item AS item
  ON item.cat_item_id = motive.cat_item_id
 AND item.codigo_catalogo = motive.motivo_catalogo
INNER JOIN dbo.ref_referencia AS ref
  ON ref.referencia_id = motive.referencia_id
WHERE ${clauses.join('\n  AND ')}
ORDER BY item.orden, motive.motivo_id
`, parameters);
    },

    /**
     * Inserta referencia, contexto, motivos y auditoría, y borra solo el borrador
     * del autor para la persona referida. Un identificador de otro borrador del
     * mismo autor no se elimina y aborta el envío. Una falla revierte todo.
     *
     * @param {object} record Referencia ya validada y contexto histórico.
     * @returns {Promise<{referenceId: number, sentAt: string}>} Comprobante del envío.
     * @throws {Error} Con código ACTIVE_CASE, DUPLICATE_CONSECUTIVE, DEADLOCK, PERMISSION o CONSTRAINT.
     */
    async insertSubmitted(record) {
      requireClient();
      if (typeof client.withTransaction !== 'function') {
        throw new InfrastructureError('La base del módulo no admite transacciones.');
      }
      try {
        return await client.withTransaction(async (transaction) => {
          const header = await transaction.query(INSERT_REFERENCE_SQL, {
            personId: typed(sql.NVarChar(20), record.personId),
            referenceDate: typed(sql.Date, record.referenceDate),
            routeItemId: typed(sql.BigInt, record.attentionRoute.itemId),
            originItemId: typed(sql.BigInt, record.origin.itemId),
            responsible: typed(sql.NVarChar(128), record.responsible),
            previousActions: typed(sql.NVarChar(2000), record.previousActions),
            previousResults: typed(sql.NVarChar(2000), record.previousResults),
            complementaryInformation: typed(sql.NVarChar(2000), record.complementaryInformation),
            captureOrigin: typed(sql.NVarChar(20), record.captureOrigin),
            templateVersion: typed(sql.NVarChar(40), record.templateVersion),
            consecutive: typed(sql.NVarChar(80), record.consecutive),
            establishmentId: typed(sql.Int, record.context.establishmentId),
            localOfficeId: typed(sql.Int, record.context.localOfficeId),
            regionId: typed(sql.Int, record.context.regionId)
          });
          const inserted = header[0];
          const referenceId = Number(inserted.referencia_id);
          await transaction.query(INSERT_CONTEXT_SQL, {
            referenceId: typed(sql.BigInt, referenceId),
            guardianName: typed(sql.NVarChar(200), record.context.guardianName),
            guardianRelationship: typed(sql.NVarChar(80), record.context.guardianRelationship),
            contact: typed(sql.NVarChar(80), record.context.contact),
            address: typed(sql.NVarChar(200), record.context.address),
            servicesText: typed(sql.NVarChar(500), record.context.servicesText),
            regionName: typed(sql.NVarChar(200), record.context.regionName),
            localOfficeName: typed(sql.NVarChar(200), record.context.localOfficeName),
            establishmentName: typed(sql.NVarChar(200), record.context.establishmentName),
            ageYears: typed(sql.SmallInt, record.context.ageYears),
            birthDate: typed(sql.Date, record.context.birthDate)
          });
          for (const motive of record.motives) {
            await transaction.query(INSERT_MOTIVE_SQL, {
              referenceId: typed(sql.BigInt, referenceId),
              itemId: typed(sql.BigInt, motive.itemId),
              specification: typed(sql.NVarChar(1000), motive.specification)
            });
          }
          await transaction.query(DELETE_DRAFT_SQL, {
            responsible: typed(sql.NVarChar(128), record.responsible),
            draftId: typed(sql.BigInt, record.draftId),
            personId: typed(sql.NVarChar(80), record.personId)
          });
          await transaction.query(INSERT_AUDIT_SQL, {
            responsible: typed(sql.NVarChar(128), record.responsible),
            role: typed(sql.NVarChar(40), record.auditRole),
            action: typed(sql.NVarChar(40), 'ENVIO'),
            entityId: typed(sql.NVarChar(40), String(referenceId)),
            scopeText: typed(sql.NVarChar(200), record.scopeText),
            changeCode: typed(sql.NVarChar(80), 'REFERENCIA_ENVIADA')
          });
          return {
            referenceId,
            sentAt: inserted.enviada_en
          };
        });
      } catch (error) {
        throw toDomainError(error);
      }
    },

    /**
     * Registra la generación documental sin actualizar la referencia.
     *
     * @param {object} record Identificador, usuario y ámbito.
     * @returns {Promise<{generatedAt: string}>} Fecha y hora del servidor.
     */
    async recordPrint(record) {
      requireClient();
      if (typeof client.withTransaction !== 'function') {
        throw new InfrastructureError('La base del módulo no admite transacciones.');
      }
      try {
        return await client.withTransaction(async (transaction) => {
          const rows = await transaction.query(`
INSERT INTO dbo.ref_impresion (referencia_id, usuario, impresa_en)
OUTPUT CONVERT(char(19), inserted.impresa_en, 120) AS impresa_en
VALUES (
  @referenceId,
  @responsible,
  CAST(SYSUTCDATETIME() AS datetime2(0))
);
`, {
            referenceId: typed(sql.BigInt, record.referenceId),
            responsible: typed(sql.NVarChar(128), record.responsible)
          });
          await transaction.query(INSERT_AUDIT_SQL, {
            responsible: typed(sql.NVarChar(128), record.responsible),
            role: typed(sql.NVarChar(40), record.auditRole),
            action: typed(sql.NVarChar(40), 'IMPRESION'),
            entityId: typed(sql.NVarChar(40), String(record.referenceId)),
            scopeText: typed(sql.NVarChar(200), record.scopeText),
            changeCode: typed(sql.NVarChar(80), 'REFERENCIA_IMPRESA')
          });
          return { generatedAt: rows[0].impresa_en };
        });
      } catch (error) {
        throw toDomainError(error);
      }
    },

    /**
     * Guarda o sustituye el borrador del autor. No crea una referencia ni un comprobante.
     *
     * @param {object} draft Borrador del usuario autenticado.
     * @returns {Promise<{draftId: number, updatedAt: string}>} Identificador y marca de tiempo.
     */
    async saveDraft(draft) {
      requireClient();
      if (typeof client.withTransaction !== 'function') {
        throw new InfrastructureError('La base del módulo no admite transacciones.');
      }
      try {
        return await client.withTransaction(async (transaction) => {
          if (draft.draftId) {
            const updated = await transaction.query(`
UPDATE dbo.bor_captura
SET
  contenido = @content,
  actualizado_en = CAST(SYSUTCDATETIME() AS datetime2(0)),
  clave_negocio = @personKey,
  ambito_nivel = @accessLevel,
  oficina_local_id = @localOfficeId,
  establecimiento_id = @establishmentId
OUTPUT inserted.borrador_id, CONVERT(char(19), inserted.actualizado_en, 120) AS actualizado_en
WHERE borrador_id = @draftId
  AND usuario = @responsible
  AND flujo = N'REFERENCIA';
`, {
              content: typed(sql.NVarChar(sql.MAX), draft.content),
              personKey: typed(sql.NVarChar(80), draft.personId),
              accessLevel: typed(sql.NVarChar(20), draft.accessLevel),
              localOfficeId: typed(sql.Int, draft.localOfficeId),
              establishmentId: typed(sql.Int, draft.establishmentId),
              draftId: typed(sql.BigInt, draft.draftId),
              responsible: typed(sql.NVarChar(128), draft.responsible)
            });
            if (!updated[0]) {
              const missing = new Error('El borrador no está disponible.');
              missing.code = 'DRAFT_NOT_FOUND';
              missing.domain = true;
              throw missing;
            }
            return {
              draftId: Number(updated[0].borrador_id),
              updatedAt: updated[0].actualizado_en
            };
          }
          const inserted = await transaction.query(`
INSERT INTO dbo.bor_captura (
  usuario,
  ambito_nivel,
  oficina_local_id,
  establecimiento_id,
  flujo,
  clave_negocio,
  contenido,
  actualizado_en
)
OUTPUT inserted.borrador_id, CONVERT(char(19), inserted.actualizado_en, 120) AS actualizado_en
VALUES (
  @responsible,
  @accessLevel,
  @localOfficeId,
  @establishmentId,
  N'REFERENCIA',
  @personKey,
  @content,
  CAST(SYSUTCDATETIME() AS datetime2(0))
);
`, {
            responsible: typed(sql.NVarChar(128), draft.responsible),
            accessLevel: typed(sql.NVarChar(20), draft.accessLevel),
            localOfficeId: typed(sql.Int, draft.localOfficeId),
            establishmentId: typed(sql.Int, draft.establishmentId),
            personKey: typed(sql.NVarChar(80), draft.personId),
            content: typed(sql.NVarChar(sql.MAX), draft.content)
          });
          return {
            draftId: Number(inserted[0].borrador_id),
            updatedAt: inserted[0].actualizado_en
          };
        });
      } catch (error) {
        if (error && error.code === 'DRAFT_NOT_FOUND') {
          throw error;
        }
        throw toDomainError(error);
      }
    },

    /**
     * Lista solo los borradores del autor. El permiso SQL no filtra por usuario.
     *
     * @param {string} responsible Identidad de la sesión.
     * @returns {Promise<object[]>} Borradores recientes del autor.
     */
    async listDrafts(responsible) {
      return read(`
SELECT TOP (20)
  borrador_id,
  clave_negocio,
  contenido,
  CONVERT(char(19), actualizado_en, 120) AS actualizado_en
FROM dbo.bor_captura
WHERE usuario = @responsible
  AND flujo = N'REFERENCIA'
ORDER BY actualizado_en DESC, borrador_id DESC
`, { responsible: typed(sql.NVarChar(128), responsible) });
    },

    /**
     * Elimina un borrador si pertenece al autor.
     *
     * @param {number} draftId Identificador del borrador.
     * @param {string} responsible Identidad de la sesión.
     * @returns {Promise<boolean>} true cuando eliminó una fila.
     */
    async deleteDraft(draftId, responsible) {
      requireClient();
      const rows = await client.query(`
DELETE FROM dbo.bor_captura
OUTPUT deleted.borrador_id
WHERE borrador_id = @draftId
  AND usuario = @responsible
  AND flujo = N'REFERENCIA';
`, {
        draftId: typed(sql.BigInt, draftId),
        responsible: typed(sql.NVarChar(128), responsible)
      });
      return rows.length > 0;
    }
  };
}

module.exports = {
  createReferenceRepository,
  buildReferenceListQuery,
  toDomainError
};

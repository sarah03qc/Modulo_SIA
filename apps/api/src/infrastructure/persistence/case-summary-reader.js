'use strict';

const { InfrastructureError } = require('../../common/errors');

/*
  HU-009 CA-06 y RF-017.
  La vista dbo.caso_lista_establecimiento expone identificador, estado, prioridad y fechas.
  No se consulta ses_valoracion, factores, riesgo, proteccion, plan ni atenciones.
  El SELECT de sia_cencinai_app sobre la vista se concede fuera de la API.
  El ambito lo aplica este lector, no el permiso SQL. Si el motor deniega la lectura,
  la consulta se informa como bloqueada y no se simulan casos.
*/

function bindIdList(columnSql, ids, parameters) {
  const names = ids.map((id, index) => {
    const name = `establishment${index}`;
    parameters[name] = id;
    return `@${name}`;
  });
  return `${columnSql} IN (${names.join(', ')})`;
}

function buildCaseSummarySql(scope) {
  const parameters = {};
  const clauses = ['case_list.per_id_persona = @personId'];
  if (scope.regionId !== null && scope.regionId !== undefined) {
    parameters.regionId = scope.regionId;
    clauses.push('case_list.region_id = @regionId');
  }
  if (scope.localOfficeId !== null && scope.localOfficeId !== undefined) {
    parameters.localOfficeId = scope.localOfficeId;
    clauses.push('case_list.oficina_local_id = @localOfficeId');
  }
  if (Array.isArray(scope.establishmentIds)) {
    clauses.push(bindIdList('case_list.establecimiento_id', scope.establishmentIds, parameters));
  }
  return {
    parameters,
    sql: `
SELECT
  case_list.caso_id,
  case_list.estado,
  case_list.prioridad_codigo,
  CONVERT(char(10), case_list.fecha_apertura, 23) AS fecha_apertura,
  CONVERT(char(10), case_list.fecha_cierre, 23) AS fecha_cierre
FROM dbo.caso_lista_establecimiento AS case_list
WHERE ${clauses.join('\n  AND ')}
ORDER BY case_list.fecha_apertura, case_list.caso_id
`
  };
}

function mapCase(row) {
  return {
    caseId: row.caso_id,
    status: row.estado,
    priority: row.prioridad_codigo,
    openedOn: row.fecha_apertura,
    closedOn: row.fecha_cierre
  };
}

function createCaseSummaryReader(client) {
  return {
    async listAuthorizedSummaries(personId, scope) {
      if (!client || typeof client.query !== 'function') {
        throw new InfrastructureError('La base del módulo no está disponible.');
      }
      const statement = buildCaseSummarySql(scope);
      try {
        const rows = await client.query(statement.sql, {
          ...statement.parameters,
          personId
        });
        return {
          availability: 'AVAILABLE',
          items: rows.map(mapCase)
        };
      } catch (error) {
        if (error && error.permissionDenied) {
          return {
            availability: 'BLOCKED',
            items: null
          };
        }
        throw error;
      }
    }
  };
}

module.exports = {
  buildCaseSummarySql,
  createCaseSummaryReader
};

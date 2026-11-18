/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-18.
 * Lee evaluaciones nutricionales de la réplica. No las clasifica.
 *
 * TODO-UTIC: confirmar el contrato de lectura y los permisos de
 * evaluaciones nutricionales en el CAH institucional.
 * TODO-UTIC: confirmar la semántica y la vigencia de las evaluaciones
 * históricas. Aquí solo se excluye el borrado lógico del período.
 */
'use strict';

const sql = require('mssql');

const LECTURA_SQL = `
WITH vigentes AS (
  SELECT
    ev.EVM_idEvaluacionMenor AS evaluacion_id,
    ev.PER_idPersona AS person_id,
    CONVERT(char(10), ev.EVM_fechaEvaluacion, 23) AS fecha_evaluacion,
    ev.EVM_estadoNutricionalPe AS codigo_pe,
    ev.EVM_estadoNutricionalPt AS codigo_pt,
    ev.EVM_estadoNutricionalTe AS codigo_te,
    ev.EVM_estadoNutricionalImc AS codigo_imc
  FROM dbo.CAF_EVALUACION_MENOR AS ev
  WHERE ev.RCS_idPeriodo = @periodId
    AND COALESCE(ev.BIT_eliminado, 0) = 0
)
SELECT
  vigentes.evaluacion_id,
  vigentes.person_id,
  vigentes.fecha_evaluacion,
  vigentes.codigo_pe,
  vigentes.codigo_pt,
  vigentes.codigo_te,
  vigentes.codigo_imc,
  CONVERT(char(10), person.PER_fechaNacimiento, 23) AS birth_date,
  establishment.EST_idEstablecimiento AS establishment_id,
  office.CAT_idOficinaLocal AS local_office_id,
  region.CAT_idRegion AS region_id,
  (
    SELECT COUNT(*)
    FROM dbo.CAF_FAMILIA_DETALLE AS location_rows
    WHERE location_rows.FAM_idFamilia = person.FAM_idFamilia
      AND location_rows.RCS_idPeriodo = @periodId
      AND COALESCE(location_rows.BIT_eliminado, 0) = 0
  ) AS location_count
FROM vigentes
INNER JOIN dbo.CAF_PERSONA AS person
  ON person.PER_idPersona = vigentes.person_id
 AND COALESCE(person.BIT_eliminado, 0) = 0
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

const CONTEO_SQL = `
SELECT
  SUM(CASE WHEN COALESCE(ev.BIT_eliminado, 0) = 1 THEN 1 ELSE 0 END) AS eliminadas
FROM dbo.CAF_EVALUACION_MENOR AS ev
WHERE ev.RCS_idPeriodo = @periodId
`;

/**
 * Lectura de solo lectura. El cliente institucional rechaza escrituras.
 *
 * @param {object} client Cliente de SIDINACC_LOCAL.
 * @returns {object} Consultas de evaluaciones del período.
 */
function CrearLectorEvaluaciones(client) {
  return {
    /**
     * Devuelve las evaluaciones no eliminadas del período, con la ubicación
     * vigente del detalle familiar. No usa el establecimiento histórico.
     *
     * @param {number} periodId Período institucional configurado.
     * @returns {Promise<{filas: object[], eliminadas: number}>} Filas y conteo.
     */
    async ListarEvaluaciones(periodId) {
      const parametro = { periodId: { type: sql.Numeric(18, 0), value: periodId } };
      const filas = await client.query(LECTURA_SQL, parametro);
      const conteo = await client.query(CONTEO_SQL, parametro);
      const eliminadas = conteo[0] && conteo[0].eliminadas
        ? Number(conteo[0].eliminadas)
        : 0;
      return { filas, eliminadas };
    }
  };
}

module.exports = {
  CrearLectorEvaluaciones,
  LECTURA_SQL,
  CONTEO_SQL
};

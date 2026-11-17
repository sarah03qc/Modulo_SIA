/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * HU-038 y HU-039. Lecturas parametrizadas del ámbito de la sesión.
 * La fecha real de atención no se sustituye por la fecha de digitación.
 */
'use strict';

const sql = require('mssql');
const { ErrorInfraestructura } = require('../../common/errors');
const { Parametro } = require('../proceso-interdisciplinario/repositorio-proceso');

function TraducirSql(error) {
  if (error instanceof ErrorInfraestructura) {
    return error;
  }
  const numero = error && error.sqlNumber;
  if (numero === 229 || numero === 230 || (error && error.permissionDenied)) {
    return new ErrorInfraestructura(
      'La reportería no está disponible para la cuenta técnica actual.'
    );
  }
  return new ErrorInfraestructura('La consulta analítica no pudo completarse.');
}

function Entero(valor) {
  if (valor === null || valor === undefined) {
    return null;
  }
  const numero = Number(valor);
  return Number.isSafeInteger(numero) ? numero : null;
}

function Texto(valor) {
  if (valor === null || valor === undefined) {
    return null;
  }
  const texto = String(valor).trim();
  return texto.length === 0 ? null : texto;
}

function Fecha(valor) {
  return valor ? String(valor).slice(0, 10) : null;
}

/**
 * Consultas de solo lectura para el corte de Oficina Local.
 *
 * @param {object} cliente Cliente SQL de SIA_CENCINAI.
 * @returns {object} Hechos ya acotados por oficina y región.
 */
function CrearRepositorioReporteria(cliente) {
  async function Consultar(texto, parametros) {
    if (!cliente || typeof cliente.query !== 'function') {
      throw new ErrorInfraestructura('La base del módulo no está disponible.');
    }
    try {
      return await cliente.query(texto, parametros);
    } catch (error) {
      throw TraducirSql(error);
    }
  }

  function Parametros(registro) {
    return {
      oficina: Parametro(sql.Int, registro.oficinaLocalId),
      region: Parametro(sql.Int, registro.regionId),
      inicio: Parametro(sql.Date, registro.inicio),
      fin: Parametro(sql.Date, registro.fin),
      establecimiento: Parametro(sql.Int, registro.establecimientoId)
    };
  }

  return {
    /**
     * Lee los hechos del ámbito. El establecimiento nulo no filtra.
     * El intervalo del año es semiabierto: inicio inclusive y fin exclusive.
     *
     * @param {object} registro Oficina, región, fechas y establecimiento.
     * @returns {Promise<object>} Hechos normalizados, sin nombres de personas.
     */
    async ConsultarHechos(registro) {
      const parametros = Parametros(registro);
      const filtroCaso = `
  AND caso.oficina_local_id = @oficina
  AND caso.region_id = @region
  AND (@establecimiento IS NULL OR caso.establecimiento_id = @establecimiento)`;
      const casos = await Consultar(`
SELECT
  caso.caso_id,
  caso.per_id_persona,
  caso.establecimiento_id,
  caso.estado,
  valoracion.prioridad_codigo
FROM dbo.caso_ai AS caso
INNER JOIN dbo.ses_valoracion AS valoracion
  ON valoracion.valoracion_id = caso.valoracion_vigente_id
WHERE 1 = 1
${filtroCaso}
`, parametros);
      const referencias = await Consultar(`
SELECT
  referencia.referencia_id,
  referencia.per_id_persona,
  referencia.establecimiento_id,
  referencia.estado
FROM dbo.ref_referencia AS referencia
WHERE referencia.oficina_local_id = @oficina
  AND referencia.region_id = @region
  AND referencia.fecha_referencia >= @inicio
  AND referencia.fecha_referencia < @fin
  AND (
    @establecimiento IS NULL
    OR referencia.establecimiento_id = @establecimiento
  )
`, parametros);
      const motivos = await Consultar(`
SELECT
  motivo.referencia_id,
  item.etiqueta
FROM dbo.ref_motivo AS motivo
INNER JOIN dbo.ref_referencia AS referencia
  ON referencia.referencia_id = motivo.referencia_id
INNER JOIN dbo.cat_item AS item
  ON item.cat_item_id = motivo.cat_item_id
 AND item.codigo_catalogo = motivo.motivo_catalogo
WHERE referencia.oficina_local_id = @oficina
  AND referencia.region_id = @region
  AND referencia.fecha_referencia >= @inicio
  AND referencia.fecha_referencia < @fin
  AND (
    @establecimiento IS NULL
    OR referencia.establecimiento_id = @establecimiento
  )
`, parametros);
      const individuales = await Consultar(`
SELECT
  individual.atencion_individual_id,
  individual.caso_id,
  individual.per_id_persona,
  individual.disciplina_item_id,
  individual.profesional_usuario,
  caso.establecimiento_id,
  caso.estado
FROM dbo.ate_individual AS individual
INNER JOIN dbo.caso_ai AS caso
  ON caso.caso_id = individual.caso_id
WHERE individual.fecha_atencion >= @inicio
  AND individual.fecha_atencion < @fin
${filtroCaso}
`, parametros);
      const grupales = await Consultar(`
SELECT
  grupal.atencion_grupal_id,
  grupal.establecimiento_id,
  grupal.tipo_item_id,
  item.etiqueta
FROM dbo.ate_grupal AS grupal
LEFT JOIN dbo.cat_item AS item
  ON item.cat_item_id = grupal.tipo_item_id
 AND item.codigo_catalogo = grupal.tipo_catalogo
WHERE grupal.oficina_local_id = @oficina
  AND grupal.fecha_atencion >= @inicio
  AND grupal.fecha_atencion < @fin
  AND (
    @establecimiento IS NULL
    OR grupal.establecimiento_id = @establecimiento
  )
`, parametros);
      const disciplinasGrupales = await Consultar(`
SELECT
  disciplina.atencion_grupal_id,
  disciplina.disciplina_item_id
FROM dbo.ate_grupal_disciplina AS disciplina
INNER JOIN dbo.ate_grupal AS grupal
  ON grupal.atencion_grupal_id = disciplina.atencion_grupal_id
WHERE grupal.oficina_local_id = @oficina
  AND grupal.fecha_atencion >= @inicio
  AND grupal.fecha_atencion < @fin
  AND (
    @establecimiento IS NULL
    OR grupal.establecimiento_id = @establecimiento
  )
`, parametros);
      const profesionalesGrupales = await Consultar(`
SELECT
  profesional.atencion_grupal_id,
  profesional.profesional_usuario
FROM dbo.ate_grupal_profesional AS profesional
INNER JOIN dbo.ate_grupal AS grupal
  ON grupal.atencion_grupal_id = profesional.atencion_grupal_id
WHERE grupal.oficina_local_id = @oficina
  AND grupal.fecha_atencion >= @inicio
  AND grupal.fecha_atencion < @fin
  AND (
    @establecimiento IS NULL
    OR grupal.establecimiento_id = @establecimiento
  )
`, parametros);
      const participantes = await Consultar(`
SELECT
  participante.atencion_grupal_id,
  participante.per_id_persona,
  participante.caso_id,
  participante.asistio
FROM dbo.ate_grupal_participante AS participante
INNER JOIN dbo.ate_grupal AS grupal
  ON grupal.atencion_grupal_id = participante.atencion_grupal_id
WHERE grupal.oficina_local_id = @oficina
  AND grupal.fecha_atencion >= @inicio
  AND grupal.fecha_atencion < @fin
  AND (
    @establecimiento IS NULL
    OR grupal.establecimiento_id = @establecimiento
  )
`, parametros);
      const cancelaciones = await Consultar(`
SELECT
  actividad.actividad_id,
  actividad.establecimiento_id,
  actividad.motivo_vigente
FROM dbo.prog_actividad AS actividad
INNER JOIN dbo.prog_cambio AS cambio
  ON cambio.actividad_id = actividad.actividad_id
 AND cambio.estado_nuevo = N'CANCELADA'
WHERE actividad.oficina_local_id = @oficina
  AND actividad.region_id = @region
  AND actividad.estado = N'CANCELADA'
  AND cambio.ocurrido_en >= @inicio
  AND cambio.ocurrido_en < @fin
  AND (
    @establecimiento IS NULL
    OR actividad.establecimiento_id = @establecimiento
  )
`, parametros);
      const cierres = await Consultar(`
SELECT
  cierre.caso_id,
  cierre.motivo_codigo,
  cierre.motivo_requiere_texto,
  cierre.explicacion,
  item.etiqueta,
  caso.establecimiento_id
FROM dbo.caso_cierre AS cierre
INNER JOIN dbo.caso_ai AS caso
  ON caso.caso_id = cierre.caso_id
INNER JOIN dbo.cat_item AS item
  ON item.cat_item_id = cierre.motivo_item_id
 AND item.codigo_catalogo = cierre.motivo_catalogo
WHERE cierre.fecha_cierre >= @inicio
  AND cierre.fecha_cierre < @fin
${filtroCaso}
`, parametros);
      const ultimas = await Consultar(`
SELECT
  caso.caso_id,
  CONVERT(char(10), (
    SELECT MAX(fecha)
    FROM (
      SELECT individual.fecha_atencion AS fecha
      FROM dbo.ate_individual AS individual
      WHERE individual.caso_id = caso.caso_id
      UNION ALL
      SELECT grupal.fecha_atencion
      FROM dbo.ate_grupal_participante AS participante
      INNER JOIN dbo.ate_grupal AS grupal
        ON grupal.atencion_grupal_id = participante.atencion_grupal_id
      WHERE participante.caso_id = caso.caso_id
        AND participante.asistio = 1
    ) AS fechas
  ), 23) AS ultima
FROM dbo.caso_ai AS caso
WHERE caso.estado = N'ACTIVO'
${filtroCaso}
`, parametros);
      const catalogo = await Consultar(`
SELECT
  item.cat_item_id,
  item.codigo,
  item.etiqueta,
  item.codigo_catalogo
FROM dbo.cat_item AS item
INNER JOIN dbo.cat_version AS version
  ON version.cat_version_id = item.cat_version_id
 AND version.codigo_catalogo = item.codigo_catalogo
WHERE item.activo = 1
  AND version.vigente = 1
  AND item.codigo_catalogo IN (N'TIPO_ATENCION', N'DISCIPLINA')
`, {});
      return {
        casos: casos.map((fila) => ({
          casoId: Entero(fila.caso_id),
          personaId: Texto(fila.per_id_persona),
          establecimientoId: Entero(fila.establecimiento_id),
          estado: fila.estado,
          prioridad: fila.prioridad_codigo
        })),
        referencias: referencias.map((fila) => ({
          referenciaId: Entero(fila.referencia_id),
          personaId: Texto(fila.per_id_persona),
          establecimientoId: Entero(fila.establecimiento_id),
          estado: fila.estado
        })),
        motivosReferencia: motivos.map((fila) => ({
          referenciaId: Entero(fila.referencia_id),
          etiqueta: Texto(fila.etiqueta) || 'Motivo sin etiqueta'
        })),
        individuales: individuales.map((fila) => ({
          atencionId: Entero(fila.atencion_individual_id),
          casoId: Entero(fila.caso_id),
          personaId: Texto(fila.per_id_persona),
          disciplinaId: Entero(fila.disciplina_item_id),
          profesional: Texto(fila.profesional_usuario),
          establecimientoId: Entero(fila.establecimiento_id),
          estadoCaso: fila.estado
        })),
        grupales: grupales.map((fila) => ({
          atencionId: Entero(fila.atencion_grupal_id),
          establecimientoId: Entero(fila.establecimiento_id),
          tipoId: Entero(fila.tipo_item_id),
          tipoEtiqueta: Texto(fila.etiqueta)
        })),
        disciplinasGrupales: disciplinasGrupales.map((fila) => ({
          atencionId: Entero(fila.atencion_grupal_id),
          disciplinaId: Entero(fila.disciplina_item_id)
        })),
        profesionalesGrupales: profesionalesGrupales.map((fila) => ({
          atencionId: Entero(fila.atencion_grupal_id),
          profesional: Texto(fila.profesional_usuario)
        })),
        participantes: participantes.map((fila) => ({
          atencionId: Entero(fila.atencion_grupal_id),
          personaId: Texto(fila.per_id_persona),
          casoId: Entero(fila.caso_id),
          asistio: fila.asistio
        })),
        cancelaciones: cancelaciones.map((fila) => ({
          actividadId: Entero(fila.actividad_id),
          establecimientoId: Entero(fila.establecimiento_id),
          motivo: Texto(fila.motivo_vigente)
        })),
        cierres: cierres.map((fila) => ({
          casoId: Entero(fila.caso_id),
          establecimientoId: Entero(fila.establecimiento_id),
          codigo: fila.motivo_codigo,
          etiqueta: Texto(fila.etiqueta),
          requiereTexto: fila.motivo_requiere_texto === true
            || fila.motivo_requiere_texto === 1,
          explicacion: Texto(fila.explicacion)
        })),
        ultimasAtenciones: ultimas.map((fila) => ({
          casoId: Entero(fila.caso_id),
          fecha: Fecha(fila.ultima)
        })),
        catalogoTipos: catalogo
          .filter((fila) => fila.codigo_catalogo === 'TIPO_ATENCION')
          .map((fila) => ({
            itemId: Entero(fila.cat_item_id),
            codigo: fila.codigo,
            etiqueta: Texto(fila.etiqueta) || fila.codigo
          })),
        catalogoDisciplinas: catalogo
          .filter((fila) => fila.codigo_catalogo === 'DISCIPLINA')
          .map((fila) => ({
            itemId: Entero(fila.cat_item_id),
            codigo: fila.codigo,
            etiqueta: Texto(fila.etiqueta) || fila.codigo
          }))
      };
    }
  };
}

module.exports = { CrearRepositorioReporteria };

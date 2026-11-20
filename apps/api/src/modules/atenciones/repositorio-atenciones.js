/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * Modificación: 2026-11-18. requiere_texto del catálogo y estrategia_otra_texto.
 * Persistencia de atenciones. HU-036 y HU-037. Una grupal es un solo registro.
 */
'use strict';

const sql = require('mssql');
const { ErrorInfraestructura } = require('../../common/errors');
const {
  AgregarAmbito,
  Parametro
} = require('../proceso-interdisciplinario/repositorio-proceso');

function ErrorDominio(codigo) {
  const error = new Error('La persistencia de la atención no se completó.');
  error.domain = true;
  error.code = codigo;
  return error;
}

function TraducirSql(error) {
  if (error && error.domain === true) {
    return error;
  }
  const numero = error && error.sqlNumber;
  if (numero === 2601 || numero === 2627) {
    return ErrorDominio('DUPLICADO');
  }
  if (numero === 1205) {
    return ErrorDominio('INTERBLOQUEO');
  }
  if (numero === 229 || numero === 230 || (error && error.permissionDenied)) {
    return ErrorDominio('PERMISO');
  }
  return error instanceof ErrorInfraestructura ? error : ErrorDominio('INFRAESTRUCTURA');
}

/**
 * Repositorio de atenciones sobre el cliente de SIA_CENCINAI.
 *
 * @param {object} cliente Cliente SQL.
 * @returns {object} Lecturas de catálogo y escrituras transaccionales.
 */
function CrearRepositorioAtenciones(cliente) {
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

  async function EnTransaccion(trabajo) {
    if (!cliente || typeof cliente.EnTransaccion !== 'function') {
      throw new ErrorInfraestructura('La base del módulo no está disponible.');
    }
    try {
      return await cliente.EnTransaccion(trabajo);
    } catch (error) {
      throw TraducirSql(error);
    }
  }

  return {
    async ListarCatalogo(codigos) {
      const parametros = {};
      const nombres = codigos.map((codigo, indice) => {
        const nombre = `catalogo${indice}`;
        parametros[nombre] = Parametro(sql.NVarChar(40), codigo);
        return `@${nombre}`;
      });
      return Consultar(`
SELECT i.cat_item_id, i.codigo_catalogo, i.codigo, i.etiqueta, i.requiere_texto
FROM dbo.cat_item AS i
INNER JOIN dbo.cat_version AS v
  ON v.cat_version_id = i.cat_version_id
 AND v.codigo_catalogo = i.codigo_catalogo
WHERE i.activo = 1
  AND v.vigente = 1
  AND i.codigo_catalogo IN (${nombres.join(', ')})
ORDER BY i.codigo_catalogo, i.orden, i.cat_item_id
`, parametros);
    },

    async BuscarCasoActivo(casoId, ambito) {
      const parametros = { casoId: Parametro(sql.BigInt, casoId) };
      const clausulas = ['caso.caso_id = @casoId', "caso.estado = N'ACTIVO'"];
      AgregarAmbito('caso', ambito, parametros, clausulas);
      const filas = await Consultar(`
SELECT caso.caso_id, caso.per_id_persona, caso.estado, caso.establecimiento_id
FROM dbo.caso_ai AS caso
WHERE ${clausulas.join(' AND ')}
`, parametros);
      return filas[0] || null;
    },

    /**
     * Inserta la atención individual y su auditoría en una transacción.
     * Rechaza el caso si dejó de estar activo antes de confirmar.
     *
     * @param {object} registro Datos ya autorizados.
     * @returns {Promise<number>} Identificador de la atención.
     */
    async RegistrarIndividual(registro) {
      return EnTransaccion(async (transaccion) => {
        const casos = await transaccion.query(`
SELECT caso_id, per_id_persona
FROM dbo.caso_ai WITH (UPDLOCK, HOLDLOCK)
WHERE caso_id = @casoId
  AND per_id_persona = @persona
  AND estado = N'ACTIVO'
  AND oficina_local_id = @oficina
  AND region_id = @region
`, {
          casoId: Parametro(sql.BigInt, registro.casoId),
          persona: Parametro(sql.NVarChar(20), registro.personaId),
          oficina: Parametro(sql.Int, registro.oficinaLocalId),
          region: Parametro(sql.Int, registro.regionId)
        });
        if (casos.length !== 1) {
          throw ErrorDominio('CASO_NO_ACTIVO');
        }
        const insertadas = await transaccion.query(`
INSERT INTO dbo.ate_individual (
  caso_id, per_id_persona, fecha_atencion, disciplina_item_id, disciplina_catalogo,
  estrategia_item_id, estrategia_catalogo, estrategia_otra_texto, acciones, recomendaciones,
  profesional_usuario, proxima_accion, fecha_proxima, digitador_usuario, digitada_en
)
OUTPUT INSERTED.atencion_individual_id
VALUES (
  @casoId, @persona, @fecha, @disciplinaId, N'DISCIPLINA',
  @estrategiaId, N'ESTRATEGIA', @estrategiaOtra, @acciones, @recomendaciones,
  @profesional, @proxima, @fechaProxima, @digitador,
  CAST(SYSUTCDATETIME() AS datetime2(0))
)
`, {
          casoId: Parametro(sql.BigInt, registro.casoId),
          persona: Parametro(sql.NVarChar(20), registro.personaId),
          fecha: Parametro(sql.Date, registro.fechaAtencion),
          disciplinaId: Parametro(sql.BigInt, registro.disciplinaId),
          estrategiaId: Parametro(sql.BigInt, registro.estrategiaId),
          estrategiaOtra: Parametro(sql.NVarChar(300), registro.estrategiaOtraTexto ?? null),
          acciones: Parametro(sql.NVarChar(2000), registro.acciones),
          recomendaciones: Parametro(sql.NVarChar(2000), registro.recomendaciones),
          profesional: Parametro(sql.NVarChar(128), registro.profesional),
          proxima: Parametro(sql.NVarChar(500), registro.proximaAccion),
          fechaProxima: Parametro(sql.Date, registro.fechaProxima),
          digitador: Parametro(sql.NVarChar(128), registro.digitador)
        });
        const atencionId = Number(insertadas[0].atencion_individual_id);
        await transaccion.query(`
INSERT INTO dbo.aud_evento (
  ocurrido_en, usuario, rol, accion, entidad, entidad_id, ambito, codigo_cambio
)
VALUES (
  CAST(SYSUTCDATETIME() AS datetime2(0)),
  @usuario, @rol, N'CREACION', N'ate_individual', @entidadId, @ambito,
  N'ATENCION_INDIVIDUAL'
)
`, {
          usuario: Parametro(sql.NVarChar(128), registro.digitador),
          rol: Parametro(sql.NVarChar(40), registro.rol),
          entidadId: Parametro(sql.NVarChar(40), String(atencionId)),
          ambito: Parametro(sql.NVarChar(200), registro.ambitoTexto)
        });
        return atencionId;
      });
    },

    /**
     * Guarda una actividad y sus vínculos. Si una fila falla, no queda la actividad.
     *
     * @param {object} registro Actividad, disciplinas, profesionales y participantes.
     * @returns {Promise<number>} Identificador de la actividad.
     */
    async RegistrarGrupal(registro) {
      return EnTransaccion(async (transaccion) => {
        const insertadas = await transaccion.query(`
INSERT INTO dbo.ate_grupal (
  oficina_local_id, establecimiento_id, fecha_atencion, tipo_item_id, tipo_catalogo,
  tema, lugar, acciones, recomendaciones, digitador_usuario, digitada_en
)
OUTPUT INSERTED.atencion_grupal_id
VALUES (
  @oficina, NULL, @fecha, @tipoId, N'TIPO_ATENCION',
  @tema, @lugar, @acciones, @recomendaciones, @digitador,
  CAST(SYSUTCDATETIME() AS datetime2(0))
)
`, {
          oficina: Parametro(sql.Int, registro.oficinaLocalId),
          fecha: Parametro(sql.Date, registro.fechaAtencion),
          tipoId: Parametro(sql.BigInt, registro.tipoId),
          tema: Parametro(sql.NVarChar(500), registro.tema),
          lugar: Parametro(sql.NVarChar(200), registro.lugar),
          acciones: Parametro(sql.NVarChar(2000), registro.acciones),
          recomendaciones: Parametro(sql.NVarChar(2000), registro.recomendaciones),
          digitador: Parametro(sql.NVarChar(128), registro.digitador)
        });
        const atencionId = Number(insertadas[0].atencion_grupal_id);
        for (const disciplinaId of registro.disciplinas) {
          await transaccion.query(`
INSERT INTO dbo.ate_grupal_disciplina (
  atencion_grupal_id, disciplina_item_id, disciplina_catalogo
)
VALUES (@atencionId, @disciplinaId, N'DISCIPLINA')
`, {
            atencionId: Parametro(sql.BigInt, atencionId),
            disciplinaId: Parametro(sql.BigInt, disciplinaId)
          });
        }
        for (const profesional of registro.profesionales) {
          await transaccion.query(`
INSERT INTO dbo.ate_grupal_profesional (atencion_grupal_id, profesional_usuario)
VALUES (@atencionId, @profesional)
`, {
            atencionId: Parametro(sql.BigInt, atencionId),
            profesional: Parametro(sql.NVarChar(128), profesional)
          });
        }
        for (const participante of registro.participantes) {
          const casos = await transaccion.query(`
SELECT caso_id
FROM dbo.caso_ai WITH (UPDLOCK, HOLDLOCK)
WHERE caso_id = @casoId
  AND per_id_persona = @persona
  AND estado = N'ACTIVO'
  AND oficina_local_id = @oficina
  AND region_id = @region
`, {
            casoId: Parametro(sql.BigInt, participante.casoId),
            persona: Parametro(sql.NVarChar(20), participante.personaId),
            oficina: Parametro(sql.Int, registro.oficinaLocalId),
            region: Parametro(sql.Int, registro.regionId)
          });
          if (casos.length !== 1) {
            throw ErrorDominio('CASO_NO_ACTIVO');
          }
          await transaccion.query(`
INSERT INTO dbo.ate_grupal_participante (
  atencion_grupal_id, per_id_persona, caso_id, asistio
)
VALUES (@atencionId, @persona, @casoId, @asistio)
`, {
            atencionId: Parametro(sql.BigInt, atencionId),
            persona: Parametro(sql.NVarChar(20), participante.personaId),
            casoId: Parametro(sql.BigInt, participante.casoId),
            asistio: Parametro(sql.Bit, participante.asistio)
          });
        }
        await transaccion.query(`
INSERT INTO dbo.aud_evento (
  ocurrido_en, usuario, rol, accion, entidad, entidad_id, ambito, codigo_cambio
)
VALUES (
  CAST(SYSUTCDATETIME() AS datetime2(0)),
  @usuario, @rol, N'CREACION', N'ate_grupal', @entidadId, @ambito, N'ATENCION_GRUPAL'
)
`, {
          usuario: Parametro(sql.NVarChar(128), registro.digitador),
          rol: Parametro(sql.NVarChar(40), registro.rol),
          entidadId: Parametro(sql.NVarChar(40), String(atencionId)),
          ambito: Parametro(sql.NVarChar(200), registro.ambitoTexto)
        });
        return atencionId;
      });
    }
  };
}

module.exports = { CrearRepositorioAtenciones };

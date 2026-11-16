/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-14.
 * Modificación: 2026-11-16. Versión de plan, expediente, seguimiento y ciclo.
 * Persistencia de sesión, valoración, resolución y caso. HU-019 a HU-025 y HU-048.
 */
'use strict';

const sql = require('mssql');
const { ErrorInfraestructura } = require('../../common/errors');
const { ACCESS_LEVEL } = require('../../infrastructure/auth/institutional-roles');

function Parametro(tipo, valor) {
  return { type: tipo, value: valor === undefined ? null : valor };
}

function ErrorDominio(codigo) {
  const error = new Error('La persistencia del proceso no se completó.');
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

function AgregarAmbito(alias, ambito, parametros, clausulas) {
  if (!ambito || ambito.accessLevel === ACCESS_LEVEL.ESTABLISHMENT) {
    const ids = ambito && ambito.establishmentIds;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ErrorInfraestructura('El ámbito de establecimientos no es utilizable.');
    }
    const nombres = ids.map((id, indice) => {
      const nombre = `ambitoEstablecimiento${indice}`;
      parametros[nombre] = Parametro(sql.Int, id);
      return `@${nombre}`;
    });
    clausulas.push(`${alias}.establecimiento_id IN (${nombres.join(', ')})`);
    return;
  }
  if (ambito.accessLevel === ACCESS_LEVEL.LOCAL_OFFICE) {
    parametros.ambitoOficina = Parametro(sql.Int, ambito.localOfficeId);
    parametros.ambitoRegion = Parametro(sql.Int, ambito.regionId);
    clausulas.push(`${alias}.oficina_local_id = @ambitoOficina`);
    clausulas.push(`${alias}.region_id = @ambitoRegion`);
    if (Array.isArray(ambito.establishmentIds) && ambito.establishmentIds.length > 0) {
      const nombres = ambito.establishmentIds.map((id, indice) => {
        const nombre = `ambitoEstablecimiento${indice}`;
        parametros[nombre] = Parametro(sql.Int, id);
        return `@${nombre}`;
      });
      clausulas.push(`${alias}.establecimiento_id IN (${nombres.join(', ')})`);
    }
    return;
  }
  throw new ErrorInfraestructura('El nivel no tiene una consulta de casos confirmada en este lote.');
}

/**
 * Conserva el plan anterior y deja vigente la versión nueva.
 * Exige UPDATE de es_vigente, concedido aparte del script 030.
 *
 * @param {object} transaccion Transacción ya abierta.
 * @param {object} registro Caso, abordaje, responsable y fecha.
 * @returns {Promise<number>} Identificador del plan vigente.
 */
async function GuardarVersionPlan(transaccion, registro) {
  await transaccion.query(`
UPDATE dbo.caso_plan
SET es_vigente = 0
WHERE caso_id = @casoId
  AND es_vigente = 1
`, { casoId: Parametro(sql.BigInt, registro.casoId) });
  const versiones = await transaccion.query(`
SELECT ISNULL(MAX(numero_version), 0) AS maximo
FROM dbo.caso_plan
WHERE caso_id = @casoId
`, { casoId: Parametro(sql.BigInt, registro.casoId) });
  const numero = Number(versiones[0].maximo) + 1;
  const planes = await transaccion.query(`
INSERT INTO dbo.caso_plan (
  caso_id, numero_version, es_vigente, frecuencia_item_id, frecuencia_catalogo,
  responsable_usuario, fecha_plan, registrado_en
)
OUTPUT INSERTED.plan_id
VALUES (
  @casoId, @numero, 1, @frecuenciaId, N'FRECUENCIA',
  @responsable, @fecha, CAST(SYSUTCDATETIME() AS datetime2(0))
)
`, {
    casoId: Parametro(sql.BigInt, registro.casoId),
    numero: Parametro(sql.Int, numero),
    frecuenciaId: Parametro(sql.BigInt, registro.abordaje.frecuenciaItemId),
    responsable: Parametro(sql.NVarChar(128), registro.responsable),
    fecha: Parametro(sql.Date, registro.fecha)
  });
  const planId = Number(planes[0].plan_id);
  for (let indice = 0; indice < registro.abordaje.propositos.length; indice += 1) {
    await transaccion.query(`
INSERT INTO dbo.caso_plan_proposito (plan_id, orden, texto)
VALUES (@planId, @orden, @texto)
`, {
      planId: Parametro(sql.BigInt, planId),
      orden: Parametro(sql.Int, indice + 1),
      texto: Parametro(sql.NVarChar(1000), registro.abordaje.propositos[indice])
    });
  }
  for (const estrategiaId of registro.abordaje.estrategias) {
    await transaccion.query(`
INSERT INTO dbo.caso_plan_estrategia (plan_id, estrategia_item_id, estrategia_catalogo)
VALUES (@planId, @estrategiaId, N'ESTRATEGIA')
`, {
      planId: Parametro(sql.BigInt, planId),
      estrategiaId: Parametro(sql.BigInt, estrategiaId)
    });
  }
  for (const disciplinaId of registro.abordaje.disciplinas) {
    await transaccion.query(`
INSERT INTO dbo.caso_plan_disciplina (plan_id, disciplina_item_id, disciplina_catalogo)
VALUES (@planId, @disciplinaId, N'DISCIPLINA')
`, {
      planId: Parametro(sql.BigInt, planId),
      disciplinaId: Parametro(sql.BigInt, disciplinaId)
    });
  }
  const actualizados = await transaccion.query(`
UPDATE dbo.caso_ai
SET plan_vigente_id = @planId
OUTPUT INSERTED.caso_id
WHERE caso_id = @casoId
  AND estado = N'ACTIVO'
`, {
    planId: Parametro(sql.BigInt, planId),
    casoId: Parametro(sql.BigInt, registro.casoId)
  });
  if (actualizados.length !== 1) {
    throw ErrorDominio('ESTADO_INVALIDO');
  }
  return planId;
}

function ListaPersonas(ids, parametros) {
  return ids.map((id, indice) => {
    const nombre = `persona${indice}`;
    parametros[nombre] = Parametro(sql.NVarChar(20), id);
    return `@${nombre}`;
  }).join(', ');
}

/**
 * Repositorio del proceso interdisciplinario.
 * El ámbito llega resuelto. Las escrituras relacionadas comparten transacción.
 *
 * @param {object} cliente Cliente SQL de SIA_CENCINAI.
 * @returns {object} Operaciones de lectura y escritura.
 */
function CrearRepositorioProceso(cliente) {
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
SELECT
  i.cat_item_id,
  i.codigo_catalogo,
  i.codigo,
  i.etiqueta
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

    async ListarInstrumentoVigente() {
      return Consultar(`
SELECT
  v.instrumento_version_id,
  v.numero_version,
  c.categoria_id,
  c.eje,
  c.ambito,
  c.es_requerida,
  c.orden AS orden_categoria,
  f.factor_id,
  f.codigo,
  f.etiqueta,
  f.es_abierto,
  f.orden AS orden_factor
FROM dbo.cat_instrumento_version AS v
INNER JOIN dbo.cat_instrumento_categoria AS c
  ON c.instrumento_version_id = v.instrumento_version_id
LEFT JOIN dbo.cat_instrumento_factor AS f
  ON f.categoria_id = c.categoria_id
 AND f.activo = 1
WHERE v.vigente = 1
ORDER BY c.orden, c.categoria_id, f.orden, f.factor_id
`);
    },

    async ListarMatrizVigente() {
      return Consultar(`
SELECT
  v.cat_version_id,
  p.riesgo_codigo,
  p.proteccion_codigo,
  p.prioridad_codigo
FROM dbo.cat_version AS v
INNER JOIN dbo.cat_matriz_prioridad AS p
  ON p.matriz_version_id = v.cat_version_id
WHERE v.codigo_catalogo = N'MATRIZ_PRIORIDAD'
  AND v.vigente = 1
`);
    },

    async CrearSesion(registro) {
      return EnTransaccion(async (transaccion) => {
        const filas = await transaccion.query(`
INSERT INTO dbo.ses_sesion (
  oficina_local_id, fecha, hora_inicio, hora_fin, lugar, creada_en, creada_por
)
OUTPUT INSERTED.sesion_id
VALUES (
  @oficina,
  @fecha,
  CAST(@horaInicio AS time(0)),
  CAST(@horaFin AS time(0)),
  @lugar,
  CAST(SYSUTCDATETIME() AS datetime2(0)),
  @responsable
)
`, {
          oficina: Parametro(sql.Int, registro.oficinaLocalId),
          fecha: Parametro(sql.Date, registro.fecha),
          horaInicio: Parametro(sql.VarChar(8), `${registro.horaInicio}:00`),
          horaFin: Parametro(sql.VarChar(8), `${registro.horaFin}:00`),
          lugar: Parametro(sql.NVarChar(200), registro.lugar),
          responsable: Parametro(sql.NVarChar(128), registro.responsable)
        });
        const sesionId = Number(filas[0].sesion_id);
        for (const disciplinaId of registro.disciplinas) {
          await transaccion.query(`
INSERT INTO dbo.ses_disciplina (sesion_id, disciplina_item_id, disciplina_catalogo)
VALUES (@sesionId, @disciplinaId, N'DISCIPLINA')
`, {
            sesionId: Parametro(sql.BigInt, sesionId),
            disciplinaId: Parametro(sql.BigInt, disciplinaId)
          });
        }
        await transaccion.query(`
INSERT INTO dbo.aud_evento (
  ocurrido_en, usuario, rol, accion, entidad, entidad_id, ambito, codigo_cambio
)
VALUES (
  CAST(SYSUTCDATETIME() AS datetime2(0)),
  @responsable, @rol, N'CREACION', N'ses_sesion', @entidadId, @ambito, N'SESION_CREADA'
)
`, {
          responsable: Parametro(sql.NVarChar(128), registro.responsable),
          rol: Parametro(sql.NVarChar(40), registro.rol),
          entidadId: Parametro(sql.NVarChar(40), String(sesionId)),
          ambito: Parametro(sql.NVarChar(200), registro.ambitoTexto)
        });
        return sesionId;
      });
    },

    async ListarSesiones(oficinaLocalId) {
      return Consultar(`
SELECT
  sesion_id,
  CONVERT(char(10), fecha, 23) AS fecha,
  CONVERT(char(5), hora_inicio, 108) AS hora_inicio,
  CONVERT(char(5), hora_fin, 108) AS hora_fin,
  lugar
FROM dbo.ses_sesion
WHERE oficina_local_id = @oficina
ORDER BY fecha, hora_inicio, sesion_id
`, { oficina: Parametro(sql.Int, oficinaLocalId) });
    },

    async ObtenerSesion(sesionId, oficinaLocalId) {
      const sesiones = await Consultar(`
SELECT
  sesion_id,
  oficina_local_id,
  CONVERT(char(10), fecha, 23) AS fecha,
  CONVERT(char(5), hora_inicio, 108) AS hora_inicio,
  CONVERT(char(5), hora_fin, 108) AS hora_fin,
  lugar
FROM dbo.ses_sesion
WHERE sesion_id = @sesionId
  AND oficina_local_id = @oficina
`, {
        sesionId: Parametro(sql.BigInt, sesionId),
        oficina: Parametro(sql.Int, oficinaLocalId)
      });
      if (sesiones.length === 0) {
        return null;
      }
      const disciplinas = await Consultar(`
SELECT d.disciplina_item_id, i.codigo, i.etiqueta
FROM dbo.ses_disciplina AS d
INNER JOIN dbo.cat_item AS i
  ON i.cat_item_id = d.disciplina_item_id
 AND i.codigo_catalogo = d.disciplina_catalogo
WHERE d.sesion_id = @sesionId
ORDER BY i.orden, d.disciplina_item_id
`, { sesionId: Parametro(sql.BigInt, sesionId) });
      const situaciones = await Consultar(`
SELECT situacion_id, referencia_id, caso_id
FROM dbo.ses_situacion
WHERE sesion_id = @sesionId
ORDER BY situacion_id
`, { sesionId: Parametro(sql.BigInt, sesionId) });
      return { sesion: sesiones[0], disciplinas, situaciones };
    },

    async BuscarReferencia(referenciaId, ambito) {
      const parametros = { referenciaId: Parametro(sql.BigInt, referenciaId) };
      const clausulas = ['ref.referencia_id = @referenciaId'];
      AgregarAmbito('ref', ambito, parametros, clausulas);
      const filas = await Consultar(`
SELECT
  ref.referencia_id,
  ref.per_id_persona,
  ref.estado,
  ref.consecutivo,
  ref.establecimiento_id,
  ref.oficina_local_id,
  ref.region_id
FROM dbo.ref_referencia AS ref
WHERE ${clausulas.join(' AND ')}
`, parametros);
      return filas[0] || null;
    },

    async BuscarCasoActivo(casoId, ambito) {
      const parametros = { casoId: Parametro(sql.BigInt, casoId) };
      const clausulas = ['caso.caso_id = @casoId', "caso.estado = N'ACTIVO'"];
      AgregarAmbito('caso', ambito, parametros, clausulas);
      const filas = await Consultar(`
SELECT caso.caso_id, caso.per_id_persona, caso.referencia_id, caso.estado
FROM dbo.caso_ai AS caso
WHERE ${clausulas.join(' AND ')}
`, parametros);
      return filas[0] || null;
    },

    async AsociarSituacion(registro) {
      try {
        const filas = await Consultar(`
INSERT INTO dbo.ses_situacion (sesion_id, referencia_id, caso_id)
OUTPUT INSERTED.situacion_id
VALUES (@sesionId, @referenciaId, @casoId)
`, {
          sesionId: Parametro(sql.BigInt, registro.sesionId),
          referenciaId: Parametro(sql.BigInt, registro.referenciaId),
          casoId: Parametro(sql.BigInt, registro.casoId)
        });
        return Number(filas[0].situacion_id);
      } catch (error) {
        if (error && error.code === 'DUPLICADO') {
          throw ErrorDominio('SITUACION_DUPLICADA');
        }
        throw error;
      }
    },

    async ObtenerSituacion(situacionId, oficinaLocalId) {
      const filas = await Consultar(`
SELECT
  sit.situacion_id,
  sit.sesion_id,
  sit.referencia_id,
  sit.caso_id,
  ses.oficina_local_id,
  CONVERT(char(10), ses.fecha, 23) AS fecha
FROM dbo.ses_situacion AS sit
INNER JOIN dbo.ses_sesion AS ses
  ON ses.sesion_id = sit.sesion_id
WHERE sit.situacion_id = @situacionId
  AND ses.oficina_local_id = @oficina
`, {
        situacionId: Parametro(sql.BigInt, situacionId),
        oficina: Parametro(sql.Int, oficinaLocalId)
      });
      return filas[0] || null;
    },

    async RegistrarValoracion(registro) {
      return EnTransaccion(async (transaccion) => {
        if (registro.casoId !== null) {
          await transaccion.query(`
UPDATE dbo.ses_valoracion
SET es_vigente = 0
WHERE caso_id = @casoId
  AND es_vigente = 1
`, { casoId: Parametro(sql.BigInt, registro.casoId) });
        }
        const insertadas = await transaccion.query(`
INSERT INTO dbo.ses_valoracion (
  situacion_id, caso_id, referencia_id, instrumento_version_id, numero, es_vigente,
  matriz_version_id, riesgo_codigo, proteccion_codigo, prioridad_codigo,
  responsable_usuario, fecha_valoracion, confirmada_en
)
OUTPUT INSERTED.valoracion_id
VALUES (
  @situacionId, @casoId, @referenciaId, @instrumentoId, @numero, 1,
  @matrizId, @riesgo, @proteccion, @prioridad,
  @responsable, @fecha, CAST(SYSUTCDATETIME() AS datetime2(0))
)
`, {
          situacionId: Parametro(sql.BigInt, registro.situacionId),
          casoId: Parametro(sql.BigInt, registro.casoId),
          referenciaId: Parametro(sql.BigInt, registro.referenciaId),
          instrumentoId: Parametro(sql.BigInt, registro.instrumentoVersionId),
          numero: Parametro(sql.Int, registro.numero),
          matrizId: Parametro(sql.BigInt, registro.matrizVersionId),
          riesgo: Parametro(sql.NVarChar(20), registro.riesgoCodigo),
          proteccion: Parametro(sql.NVarChar(20), registro.proteccionCodigo),
          prioridad: Parametro(sql.NVarChar(20), registro.prioridadCodigo),
          responsable: Parametro(sql.NVarChar(128), registro.responsable),
          fecha: Parametro(sql.Date, registro.fecha)
        });
        const valoracionId = Number(insertadas[0].valoracion_id);
        for (const categoria of registro.categorias) {
          await transaccion.query(`
INSERT INTO dbo.ses_valoracion_categoria (
  valoracion_id, categoria_id, respuesta, instrumento_version_id
)
VALUES (@valoracionId, @categoriaId, @respuesta, @instrumentoId)
`, {
            valoracionId: Parametro(sql.BigInt, valoracionId),
            categoriaId: Parametro(sql.BigInt, categoria.categoriaId),
            respuesta: Parametro(sql.NVarChar(20), categoria.respuesta),
            instrumentoId: Parametro(sql.BigInt, registro.instrumentoVersionId)
          });
          if (categoria.respuesta !== 'FACTORES') {
            continue;
          }
          for (const factor of categoria.factores) {
            await transaccion.query(`
INSERT INTO dbo.ses_valoracion_factor (
  valoracion_id, categoria_id, factor_id, especificacion, respuesta_enlace
)
VALUES (@valoracionId, @categoriaId, @factorId, @especificacion, N'FACTORES')
`, {
              valoracionId: Parametro(sql.BigInt, valoracionId),
              categoriaId: Parametro(sql.BigInt, categoria.categoriaId),
              factorId: Parametro(sql.BigInt, factor.factorId),
              especificacion: Parametro(sql.NVarChar(1000), factor.especificacion)
            });
          }
        }
        if (registro.casoId !== null) {
          await transaccion.query(`
UPDATE dbo.caso_ai
SET valoracion_vigente_id = @valoracionId
WHERE caso_id = @casoId
  AND estado = N'ACTIVO'
`, {
            valoracionId: Parametro(sql.BigInt, valoracionId),
            casoId: Parametro(sql.BigInt, registro.casoId)
          });
        }
        if (registro.casoId !== null && registro.abordaje) {
          await GuardarVersionPlan(transaccion, {
            casoId: registro.casoId,
            abordaje: registro.abordaje,
            responsable: registro.responsable,
            fecha: registro.fecha
          });
        }
        await transaccion.query(`
INSERT INTO dbo.aud_evento (
  ocurrido_en, usuario, rol, accion, entidad, entidad_id, ambito, codigo_cambio
)
VALUES (
  CAST(SYSUTCDATETIME() AS datetime2(0)),
  @responsable, @rol, N'CREACION', N'ses_valoracion', @entidadId, @ambito,
  N'VALORACION_CONFIRMADA'
)
`, {
          responsable: Parametro(sql.NVarChar(128), registro.responsable),
          rol: Parametro(sql.NVarChar(40), registro.rol),
          entidadId: Parametro(sql.NVarChar(40), String(valoracionId)),
          ambito: Parametro(sql.NVarChar(200), registro.ambitoTexto)
        });
        return valoracionId;
      });
    },

    async ContarValoraciones(referenciaId, casoId) {
      const filas = await Consultar(`
SELECT COUNT(*) AS total
FROM dbo.ses_valoracion
WHERE (@casoId IS NOT NULL AND caso_id = @casoId)
   OR (@casoId IS NULL AND referencia_id = @referenciaId AND caso_id IS NULL)
`, {
        casoId: Parametro(sql.BigInt, casoId),
        referenciaId: Parametro(sql.BigInt, referenciaId)
      });
      return Number(filas[0].total);
    },

    async ObtenerValoracionEnSesion(valoracionId, referenciaId, sesionId) {
      const filas = await Consultar(`
SELECT v.valoracion_id, v.referencia_id, v.caso_id, v.es_vigente
FROM dbo.ses_valoracion AS v
INNER JOIN dbo.ses_situacion AS sit
  ON sit.situacion_id = v.situacion_id
WHERE v.valoracion_id = @valoracionId
  AND v.referencia_id = @referenciaId
  AND sit.sesion_id = @sesionId
  AND v.es_vigente = 1
`, {
        valoracionId: Parametro(sql.BigInt, valoracionId),
        referenciaId: Parametro(sql.BigInt, referenciaId),
        sesionId: Parametro(sql.BigInt, sesionId)
      });
      return filas[0] || null;
    },

    async ObtenerResolucion(referenciaId) {
      const filas = await Consultar(`
SELECT resolucion_id, decision, valoracion_id, sesion_id
FROM dbo.ses_resolucion
WHERE referencia_id = @referenciaId
`, { referenciaId: Parametro(sql.BigInt, referenciaId) });
      return filas[0] || null;
    },

    async RegistrarResolucion(registro) {
      return EnTransaccion(async (transaccion) => {
        const insertadas = await transaccion.query(`
INSERT INTO dbo.ses_resolucion (
  referencia_id, sesion_id, valoracion_id, decision, justificacion,
  responsable_usuario, fecha_decision, registrada_en
)
OUTPUT INSERTED.resolucion_id
VALUES (
  @referenciaId, @sesionId, @valoracionId, @decision, @justificacion,
  @responsable, @fecha, CAST(SYSUTCDATETIME() AS datetime2(0))
)
`, {
          referenciaId: Parametro(sql.BigInt, registro.referenciaId),
          sesionId: Parametro(sql.BigInt, registro.sesionId),
          valoracionId: Parametro(sql.BigInt, registro.valoracionId),
          decision: Parametro(sql.NVarChar(20), registro.decision),
          justificacion: Parametro(sql.NVarChar(2000), registro.justificacion),
          responsable: Parametro(sql.NVarChar(128), registro.responsable),
          fecha: Parametro(sql.Date, registro.fecha)
        });
        if (registro.decision === 'NO_REQUIERE_AI') {
          const actualizadas = await transaccion.query(`
UPDATE dbo.ref_referencia
SET estado = N'NO_REQUIERE_AI'
OUTPUT INSERTED.referencia_id
WHERE referencia_id = @referenciaId
  AND estado = N'PENDIENTE_REVISION'
`, { referenciaId: Parametro(sql.BigInt, registro.referenciaId) });
          if (actualizadas.length !== 1) {
            throw ErrorDominio('ESTADO_INVALIDO');
          }
        }
        await transaccion.query(`
INSERT INTO dbo.aud_evento (
  ocurrido_en, usuario, rol, accion, entidad, entidad_id, ambito, codigo_cambio
)
VALUES (
  CAST(SYSUTCDATETIME() AS datetime2(0)),
  @responsable, @rol, N'RESOLUCION', N'ses_resolucion', @entidadId, @ambito, @codigo
)
`, {
          responsable: Parametro(sql.NVarChar(128), registro.responsable),
          rol: Parametro(sql.NVarChar(40), registro.rol),
          entidadId: Parametro(sql.NVarChar(40), String(insertadas[0].resolucion_id)),
          ambito: Parametro(sql.NVarChar(200), registro.ambitoTexto),
          codigo: Parametro(sql.NVarChar(80), registro.decision)
        });
        return Number(insertadas[0].resolucion_id);
      });
    },

    async AbrirCaso(registro) {
      return EnTransaccion(async (transaccion) => {
        const activos = await transaccion.query(`
SELECT caso_id
FROM dbo.caso_ai WITH (UPDLOCK, HOLDLOCK)
WHERE per_id_persona = @persona
  AND estado = N'ACTIVO'
`, { persona: Parametro(sql.NVarChar(20), registro.personaId) });
        if (activos.length > 0) {
          throw ErrorDominio('CASO_ACTIVO');
        }
        const resoluciones = await transaccion.query(`
SELECT decision, valoracion_id
FROM dbo.ses_resolucion
WHERE referencia_id = @referenciaId
`, { referenciaId: Parametro(sql.BigInt, registro.referenciaId) });
        const resolucion = resoluciones[0];
        const valoracionCoincide = resolucion
          && resolucion.decision === 'REQUIERE_AI'
          && Number(resolucion.valoracion_id) === registro.valoracionId;
        if (!valoracionCoincide) {
          throw ErrorDominio('ESTADO_INVALIDO');
        }
        const referencias = await transaccion.query(`
UPDATE dbo.ref_referencia
SET estado = N'ADMITIDA_AI'
OUTPUT
  INSERTED.referencia_id,
  INSERTED.per_id_persona,
  INSERTED.consecutivo,
  INSERTED.establecimiento_id,
  INSERTED.oficina_local_id,
  INSERTED.region_id
WHERE referencia_id = @referenciaId
  AND estado = N'PENDIENTE_REVISION'
  AND oficina_local_id = @oficina
  AND region_id = @region
`, {
          referenciaId: Parametro(sql.BigInt, registro.referenciaId),
          oficina: Parametro(sql.Int, registro.oficinaLocalId),
          region: Parametro(sql.Int, registro.regionId)
        });
        if (referencias.length !== 1) {
          throw ErrorDominio('ESTADO_INVALIDO');
        }
        const referencia = referencias[0];
        const casos = await transaccion.query(`
INSERT INTO dbo.caso_ai (
  per_id_persona, referencia_id, estado, fecha_apertura, abierto_en, abierto_por,
  establecimiento_id, oficina_local_id, region_id, consecutivo_origen, valoracion_vigente_id
)
OUTPUT INSERTED.caso_id
VALUES (
  @persona, @referenciaId, N'ACTIVO', @fecha, CAST(SYSUTCDATETIME() AS datetime2(0)),
  @responsable, @establecimiento, @oficina, @region, @consecutivo, @valoracionId
)
`, {
          persona: Parametro(sql.NVarChar(20), referencia.per_id_persona),
          referenciaId: Parametro(sql.BigInt, referencia.referencia_id),
          fecha: Parametro(sql.Date, registro.fecha),
          responsable: Parametro(sql.NVarChar(128), registro.responsable),
          establecimiento: Parametro(sql.Int, referencia.establecimiento_id),
          oficina: Parametro(sql.Int, referencia.oficina_local_id),
          region: Parametro(sql.Int, referencia.region_id),
          consecutivo: Parametro(sql.NVarChar(80), referencia.consecutivo),
          valoracionId: Parametro(sql.BigInt, registro.valoracionId)
        });
        const casoId = Number(casos[0].caso_id);
        await transaccion.query(`
INSERT INTO dbo.caso_estado_historial (caso_id, estado, ocurrido_en, usuario)
VALUES (@casoId, N'ACTIVO', CAST(SYSUTCDATETIME() AS datetime2(0)), @responsable)
`, {
          casoId: Parametro(sql.BigInt, casoId),
          responsable: Parametro(sql.NVarChar(128), registro.responsable)
        });
        const valoraciones = await transaccion.query(`
UPDATE dbo.ses_valoracion
SET caso_id = @casoId
OUTPUT INSERTED.valoracion_id
WHERE valoracion_id = @valoracionId
  AND referencia_id = @referenciaId
  AND caso_id IS NULL
  AND es_vigente = 1
`, {
          casoId: Parametro(sql.BigInt, casoId),
          valoracionId: Parametro(sql.BigInt, registro.valoracionId),
          referenciaId: Parametro(sql.BigInt, referencia.referencia_id)
        });
        if (valoraciones.length !== 1) {
          throw ErrorDominio('ESTADO_INVALIDO');
        }
        const planes = await transaccion.query(`
INSERT INTO dbo.caso_plan (
  caso_id, numero_version, es_vigente, frecuencia_item_id, frecuencia_catalogo,
  responsable_usuario, fecha_plan, registrado_en
)
OUTPUT INSERTED.plan_id
VALUES (
  @casoId, 1, 1, @frecuenciaId, N'FRECUENCIA',
  @responsable, @fecha, CAST(SYSUTCDATETIME() AS datetime2(0))
)
`, {
          casoId: Parametro(sql.BigInt, casoId),
          frecuenciaId: Parametro(sql.BigInt, registro.frecuenciaItemId),
          responsable: Parametro(sql.NVarChar(128), registro.responsable),
          fecha: Parametro(sql.Date, registro.fecha)
        });
        const planId = Number(planes[0].plan_id);
        for (let indice = 0; indice < registro.propositos.length; indice += 1) {
          await transaccion.query(`
INSERT INTO dbo.caso_plan_proposito (plan_id, orden, texto)
VALUES (@planId, @orden, @texto)
`, {
            planId: Parametro(sql.BigInt, planId),
            orden: Parametro(sql.Int, indice + 1),
            texto: Parametro(sql.NVarChar(1000), registro.propositos[indice])
          });
        }
        for (const estrategiaId of registro.estrategias) {
          await transaccion.query(`
INSERT INTO dbo.caso_plan_estrategia (plan_id, estrategia_item_id, estrategia_catalogo)
VALUES (@planId, @estrategiaId, N'ESTRATEGIA')
`, {
            planId: Parametro(sql.BigInt, planId),
            estrategiaId: Parametro(sql.BigInt, estrategiaId)
          });
        }
        for (const disciplinaId of registro.disciplinas) {
          await transaccion.query(`
INSERT INTO dbo.caso_plan_disciplina (plan_id, disciplina_item_id, disciplina_catalogo)
VALUES (@planId, @disciplinaId, N'DISCIPLINA')
`, {
            planId: Parametro(sql.BigInt, planId),
            disciplinaId: Parametro(sql.BigInt, disciplinaId)
          });
        }
        await transaccion.query(`
UPDATE dbo.caso_ai
SET plan_vigente_id = @planId
WHERE caso_id = @casoId
`, {
          planId: Parametro(sql.BigInt, planId),
          casoId: Parametro(sql.BigInt, casoId)
        });
        await transaccion.query(`
INSERT INTO dbo.aud_evento (
  ocurrido_en, usuario, rol, accion, entidad, entidad_id, ambito, codigo_cambio
)
VALUES (
  CAST(SYSUTCDATETIME() AS datetime2(0)),
  @responsable, @rol, N'APERTURA', N'caso_ai', @entidadId, @ambito, N'CASO_ABIERTO'
)
`, {
          responsable: Parametro(sql.NVarChar(128), registro.responsable),
          rol: Parametro(sql.NVarChar(40), registro.rol),
          entidadId: Parametro(sql.NVarChar(40), String(casoId)),
          ambito: Parametro(sql.NVarChar(200), registro.ambitoTexto)
        });
        return {
          casoId,
          personaId: referencia.per_id_persona,
          consecutivo: referencia.consecutivo
        };
      });
    },

    async ContarReferencias(ambito, estado) {
      const parametros = {};
      const clausulas = [];
      AgregarAmbito('ref', ambito, parametros, clausulas);
      if (estado) {
        parametros.estado = Parametro(sql.NVarChar(30), estado);
        clausulas.push('ref.estado = @estado');
      }
      // El conteo usa los mismos vínculos que la consulta, para no contar cabeceras incompletas.
      const filas = await Consultar(`
SELECT COUNT(*) AS total
FROM dbo.ref_referencia AS ref
INNER JOIN dbo.ref_contexto AS contexto
  ON contexto.referencia_id = ref.referencia_id
INNER JOIN dbo.cat_item AS via
  ON via.cat_item_id = ref.via_item_id
 AND via.codigo_catalogo = ref.via_catalogo
INNER JOIN dbo.cat_item AS origen
  ON origen.cat_item_id = ref.origen_item_id
 AND origen.codigo_catalogo = ref.origen_catalogo
WHERE ${clausulas.join(' AND ')}
`, parametros);
      return Number(filas[0].total);
    },

    async ContarCasos(ambito, estado) {
      const parametros = {};
      const clausulas = [];
      AgregarAmbito('caso', ambito, parametros, clausulas);
      if (estado) {
        parametros.estado = Parametro(sql.NVarChar(20), estado);
        clausulas.push('caso.estado = @estado');
      }
      const filas = await Consultar(`
SELECT
  COUNT(*) AS total,
  COUNT(DISTINCT caso.per_id_persona) AS personas
FROM dbo.caso_lista_establecimiento AS caso
WHERE ${clausulas.join(' AND ')}
`, parametros);
      return { total: Number(filas[0].total), personas: Number(filas[0].personas) };
    },

    async ListarProximasSesiones(oficinaLocalId, fecha) {
      return Consultar(`
SELECT TOP (5)
  sesion_id,
  CONVERT(char(10), fecha, 23) AS fecha,
  CONVERT(char(5), hora_inicio, 108) AS hora_inicio,
  lugar
FROM dbo.ses_sesion
WHERE oficina_local_id = @oficina
  AND fecha >= @fecha
ORDER BY fecha, hora_inicio, sesion_id
`, {
        oficina: Parametro(sql.Int, oficinaLocalId),
        fecha: Parametro(sql.Date, fecha)
      });
    },

    async ListarCasos(consulta) {
      const parametros = {
        desplazamiento: Parametro(sql.Int, consulta.desplazamiento),
        tamano: Parametro(sql.Int, consulta.tamano)
      };
      const clausulas = [];
      AgregarAmbito('caso', consulta.ambito, parametros, clausulas);
      if (consulta.estado) {
        parametros.estado = Parametro(sql.NVarChar(20), consulta.estado);
        clausulas.push('caso.estado = @estado');
      }
      if (consulta.prioridad) {
        parametros.prioridad = Parametro(sql.NVarChar(20), consulta.prioridad);
        clausulas.push('caso.prioridad_codigo = @prioridad');
      }
      if (Array.isArray(consulta.personas)) {
        if (consulta.personas.length === 0) {
          return { total: 0, filas: [] };
        }
        clausulas.push(`caso.per_id_persona IN (${ListaPersonas(consulta.personas, parametros)})`);
      }
      const donde = clausulas.join(' AND ');
      const conteo = await Consultar(`
SELECT COUNT(*) AS total
FROM dbo.caso_lista_establecimiento AS caso
WHERE ${donde}
`, parametros);
      const filas = await Consultar(`
SELECT
  caso.caso_id,
  caso.per_id_persona,
  caso.establecimiento_id,
  caso.estado,
  caso.prioridad_codigo,
  CONVERT(char(10), caso.fecha_apertura, 23) AS fecha_apertura,
  CONVERT(char(10), caso.fecha_cierre, 23) AS fecha_cierre
FROM dbo.caso_lista_establecimiento AS caso
WHERE ${donde}
ORDER BY caso.fecha_apertura DESC, caso.caso_id DESC
OFFSET @desplazamiento ROWS FETCH NEXT @tamano ROWS ONLY
`, parametros);
      return { total: Number(conteo[0].total), filas };
    },

    async ObtenerDetalleCaso(casoId, ambito) {
      const parametros = { casoId: Parametro(sql.BigInt, casoId) };
      const clausulas = ['caso.caso_id = @casoId'];
      AgregarAmbito('caso', ambito, parametros, clausulas);
      const casos = await Consultar(`
SELECT
  caso.caso_id,
  caso.per_id_persona,
  caso.referencia_id,
  caso.estado,
  CONVERT(char(10), caso.fecha_apertura, 23) AS fecha_apertura,
  caso.establecimiento_id,
  caso.oficina_local_id,
  caso.consecutivo_origen,
  caso.valoracion_vigente_id,
  caso.plan_vigente_id,
  ctx.encargado_nombre,
  ctx.relacion_encargado,
  ctx.contacto,
  ctx.direccion,
  ctx.establecimiento_nombre
FROM dbo.caso_ai AS caso
LEFT JOIN dbo.ref_contexto AS ctx
  ON ctx.referencia_id = caso.referencia_id
WHERE ${clausulas.join(' AND ')}
`, parametros);
      if (casos.length === 0) {
        return null;
      }
      const caso = casos[0];
      const valoraciones = await Consultar(`
SELECT
  v.valoracion_id,
  v.numero,
  v.es_vigente,
  v.riesgo_codigo,
  v.proteccion_codigo,
  v.prioridad_codigo,
  v.instrumento_version_id,
  v.responsable_usuario,
  CONVERT(char(10), v.fecha_valoracion, 23) AS fecha_valoracion,
  ses.sesion_id,
  CONVERT(char(10), ses.fecha, 23) AS fecha_sesion
FROM dbo.ses_valoracion AS v
INNER JOIN dbo.ses_situacion AS sit
  ON sit.situacion_id = v.situacion_id
INNER JOIN dbo.ses_sesion AS ses
  ON ses.sesion_id = sit.sesion_id
WHERE v.caso_id = @casoId
ORDER BY v.numero, v.valoracion_id
`, { casoId: Parametro(sql.BigInt, casoId) });
      const factores = await Consultar(`
SELECT
  fac.valoracion_id,
  cat.eje,
  cat.ambito,
  item.etiqueta,
  fac.especificacion
FROM dbo.ses_valoracion_factor AS fac
INNER JOIN dbo.ses_valoracion AS v
  ON v.valoracion_id = fac.valoracion_id
INNER JOIN dbo.cat_instrumento_categoria AS cat
  ON cat.categoria_id = fac.categoria_id
INNER JOIN dbo.cat_instrumento_factor AS item
  ON item.factor_id = fac.factor_id
WHERE v.caso_id = @casoId
ORDER BY v.numero, cat.orden, item.orden
`, { casoId: Parametro(sql.BigInt, casoId) });
      const historial = await Consultar(`
SELECT
  estado,
  CONVERT(char(19), ocurrido_en, 120) AS ocurrido_en
FROM dbo.caso_estado_historial
WHERE caso_id = @casoId
ORDER BY ocurrido_en, historial_id
`, { casoId: Parametro(sql.BigInt, casoId) });
      let plan = null;
      if (caso.plan_vigente_id !== null && caso.plan_vigente_id !== undefined) {
        const planes = await Consultar(`
SELECT p.plan_id, i.codigo AS frecuencia_codigo, i.etiqueta AS frecuencia_etiqueta
FROM dbo.caso_plan AS p
INNER JOIN dbo.cat_item AS i
  ON i.cat_item_id = p.frecuencia_item_id
 AND i.codigo_catalogo = p.frecuencia_catalogo
WHERE p.plan_id = @planId
  AND p.caso_id = @casoId
  AND p.es_vigente = 1
`, {
          planId: Parametro(sql.BigInt, caso.plan_vigente_id),
          casoId: Parametro(sql.BigInt, casoId)
        });
        if (planes.length === 1) {
          const planId = planes[0].plan_id;
          const [propositos, estrategias, disciplinas] = await Promise.all([
            Consultar(`
SELECT orden, texto
FROM dbo.caso_plan_proposito
WHERE plan_id = @planId
ORDER BY orden
`, { planId: Parametro(sql.BigInt, planId) }),
            Consultar(`
SELECT i.etiqueta
FROM dbo.caso_plan_estrategia AS e
INNER JOIN dbo.cat_item AS i
  ON i.cat_item_id = e.estrategia_item_id
 AND i.codigo_catalogo = e.estrategia_catalogo
WHERE e.plan_id = @planId
ORDER BY i.orden
`, { planId: Parametro(sql.BigInt, planId) }),
            Consultar(`
SELECT i.etiqueta
FROM dbo.caso_plan_disciplina AS d
INNER JOIN dbo.cat_item AS i
  ON i.cat_item_id = d.disciplina_item_id
 AND i.codigo_catalogo = d.disciplina_catalogo
WHERE d.plan_id = @planId
ORDER BY i.orden
`, { planId: Parametro(sql.BigInt, planId) })
          ]);
          plan = { ...planes[0], propositos, estrategias, disciplinas };
        }
      }
      return { caso, valoraciones, factores, historial, plan };
    },

    /**
     * Última atención efectiva del caso. RF-126 cuenta la atención individual
     * y la asistencia grupal. Una convocatoria sin asistencia no cuenta.
     *
     * @param {number} casoId Caso ya autorizado.
     * @returns {Promise<string|null>} Fecha o null si nunca hubo atención efectiva.
     */
    async ObtenerUltimaAtencion(casoId) {
      const filas = await Consultar(`
SELECT CONVERT(char(10), MAX(fecha), 23) AS fecha_atencion
FROM (
  SELECT individual.fecha_atencion AS fecha
  FROM dbo.ate_individual AS individual
  WHERE individual.caso_id = @casoId
  UNION ALL
  SELECT grupal.fecha_atencion
  FROM dbo.ate_grupal_participante AS participante
  INNER JOIN dbo.ate_grupal AS grupal
    ON grupal.atencion_grupal_id = participante.atencion_grupal_id
  WHERE participante.caso_id = @casoId
    AND participante.asistio = 1
) AS efectivas
`, { casoId: Parametro(sql.BigInt, casoId) });
      return filas[0] ? filas[0].fecha_atencion : null;
    },

    async ListarAtencionesIndividuales(casoId) {
      return Consultar(`
SELECT
  atencion_individual_id,
  CONVERT(char(10), fecha_atencion, 23) AS fecha_atencion,
  CONVERT(char(19), digitada_en, 120) AS digitada_en,
  acciones,
  recomendaciones,
  profesional_usuario,
  proxima_accion,
  CONVERT(char(10), fecha_proxima, 23) AS fecha_proxima,
  disciplina_item_id,
  estrategia_item_id
FROM dbo.ate_individual
WHERE caso_id = @casoId
ORDER BY fecha_atencion, atencion_individual_id
`, { casoId: Parametro(sql.BigInt, casoId) });
    },

    async ListarParticipacionesGrupales(casoId) {
      return Consultar(`
SELECT
  g.atencion_grupal_id,
  CONVERT(char(10), g.fecha_atencion, 23) AS fecha_atencion,
  g.tema,
  p.asistio,
  p.per_id_persona
FROM dbo.ate_grupal_participante AS p
INNER JOIN dbo.ate_grupal AS g
  ON g.atencion_grupal_id = p.atencion_grupal_id
WHERE p.caso_id = @casoId
ORDER BY g.fecha_atencion, g.atencion_grupal_id
`, { casoId: Parametro(sql.BigInt, casoId) });
    },

    async ListarPlanesCaso(casoId) {
      return Consultar(`
SELECT
  p.plan_id,
  p.numero_version,
  p.es_vigente,
  CONVERT(char(10), p.fecha_plan, 23) AS fecha_plan,
  p.responsable_usuario,
  i.etiqueta AS frecuencia_etiqueta
FROM dbo.caso_plan AS p
INNER JOIN dbo.cat_item AS i
  ON i.cat_item_id = p.frecuencia_item_id
 AND i.codigo_catalogo = p.frecuencia_catalogo
WHERE p.caso_id = @casoId
ORDER BY p.numero_version
`, { casoId: Parametro(sql.BigInt, casoId) });
    },

    async ContarDocumentosCaso(casoId) {
      const filas = await Consultar(`
SELECT COUNT(*) AS total
FROM dbo.doc_documento
WHERE caso_id = @casoId
`, { casoId: Parametro(sql.BigInt, casoId) });
      return Number(filas[0].total);
    },

    async ContarCoordinacionesCaso(casoId) {
      const filas = await Consultar(`
SELECT COUNT(*) AS total
FROM dbo.doc_coordinacion
WHERE caso_id = @casoId
`, { casoId: Parametro(sql.BigInt, casoId) });
      return Number(filas[0].total);
    },

    async ContarAtencionesAmbito(ambito) {
      const individuales = {};
      const clausulasIndividual = [];
      AgregarAmbito('caso', ambito, individuales, clausulasIndividual);
      const filasIndividual = await Consultar(`
SELECT COUNT(*) AS total
FROM dbo.ate_individual AS atencion
INNER JOIN dbo.caso_ai AS caso
  ON caso.caso_id = atencion.caso_id
WHERE ${clausulasIndividual.join(' AND ')}
`, individuales);
      const grupales = { grupalesDisponibles: true, grupales: 0 };
      try {
        const parametrosGrupo = {};
        const clausulasGrupo = ['p.asistio = 1'];
        AgregarAmbito('caso', ambito, parametrosGrupo, clausulasGrupo);
        const filasGrupo = await Consultar(`
SELECT COUNT(DISTINCT g.atencion_grupal_id) AS total
FROM dbo.ate_grupal_participante AS p
INNER JOIN dbo.ate_grupal AS g
  ON g.atencion_grupal_id = p.atencion_grupal_id
INNER JOIN dbo.caso_ai AS caso
  ON caso.caso_id = p.caso_id
WHERE ${clausulasGrupo.join(' AND ')}
`, parametrosGrupo);
        grupales.grupales = Number(filasGrupo[0].total);
      } catch (error) {
        if (error && error.code === 'PERMISO') {
          grupales.grupalesDisponibles = false;
        } else {
          throw error;
        }
      }
      return {
        individuales: Number(filasIndividual[0].total),
        ...grupales
      };
    },

    async ListarProximasAcciones(ambito, fecha, limite) {
      const parametros = {
        fecha: Parametro(sql.Date, fecha),
        limite: Parametro(sql.Int, limite)
      };
      const clausulas = ['atencion.fecha_proxima >= @fecha'];
      AgregarAmbito('caso', ambito, parametros, clausulas);
      return Consultar(`
SELECT TOP (@limite)
  atencion.caso_id,
  atencion.per_id_persona,
  atencion.proxima_accion,
  CONVERT(char(10), atencion.fecha_proxima, 23) AS fecha_proxima
FROM dbo.ate_individual AS atencion
INNER JOIN dbo.caso_ai AS caso
  ON caso.caso_id = atencion.caso_id
WHERE ${clausulas.join(' AND ')}
ORDER BY atencion.fecha_proxima, atencion.atencion_individual_id
`, parametros);
    },

    async ContarActividadesVencidas(oficinaLocalId, fecha) {
      const filas = await Consultar(`
SELECT COUNT(*) AS total
FROM dbo.prog_actividad
WHERE oficina_local_id = @oficina
  AND estado = N'PROGRAMADA'
  AND fecha_vigente < @fecha
`, {
        oficina: Parametro(sql.Int, oficinaLocalId),
        fecha: Parametro(sql.Date, fecha)
      });
      return Number(filas[0].total);
    },

    /**
     * Casos activos del ámbito sin atención efectiva dentro del período.
     * La programación no cuenta. La asistencia grupal nula o ausente tampoco.
     *
     * @param {object} consulta Ámbito, fechas y página.
     * @returns {Promise<object>} Total y filas.
     */
    async ListarCasosSinAtencion(consulta) {
      const parametros = {
        desde: Parametro(sql.Date, consulta.desde),
        hasta: Parametro(sql.Date, consulta.hasta),
        desplazamiento: Parametro(sql.Int, consulta.desplazamiento),
        tamano: Parametro(sql.Int, consulta.tamano)
      };
      const clausulas = ["caso.estado = N'ACTIVO'"];
      AgregarAmbito('caso', consulta.ambito, parametros, clausulas);
      const donde = clausulas.join(' AND ');
      const ausencia = `
  AND NOT EXISTS (
    SELECT 1
    FROM dbo.ate_individual AS individual
    WHERE individual.caso_id = caso.caso_id
      AND individual.fecha_atencion >= @desde
      AND individual.fecha_atencion <= @hasta
  )
  AND NOT EXISTS (
    SELECT 1
    FROM dbo.ate_grupal_participante AS participante
    INNER JOIN dbo.ate_grupal AS grupal
      ON grupal.atencion_grupal_id = participante.atencion_grupal_id
    WHERE participante.caso_id = caso.caso_id
      AND participante.asistio = 1
      AND grupal.fecha_atencion >= @desde
      AND grupal.fecha_atencion <= @hasta
  )`;
      const conteo = await Consultar(`
SELECT COUNT(*) AS total
FROM dbo.caso_ai AS caso
WHERE ${donde}
${ausencia}
`, parametros);
      const filas = await Consultar(`
SELECT
  caso.caso_id,
  caso.per_id_persona,
  caso.establecimiento_id,
  CONVERT(char(10), (
    SELECT MAX(fecha_atencion)
    FROM dbo.ate_individual AS individual
    WHERE individual.caso_id = caso.caso_id
  ), 23) AS ultima_individual,
  CONVERT(char(10), (
    SELECT MAX(grupal.fecha_atencion)
    FROM dbo.ate_grupal_participante AS participante
    INNER JOIN dbo.ate_grupal AS grupal
      ON grupal.atencion_grupal_id = participante.atencion_grupal_id
    WHERE participante.caso_id = caso.caso_id
      AND participante.asistio = 1
  ), 23) AS ultima_grupal
FROM dbo.caso_ai AS caso
WHERE ${donde}
${ausencia}
ORDER BY caso.caso_id
OFFSET @desplazamiento ROWS FETCH NEXT @tamano ROWS ONLY
`, parametros);
      return { total: Number(conteo[0].total), filas };
    },

    async ListarCoordinacionesCaso(casoId) {
      return Consultar(`
SELECT
  coordinacion_id,
  institucion_texto,
  profesional_responsable,
  digitador_usuario,
  motivo,
  CONVERT(char(10), fecha_coordinacion, 23) AS fecha_coordinacion,
  estado_texto
FROM dbo.doc_coordinacion
WHERE caso_id = @casoId
ORDER BY fecha_coordinacion, coordinacion_id
`, { casoId: Parametro(sql.BigInt, casoId) });
    },

    async ListarReportesCaso(casoId) {
      return Consultar(`
SELECT
  reporte_id,
  tipo_proposito,
  CONVERT(char(10), fecha_reporte, 23) AS fecha_reporte,
  responsable_usuario,
  motivo,
  CONVERT(char(19), creado_en, 120) AS creado_en
FROM dbo.doc_reporte_caso
WHERE caso_id = @casoId
ORDER BY fecha_reporte, reporte_id
`, { casoId: Parametro(sql.BigInt, casoId) });
    },

    async ObtenerCierreCaso(casoId) {
      const filas = await Consultar(`
SELECT
  cierre.motivo_codigo,
  item.etiqueta AS motivo_etiqueta,
  cierre.explicacion,
  CONVERT(char(10), cierre.fecha_cierre, 23) AS fecha_cierre,
  cierre.responsable_usuario,
  cierre.destino_establecimiento_id,
  cierre.destino_oficina_local_id,
  cierre.destino_region_id,
  cierre.destino_nombre
FROM dbo.caso_cierre AS cierre
INNER JOIN dbo.cat_item AS item
  ON item.cat_item_id = cierre.motivo_item_id
WHERE cierre.caso_id = @casoId
`, { casoId: Parametro(sql.BigInt, casoId) });
      return filas[0] || null;
    }
  };
}

module.exports = { CrearRepositorioProceso, AgregarAmbito, Parametro };

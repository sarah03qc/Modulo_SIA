/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * Modificación: 2026-11-16. El conteo del ámbito no aplica los filtros.
 * HU-044. La reprogramación actualiza la fecha vigente y conserva la fila.
 */
'use strict';

const sql = require('mssql');
const { ErrorInfraestructura } = require('../../common/errors');
const { Parametro } = require('../proceso-interdisciplinario/repositorio-proceso');

const ENTIDAD_CREACION = 'prog_actividad';
const ENTIDAD_RESOLUCION = 'prog_resolucion';
const CATALOGO_TIPO = 'TIPO_ACTIVIDAD_PROGRAMADA';

function ErrorDominio(codigo) {
  const error = new Error('La persistencia de la programación no se completó.');
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
  if (numero === 547) {
    return ErrorDominio('DATOS');
  }
  return error instanceof ErrorInfraestructura ? error : ErrorDominio('INFRAESTRUCTURA');
}

function Fecha(valor) {
  return valor ? String(valor).slice(0, 10) : null;
}

/**
 * Persistencia de programación sobre SIA_CENCINAI.
 *
 * @param {object} cliente Cliente SQL con transacción.
 * @returns {object} Consultas y escrituras.
 */
function CrearRepositorioProgramacion(cliente) {
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

  async function BuscarClave(transaccion, registro, entidad) {
    const filas = await transaccion.query(`
SELECT TOP (1) entidad_id
FROM dbo.aud_evento WITH (UPDLOCK, HOLDLOCK)
WHERE usuario = @usuario
  AND entidad = @entidad
  AND codigo_cambio = @clave
`, {
      usuario: Parametro(sql.NVarChar(128), registro.usuario),
      entidad: Parametro(sql.NVarChar(80), entidad),
      clave: Parametro(sql.NVarChar(80), registro.claveOperacion)
    });
    return filas[0] ? String(filas[0].entidad_id) : null;
  }

  async function Auditar(transaccion, registro, entidad, entidadId, accion) {
    await transaccion.query(`
INSERT INTO dbo.aud_evento (
  ocurrido_en, usuario, rol, accion, entidad, entidad_id, ambito, codigo_cambio
)
VALUES (
  CAST(SYSUTCDATETIME() AS datetime2(0)),
  @usuario, @rol, @accion, @entidad, @entidadId, @ambito, @clave
)
`, {
      usuario: Parametro(sql.NVarChar(128), registro.usuario),
      rol: Parametro(sql.NVarChar(40), registro.rol),
      accion: Parametro(sql.NVarChar(40), accion),
      entidad: Parametro(sql.NVarChar(80), entidad),
      entidadId: Parametro(sql.NVarChar(40), String(entidadId)),
      ambito: Parametro(sql.NVarChar(200), registro.ambito),
      clave: Parametro(sql.NVarChar(80), registro.claveOperacion)
    });
  }

  async function LeerActividad(transaccion, actividadId, oficina, region) {
    const filas = await transaccion.query(`
SELECT
  actividad_id,
  establecimiento_id,
  tipo_item_id,
  titulo,
  CONVERT(char(10), fecha_prevista, 23) AS fecha_prevista,
  CONVERT(char(10), fecha_vigente, 23) AS fecha_vigente,
  estado,
  motivo_vigente,
  observaciones,
  creada_por
FROM dbo.prog_actividad WITH (UPDLOCK, HOLDLOCK)
WHERE actividad_id = @id
  AND oficina_local_id = @oficina
  AND region_id = @region
`, {
      id: Parametro(sql.BigInt, actividadId),
      oficina: Parametro(sql.Int, oficina),
      region: Parametro(sql.Int, region)
    });
    if (filas.length !== 1) {
      throw ErrorDominio('NO_ENCONTRADO');
    }
    return filas[0];
  }

  async function LeerCambios(transaccion, actividadId) {
    return transaccion.query(`
SELECT
  numero,
  estado_anterior,
  estado_nuevo,
  CONVERT(char(10), fecha_anterior, 23) AS fecha_anterior,
  CONVERT(char(10), fecha_nueva, 23) AS fecha_nueva,
  motivo,
  usuario,
  CONVERT(char(19), ocurrido_en, 120) AS ocurrido_en
FROM dbo.prog_cambio
WHERE actividad_id = @id
ORDER BY numero
`, { id: Parametro(sql.BigInt, actividadId) });
  }

  async function BloquearCasos(transaccion, registro) {
    const personas = [];
    for (const casoId of registro.casos) {
      const filas = await transaccion.query(`
SELECT caso_id, per_id_persona, estado
FROM dbo.caso_ai WITH (UPDLOCK, HOLDLOCK)
WHERE caso_id = @casoId
  AND oficina_local_id = @oficina
  AND region_id = @region
`, {
        casoId: Parametro(sql.BigInt, casoId),
        oficina: Parametro(sql.Int, registro.oficinaLocalId),
        region: Parametro(sql.Int, registro.regionId)
      });
      if (filas.length !== 1) {
        throw ErrorDominio('NO_ENCONTRADO');
      }
      personas.push(filas[0]);
    }
    return personas;
  }

  function Presentar(fila, cambios) {
    return {
      actividadId: Number(fila.actividad_id),
      establecimientoId: fila.establecimiento_id === null
        ? null
        : Number(fila.establecimiento_id),
      tipoItemId: Number(fila.tipo_item_id),
      titulo: fila.titulo,
      fechaPrevista: Fecha(fila.fecha_prevista),
      fechaVigente: Fecha(fila.fecha_vigente),
      estado: fila.estado,
      motivo: fila.motivo_vigente,
      observaciones: fila.observaciones,
      responsable: fila.creada_por,
      cambios: (cambios || []).map((cambio) => ({
        numero: Number(cambio.numero),
        estadoAnterior: cambio.estado_anterior,
        estadoNuevo: cambio.estado_nuevo,
        fechaAnterior: Fecha(cambio.fecha_anterior),
        fechaNueva: Fecha(cambio.fecha_nueva),
        motivo: cambio.motivo,
        usuario: cambio.usuario,
        ocurridoEn: cambio.ocurrido_en
      }))
    };
  }

  return {
    async ListarTipos() {
      return Consultar(`
SELECT i.cat_item_id, i.codigo, i.etiqueta
FROM dbo.cat_item AS i
INNER JOIN dbo.cat_version AS v
  ON v.cat_version_id = i.cat_version_id
 AND v.codigo_catalogo = i.codigo_catalogo
WHERE i.activo = 1
  AND v.vigente = 1
  AND i.codigo_catalogo = @catalogo
ORDER BY i.orden, i.cat_item_id
`, { catalogo: Parametro(sql.NVarChar(40), CATALOGO_TIPO) });
    },

    async Contar(registro) {
      const filas = await Consultar(`
SELECT COUNT(*) AS total
FROM dbo.prog_actividad
WHERE oficina_local_id = @oficina
  AND region_id = @region
`, {
        oficina: Parametro(sql.Int, registro.oficinaLocalId),
        region: Parametro(sql.Int, registro.regionId)
      });
      return Number(filas[0].total);
    },

    async Listar(registro) {
      const parametros = {
        oficina: Parametro(sql.Int, registro.oficinaLocalId),
        region: Parametro(sql.Int, registro.regionId)
      };
      const clausulas = [
        'oficina_local_id = @oficina',
        'region_id = @region'
      ];
      if (registro.establecimientoId) {
        parametros.establecimiento = Parametro(sql.Int, registro.establecimientoId);
        clausulas.push('establecimiento_id = @establecimiento');
      }
      if (registro.estado) {
        parametros.estado = Parametro(sql.NVarChar(20), registro.estado);
        clausulas.push('estado = @estado');
      }
      return Consultar(`
SELECT
  actividad_id,
  establecimiento_id,
  tipo_item_id,
  titulo,
  CONVERT(char(10), fecha_prevista, 23) AS fecha_prevista,
  CONVERT(char(10), fecha_vigente, 23) AS fecha_vigente,
  estado,
  motivo_vigente,
  observaciones,
  creada_por
FROM dbo.prog_actividad
WHERE ${clausulas.join(' AND ')}
ORDER BY fecha_vigente, actividad_id
`, parametros);
    },

    async ListarPersonas(actividadIds) {
      if (actividadIds.length === 0) {
        return [];
      }
      const parametros = {};
      const nombres = actividadIds.map((id, indice) => {
        const nombre = `actividad${indice}`;
        parametros[nombre] = Parametro(sql.BigInt, id);
        return `@${nombre}`;
      });
      return Consultar(`
SELECT actividad_id, per_id_persona, caso_id
FROM dbo.prog_persona
WHERE actividad_id IN (${nombres.join(', ')})
ORDER BY actividad_id, per_id_persona
`, parametros);
    },

    async ListarCambios(actividadIds) {
      if (actividadIds.length === 0) {
        return [];
      }
      const parametros = {};
      const nombres = actividadIds.map((id, indice) => {
        const nombre = `actividad${indice}`;
        parametros[nombre] = Parametro(sql.BigInt, id);
        return `@${nombre}`;
      });
      return Consultar(`
SELECT
  actividad_id,
  numero,
  estado_anterior,
  estado_nuevo,
  CONVERT(char(10), fecha_anterior, 23) AS fecha_anterior,
  CONVERT(char(10), fecha_nueva, 23) AS fecha_nueva,
  motivo,
  usuario,
  CONVERT(char(19), ocurrido_en, 120) AS ocurrido_en
FROM dbo.prog_cambio
WHERE actividad_id IN (${nombres.join(', ')})
ORDER BY actividad_id, numero
`, parametros);
    },

    /**
     * Última atención de cada caso activo. Solo entra si esa atención
     * tiene acción y fecha. La frecuencia del plan no se consulta.
     */
    async ListarProximasAcciones(registro) {
      return Consultar(`
SELECT
  caso.caso_id,
  caso.per_id_persona,
  atencion.proxima_accion,
  CONVERT(char(10), atencion.fecha_proxima, 23) AS fecha_proxima,
  atencion.atencion_individual_id
FROM dbo.ate_individual AS atencion
INNER JOIN dbo.caso_ai AS caso
  ON caso.caso_id = atencion.caso_id
INNER JOIN (
  SELECT caso_id, MAX(atencion_individual_id) AS atencion_id
  FROM dbo.ate_individual
  GROUP BY caso_id
) AS ultima
  ON ultima.atencion_id = atencion.atencion_individual_id
WHERE caso.oficina_local_id = @oficina
  AND caso.region_id = @region
  AND caso.estado = N'ACTIVO'
  AND atencion.proxima_accion IS NOT NULL
  AND LTRIM(RTRIM(atencion.proxima_accion)) <> N''
  AND atencion.fecha_proxima IS NOT NULL
ORDER BY atencion.fecha_proxima, caso.caso_id
`, {
        oficina: Parametro(sql.Int, registro.oficinaLocalId),
        region: Parametro(sql.Int, registro.regionId)
      });
    },

    async Crear(registro) {
      return EnTransaccion(async (transaccion) => {
        const previa = await BuscarClave(transaccion, registro, ENTIDAD_CREACION);
        if (previa) {
          const fila = await LeerActividad(
            transaccion,
            Number(previa),
            registro.oficinaLocalId,
            registro.regionId
          );
          const cambios = await LeerCambios(transaccion, fila.actividad_id);
          return { repetida: true, actividad: Presentar(fila, cambios) };
        }
        const personas = await BloquearCasos(transaccion, registro);
        const insertadas = await transaccion.query(`
INSERT INTO dbo.prog_actividad (
  oficina_local_id, establecimiento_id, region_id, tipo_item_id, tipo_catalogo,
  titulo, fecha_prevista, fecha_vigente, estado, motivo_vigente, observaciones,
  creada_en, creada_por
)
OUTPUT inserted.actividad_id
VALUES (
  @oficina, @establecimiento, @region, @tipo, @catalogo,
  @titulo, @fecha, @fecha, N'PROGRAMADA', NULL, @observaciones,
  CAST(SYSUTCDATETIME() AS datetime2(0)), @usuario
)
`, {
          oficina: Parametro(sql.Int, registro.oficinaLocalId),
          establecimiento: Parametro(sql.Int, registro.establecimientoId),
          region: Parametro(sql.Int, registro.regionId),
          tipo: Parametro(sql.BigInt, registro.tipoItemId),
          catalogo: Parametro(sql.NVarChar(40), CATALOGO_TIPO),
          titulo: Parametro(sql.NVarChar(300), registro.titulo),
          fecha: Parametro(sql.Date, registro.fecha),
          observaciones: Parametro(sql.NVarChar(1000), registro.observaciones),
          usuario: Parametro(sql.NVarChar(128), registro.usuario)
        });
        const actividadId = Number(insertadas[0].actividad_id);
        await transaccion.query(`
INSERT INTO dbo.prog_cambio (
  actividad_id, numero, estado_anterior, estado_nuevo,
  fecha_anterior, fecha_nueva, motivo, usuario, ocurrido_en
)
VALUES (
  @id, 1, NULL, N'PROGRAMADA', NULL, @fecha, NULL, @usuario,
  CAST(SYSUTCDATETIME() AS datetime2(0))
)
`, {
          id: Parametro(sql.BigInt, actividadId),
          fecha: Parametro(sql.Date, registro.fecha),
          usuario: Parametro(sql.NVarChar(128), registro.usuario)
        });
        for (const persona of personas) {
          await transaccion.query(`
INSERT INTO dbo.prog_persona (actividad_id, per_id_persona, caso_id)
VALUES (@id, @persona, @caso)
`, {
            id: Parametro(sql.BigInt, actividadId),
            persona: Parametro(sql.NVarChar(20), persona.per_id_persona),
            caso: Parametro(sql.BigInt, persona.caso_id)
          });
        }
        await Auditar(transaccion, registro, ENTIDAD_CREACION, actividadId, 'CREAR');
        const fila = await LeerActividad(
          transaccion,
          actividadId,
          registro.oficinaLocalId,
          registro.regionId
        );
        const cambios = await LeerCambios(transaccion, actividadId);
        return { repetida: false, actividad: Presentar(fila, cambios) };
      });
    },

    async Resolver(registro) {
      return EnTransaccion(async (transaccion) => {
        const fila = await LeerActividad(
          transaccion,
          registro.actividadId,
          registro.oficinaLocalId,
          registro.regionId
        );
        const previa = await BuscarClave(transaccion, registro, ENTIDAD_RESOLUCION);
        if (previa) {
          if (previa !== String(fila.actividad_id)) {
            throw ErrorDominio('CLAVE_AJENA');
          }
          const cambios = await LeerCambios(transaccion, fila.actividad_id);
          return { repetida: true, actividad: Presentar(fila, cambios) };
        }
        if (fila.estado !== 'PROGRAMADA') {
          throw ErrorDominio('ESTADO');
        }
        const fechaNueva = registro.efecto === 'REPROGRAMADA'
          ? registro.nuevaFecha
          : Fecha(fila.fecha_vigente);
        if (registro.efecto === 'REPROGRAMADA' && fechaNueva === Fecha(fila.fecha_vigente)) {
          throw ErrorDominio('FECHA');
        }
        const motivo = registro.efecto === 'REALIZADA' ? null : registro.motivo;
        await transaccion.query(`
UPDATE dbo.prog_actividad
SET fecha_vigente = @fecha,
    estado = @estado,
    motivo_vigente = @motivo
WHERE actividad_id = @id
`, {
          id: Parametro(sql.BigInt, fila.actividad_id),
          fecha: Parametro(sql.Date, fechaNueva),
          estado: Parametro(sql.NVarChar(20), registro.efecto),
          motivo: Parametro(sql.NVarChar(500), motivo)
        });
        const numeros = await transaccion.query(`
SELECT ISNULL(MAX(numero), 0) AS ultimo
FROM dbo.prog_cambio WITH (UPDLOCK, HOLDLOCK)
WHERE actividad_id = @id
`, { id: Parametro(sql.BigInt, fila.actividad_id) });
        await transaccion.query(`
INSERT INTO dbo.prog_cambio (
  actividad_id, numero, estado_anterior, estado_nuevo,
  fecha_anterior, fecha_nueva, motivo, usuario, ocurrido_en
)
VALUES (
  @id, @numero, @anterior, @nuevo, @fechaAnterior, @fechaNueva, @motivo,
  @usuario, CAST(SYSUTCDATETIME() AS datetime2(0))
)
`, {
          id: Parametro(sql.BigInt, fila.actividad_id),
          numero: Parametro(sql.Int, Number(numeros[0].ultimo) + 1),
          anterior: Parametro(sql.NVarChar(20), fila.estado),
          nuevo: Parametro(sql.NVarChar(20), registro.efecto),
          fechaAnterior: Parametro(sql.Date, Fecha(fila.fecha_vigente)),
          fechaNueva: Parametro(sql.Date, fechaNueva),
          motivo: Parametro(sql.NVarChar(500), motivo),
          usuario: Parametro(sql.NVarChar(128), registro.usuario)
        });
        await Auditar(
          transaccion,
          registro,
          ENTIDAD_RESOLUCION,
          fila.actividad_id,
          registro.efecto
        );
        const actual = await LeerActividad(
          transaccion,
          fila.actividad_id,
          registro.oficinaLocalId,
          registro.regionId
        );
        const cambios = await LeerCambios(transaccion, fila.actividad_id);
        return { repetida: false, actividad: Presentar(actual, cambios) };
      });
    }
  };
}

module.exports = { CrearRepositorioProgramacion };

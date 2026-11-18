/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-18.
 * Persistencia de sugerencias sobre dbo.ref_posible y auditoría de la corrida.
 * HU-049, RF-127 y RN-037.
 */
'use strict';

const sql = require('mssql');
const { ErrorInfraestructura } = require('../../common/errors');
const { ACCESS_LEVEL } = require('../../infrastructure/auth/institutional-roles');
const { CRITERIO_DEMO, CRITERIO_CLINICO } = require('./configuracion-nutricion');

function Parametro(tipo, valor) {
  return { type: tipo, value: valor === undefined ? null : valor };
}

function AgregarAmbito(parametros, clausulas, ambito) {
  if (!ambito || ambito.accessLevel === ACCESS_LEVEL.ESTABLISHMENT) {
    const ids = ambito && ambito.establishmentIds;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ErrorInfraestructura('El ámbito de establecimientos no es utilizable.');
    }
    const nombres = ids.map((id, indice) => {
      const nombre = `establecimiento${indice}`;
      parametros[nombre] = Parametro(sql.Int, id);
      return `@${nombre}`;
    });
    clausulas.push(`sug.establecimiento_id IN (${nombres.join(', ')})`);
    return;
  }
  if (ambito.accessLevel === ACCESS_LEVEL.LOCAL_OFFICE) {
    parametros.oficina = Parametro(sql.Int, ambito.localOfficeId);
    parametros.region = Parametro(sql.Int, ambito.regionId);
    clausulas.push('sug.oficina_local_id = @oficina');
    clausulas.push('sug.region_id = @region');
    return;
  }
  throw new ErrorInfraestructura('El ámbito no consulta posibles referencias.');
}

/**
 * @param {object} client Cliente de SIA_CENCINAI.
 * @returns {object} Operaciones de sugerencias.
 */
function CrearRepositorioPosibles(client) {
  if (!client || typeof client.query !== 'function') {
    throw new ErrorInfraestructura('La base de posibles referencias no está disponible.');
  }

  return {
    async Listar(ambito, criterios) {
      const parametros = {
        desplazamiento: Parametro(sql.Int, criterios.desplazamiento),
        tamano: Parametro(sql.Int, criterios.tamano)
      };
      const clausulas = [];
      AgregarAmbito(parametros, clausulas, ambito);
      if (criterios.estado) {
        parametros.estado = Parametro(sql.NVarChar(30), criterios.estado);
        clausulas.push('sug.estado = @estado');
      }
      if (criterios.fecha) {
        parametros.fecha = Parametro(sql.Date, criterios.fecha);
        clausulas.push('sug.fecha_deteccion = @fecha');
      }
      if (criterios.criterio) {
        parametros.criterio = Parametro(sql.NVarChar(80), criterios.criterio);
        clausulas.push('sug.criterio_codigo = @criterio');
      }
      if (criterios.establecimientoId) {
        parametros.filtroEstablecimiento = Parametro(sql.Int, criterios.establecimientoId);
        clausulas.push('sug.establecimiento_id = @filtroEstablecimiento');
      }
      if (Array.isArray(criterios.personas)) {
        if (criterios.personas.length === 0) {
          return [];
        }
        const nombres = criterios.personas.map((id, indice) => {
          const nombre = `persona${indice}`;
          parametros[nombre] = Parametro(sql.NVarChar(20), id);
          return `@${nombre}`;
        });
        clausulas.push(`sug.per_id_persona IN (${nombres.join(', ')})`);
      }
      return client.query(`
SELECT
  sug.posible_id,
  sug.per_id_persona,
  sug.establecimiento_id,
  sug.oficina_local_id,
  sug.region_id,
  sug.criterio_codigo,
  CONVERT(char(10), sug.fecha_deteccion, 23) AS fecha_deteccion,
  sug.id_externo,
  sug.sistema_origen,
  sug.estado,
  sug.referencia_id
FROM dbo.ref_posible AS sug
WHERE ${clausulas.join(' AND ')}
ORDER BY sug.fecha_deteccion DESC, sug.posible_id DESC
OFFSET @desplazamiento ROWS FETCH NEXT @tamano ROWS ONLY
`, parametros);
    },

    async Contar(ambito, criterios) {
      const parametros = {};
      const clausulas = [];
      AgregarAmbito(parametros, clausulas, ambito);
      if (criterios.estado) {
        parametros.estado = Parametro(sql.NVarChar(30), criterios.estado);
        clausulas.push('sug.estado = @estado');
      }
      if (criterios.fecha) {
        parametros.fecha = Parametro(sql.Date, criterios.fecha);
        clausulas.push('sug.fecha_deteccion = @fecha');
      }
      if (criterios.criterio) {
        parametros.criterio = Parametro(sql.NVarChar(80), criterios.criterio);
        clausulas.push('sug.criterio_codigo = @criterio');
      }
      if (criterios.establecimientoId) {
        parametros.filtroEstablecimiento = Parametro(sql.Int, criterios.establecimientoId);
        clausulas.push('sug.establecimiento_id = @filtroEstablecimiento');
      }
      if (Array.isArray(criterios.personas)) {
        if (criterios.personas.length === 0) {
          return 0;
        }
        const nombres = criterios.personas.map((id, indice) => {
          const nombre = `persona${indice}`;
          parametros[nombre] = Parametro(sql.NVarChar(20), id);
          return `@${nombre}`;
        });
        clausulas.push(`sug.per_id_persona IN (${nombres.join(', ')})`);
      }
      const filas = await client.query(`
SELECT COUNT(*) AS total
FROM dbo.ref_posible AS sug
WHERE ${clausulas.join(' AND ')}
`, parametros);
      return Number(filas[0].total);
    },

    async Obtener(ambito, posibleId) {
      const parametros = { posibleId: Parametro(sql.BigInt, posibleId) };
      const clausulas = ['sug.posible_id = @posibleId'];
      AgregarAmbito(parametros, clausulas, ambito);
      const filas = await client.query(`
SELECT
  sug.posible_id,
  sug.per_id_persona,
  sug.establecimiento_id,
  sug.oficina_local_id,
  sug.region_id,
  sug.criterio_codigo,
  CONVERT(char(10), sug.fecha_deteccion, 23) AS fecha_deteccion,
  sug.id_externo,
  sug.sistema_origen,
  sug.estado,
  sug.referencia_id
FROM dbo.ref_posible AS sug
WHERE ${clausulas.join(' AND ')}
`, parametros);
      return filas[0] || null;
    },

    async ContarPendientes(ambito) {
      return this.Contar(ambito, { estado: 'PENDIENTE' });
    },

    async HechosNutricion() {
      return client.query(`
SELECT
  per_id_persona,
  establecimiento_id,
  criterio_codigo,
  id_externo,
  estado
FROM dbo.ref_posible
WHERE criterio_codigo IN (@demo, @clinico)
`, {
        demo: Parametro(sql.NVarChar(80), CRITERIO_DEMO),
        clinico: Parametro(sql.NVarChar(80), CRITERIO_CLINICO)
      });
    },

    async PersonasConCasoActivo() {
      const filas = await client.query(`
SELECT per_id_persona
FROM dbo.caso_lista_establecimiento
WHERE estado = N'ACTIVO'
`);
      return new Set(filas.map((fila) => fila.per_id_persona));
    },

    /**
     * Inserta una sugerencia pendiente. El índice único rechaza el duplicado.
     * Un caso activo detectado en la transacción no inserta la fila.
     *
     * @param {object} sugerencia Datos mínimos de la señal.
     * @returns {Promise<string>} CREADA, DUPLICADO o CASO_ACTIVO.
     */
    async InsertarPendiente(sugerencia) {
      try {
        await client.EnTransaccion(async (transaccion) => {
          await transaccion.query(`
IF EXISTS (
  SELECT 1
  FROM dbo.caso_lista_establecimiento
  WHERE per_id_persona = @personId
    AND estado = N'ACTIVO'
)
  THROW 52114, N'CASO', 1;

INSERT INTO dbo.ref_posible (
  per_id_persona,
  establecimiento_id,
  oficina_local_id,
  region_id,
  criterio_codigo,
  fecha_deteccion,
  id_externo,
  sistema_origen,
  estado,
  referencia_id
)
VALUES (
  @personId,
  @establecimientoId,
  @oficinaId,
  @regionId,
  @criterio,
  @fecha,
  @idExterno,
  @origen,
  N'PENDIENTE',
  NULL
);
`, {
            personId: Parametro(sql.NVarChar(20), sugerencia.personId),
            establecimientoId: Parametro(sql.Int, sugerencia.establecimientoId),
            oficinaId: Parametro(sql.Int, sugerencia.oficinaLocalId),
            regionId: Parametro(sql.Int, sugerencia.regionId),
            criterio: Parametro(sql.NVarChar(80), sugerencia.criterioCodigo),
            fecha: Parametro(sql.Date, sugerencia.fechaDeteccion),
            idExterno: Parametro(sql.NVarChar(80), sugerencia.idExterno),
            origen: Parametro(sql.NVarChar(40), sugerencia.sistemaOrigen)
          });
        });
        return 'CREADA';
      } catch (error) {
        const numero = error && error.sqlNumber;
        if (numero === 2601 || numero === 2627) {
          return 'DUPLICADO';
        }
        if (numero === 52114) {
          return 'CASO_ACTIVO';
        }
        throw error;
      }
    },

    async RegistrarEjecucion(registro) {
      await client.query(`
INSERT INTO dbo.aud_evento (
  ocurrido_en, usuario, rol, accion, entidad, entidad_id, ambito, codigo_cambio
)
VALUES (
  CAST(SYSUTCDATETIME() AS datetime2(0)),
  @usuario, @rol, N'DETECCION', N'det_ejecucion', @entidadId, @ambito, @codigo
)
`, {
        usuario: Parametro(sql.NVarChar(128), registro.usuario),
        rol: Parametro(sql.NVarChar(40), registro.rol),
        entidadId: Parametro(sql.NVarChar(40), registro.entidadId),
        ambito: Parametro(sql.NVarChar(200), registro.ambito),
        codigo: Parametro(sql.NVarChar(80), registro.codigo)
      });
    },

    async UltimaEjecucion() {
      const filas = await client.query(`
SELECT TOP (1)
  CONVERT(char(19), ocurrido_en, 120) AS ocurrido_en,
  usuario,
  rol,
  codigo_cambio
FROM dbo.aud_evento
WHERE entidad = N'det_ejecucion'
  AND accion = N'DETECCION'
ORDER BY evento_id DESC
`);
      return filas[0] || null;
    }
  };
}

module.exports = { CrearRepositorioPosibles };

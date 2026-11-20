/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * HU-027, HU-028, HU-030 y HU-031.
 * La clave queda en aud_evento.codigo_cambio para reconocer un reintento.
 * No crea un caso de destino ni un ingreso de continuidad.
 */
'use strict';

const sql = require('mssql');
const { ErrorInfraestructura } = require('../../common/errors');
const { Parametro } = require('../proceso-interdisciplinario/repositorio-proceso');

const ENTIDAD_COORDINACION = 'doc_coordinacion';
const ENTIDAD_REPORTE = 'doc_reporte_caso';
const ENTIDAD_CIERRE = 'caso_cierre';
const ENTIDAD_DOCUMENTO = 'doc_documento';

function ErrorDominio(codigo) {
  const error = new Error('La persistencia del ciclo no se completó.');
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
  if (numero === 52103 || numero === 52105) {
    return ErrorDominio('CASO_NO_ACTIVO');
  }
  if (numero === 52102) {
    return ErrorDominio('NO_ENCONTRADO');
  }
  if (numero === 52104) {
    return ErrorDominio('MOTIVO');
  }
  if (numero === 52100 || numero === 52101 || numero === 547) {
    return ErrorDominio('DATOS');
  }
  return error instanceof ErrorInfraestructura ? error : ErrorDominio('INFRAESTRUCTURA');
}

function Fecha(valor) {
  if (!valor) {
    return null;
  }
  return String(valor).slice(0, 10);
}

/**
 * Repositorio del ciclo sobre SIA_CENCINAI.
 * Las lecturas del expediente siguen en el módulo de proceso.
 *
 * @param {object} cliente Cliente SQL con transacción.
 * @returns {object} Catálogo y escrituras.
 */
function CrearRepositorioCiclo(cliente) {
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

  async function BloquearCaso(transaccion, registro) {
    const filas = await transaccion.query(`
SELECT
  caso_id,
  per_id_persona,
  estado,
  establecimiento_id,
  CONVERT(char(10), fecha_apertura, 23) AS fecha_apertura
FROM dbo.caso_ai WITH (UPDLOCK, HOLDLOCK)
WHERE caso_id = @casoId
  AND oficina_local_id = @oficina
  AND region_id = @region
`, {
      casoId: Parametro(sql.BigInt, registro.casoId),
      oficina: Parametro(sql.Int, registro.oficinaLocalId),
      region: Parametro(sql.Int, registro.regionId)
    });
    if (filas.length !== 1) {
      throw ErrorDominio('NO_ENCONTRADO');
    }
    return filas[0];
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

  function ExigirActivo(caso, fecha) {
    if (caso.estado !== 'ACTIVO') {
      throw ErrorDominio('CASO_NO_ACTIVO');
    }
    if (fecha && Fecha(caso.fecha_apertura) && fecha < Fecha(caso.fecha_apertura)) {
      throw ErrorDominio('FECHA');
    }
  }

  async function LeerCoordinacion(transaccion, coordinacionId) {
    const filas = await transaccion.query(`
SELECT
  coordinacion_id,
  caso_id,
  institucion_texto,
  profesional_responsable,
  digitador_usuario,
  motivo,
  observaciones,
  CONVERT(char(10), fecha_coordinacion, 23) AS fecha_coordinacion,
  estado_texto,
  (
    SELECT TOP (1) i.etiqueta
    FROM dbo.cat_item AS i
    WHERE i.cat_item_id = c.modalidad_item_id
      AND i.codigo_catalogo = c.modalidad_catalogo
  ) AS modalidad_texto,
  CONVERT(char(19), (
    SELECT MIN(e.ocurrido_en)
    FROM dbo.doc_coordinacion_evento AS e
    WHERE e.coordinacion_id = c.coordinacion_id
  ), 120) AS registrada_en
FROM dbo.doc_coordinacion AS c
WHERE coordinacion_id = @id
`, { id: Parametro(sql.BigInt, coordinacionId) });
    return filas[0] || null;
  }

  function PresentarCoordinacion(fila) {
    return {
      coordinacionId: Number(fila.coordinacion_id),
      casoId: Number(fila.caso_id),
      institucion: fila.institucion_texto,
      profesional: fila.profesional_responsable,
      digitador: fila.digitador_usuario,
      motivo: fila.motivo,
      modalidad: fila.modalidad_texto || null,
      observaciones: fila.observaciones || null,
      fecha: Fecha(fila.fecha_coordinacion),
      registradaEn: fila.registrada_en || null,
      estado: fila.estado_texto
    };
  }

  async function LeerReporte(transaccion, reporteId) {
    const filas = await transaccion.query(`
SELECT
  reporte_id,
  caso_id,
  tipo_proposito,
  CONVERT(char(10), fecha_reporte, 23) AS fecha_reporte,
  responsable_usuario,
  motivo
FROM dbo.doc_reporte_caso
WHERE reporte_id = @id
`, { id: Parametro(sql.BigInt, reporteId) });
    return filas[0] || null;
  }

  function PresentarReporte(fila) {
    return {
      reporteId: Number(fila.reporte_id),
      casoId: Number(fila.caso_id),
      tipoProposito: fila.tipo_proposito,
      fecha: Fecha(fila.fecha_reporte),
      responsable: fila.responsable_usuario,
      motivo: fila.motivo,
      conservacion: 'METADATOS'
    };
  }

  async function LeerCierre(transaccion, casoId) {
    const filas = await transaccion.query(`
SELECT
  cierre.caso_id,
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

  function PresentarCierre(fila) {
    const establecimiento = fila.destino_establecimiento_id === null
      || fila.destino_establecimiento_id === undefined
      ? null
      : Number(fila.destino_establecimiento_id);
    return {
      casoId: Number(fila.caso_id),
      motivoCodigo: fila.motivo_codigo,
      motivoEtiqueta: fila.motivo_etiqueta,
      explicacion: fila.explicacion,
      fecha: Fecha(fila.fecha_cierre),
      responsable: fila.responsable_usuario,
      destinoEstablecimientoId: establecimiento,
      destinoOficinaLocalId: fila.destino_oficina_local_id === null
        || fila.destino_oficina_local_id === undefined
        ? null
        : Number(fila.destino_oficina_local_id),
      destinoRegionId: fila.destino_region_id === null
        || fila.destino_region_id === undefined
        ? null
        : Number(fila.destino_region_id),
      destinoNombre: fila.destino_nombre,
      casoDestinoCreado: false
    };
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
  i.etiqueta,
  i.requiere_texto,
  i.ambito
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

    /**
     * Registra la coordinación y su evento, o devuelve la ya guardada con la clave.
     *
     * @param {object} registro Datos autorizados y ámbito de la sesión.
     * @returns {Promise<object>} Coordinación nueva o repetida.
     */
    async RegistrarCoordinacion(registro) {
      return EnTransaccion(async (transaccion) => {
        const caso = await BloquearCaso(transaccion, registro);
        const previa = await BuscarClave(transaccion, registro, ENTIDAD_COORDINACION);
        if (previa) {
          const fila = await LeerCoordinacion(transaccion, previa);
          if (!fila || Number(fila.caso_id) !== Number(caso.caso_id)) {
            throw ErrorDominio('CLAVE_AJENA');
          }
          return {
            repetida: true,
            estadoCaso: caso.estado,
            coordinacion: PresentarCoordinacion(fila)
          };
        }
        ExigirActivo(caso, registro.fecha);
        const insertadas = await transaccion.query(`
INSERT INTO dbo.doc_coordinacion (
  caso_id, institucion_item_id, institucion_catalogo, institucion_texto,
  profesional_responsable, digitador_usuario, motivo, observaciones,
  fecha_coordinacion, estado_item_id, estado_catalogo, estado_texto,
  modalidad_item_id, modalidad_catalogo
)
OUTPUT INSERTED.coordinacion_id
VALUES (
  @casoId, @institucionId, @institucionCatalogo, @institucionTexto,
  @profesional, @digitador, @motivo, @observaciones, @fecha,
  @estadoId, @estadoCatalogo, @estadoTexto,
  @modalidadId, @modalidadCatalogo
)
`, {
          casoId: Parametro(sql.BigInt, caso.caso_id),
          institucionId: Parametro(sql.BigInt, registro.institucionItemId),
          institucionCatalogo: Parametro(
            sql.NVarChar(40),
            registro.institucionItemId === null ? null : 'INSTITUCION_COORDINACION'
          ),
          institucionTexto: Parametro(sql.NVarChar(200), registro.institucionTexto),
          profesional: Parametro(sql.NVarChar(200), registro.profesional),
          digitador: Parametro(sql.NVarChar(128), registro.usuario),
          motivo: Parametro(sql.NVarChar(1000), registro.motivo),
          observaciones: Parametro(sql.NVarChar(2000), registro.observaciones || null),
          fecha: Parametro(sql.Date, registro.fecha),
          modalidadId: Parametro(sql.BigInt, registro.modalidadItemId || null),
          modalidadCatalogo: Parametro(
            sql.NVarChar(40),
            registro.modalidadItemId ? 'MODALIDAD_COORDINACION' : null
          ),
          estadoId: Parametro(sql.BigInt, registro.estadoItemId),
          estadoCatalogo: Parametro(
            sql.NVarChar(40),
            registro.estadoItemId === null ? null : 'ESTADO_COORDINACION'
          ),
          estadoTexto: Parametro(sql.NVarChar(80), registro.estadoTexto)
        });
        const coordinacionId = Number(insertadas[0].coordinacion_id);
        await transaccion.query(`
INSERT INTO dbo.doc_coordinacion_evento (
  coordinacion_id, estado_texto, estado_item_id, estado_catalogo, usuario, ocurrido_en
)
VALUES (
  @id, @estadoTexto, @estadoId, @estadoCatalogo, @usuario,
  CAST(SYSUTCDATETIME() AS datetime2(0))
)
`, {
          id: Parametro(sql.BigInt, coordinacionId),
          estadoTexto: Parametro(sql.NVarChar(80), registro.estadoTexto),
          estadoId: Parametro(sql.BigInt, registro.estadoItemId),
          estadoCatalogo: Parametro(
            sql.NVarChar(40),
            registro.estadoItemId === null ? null : 'ESTADO_COORDINACION'
          ),
          usuario: Parametro(sql.NVarChar(128), registro.usuario)
        });
        await Auditar(
          transaccion,
          registro,
          ENTIDAD_COORDINACION,
          coordinacionId,
          'CREACION'
        );
        const fila = await LeerCoordinacion(transaccion, coordinacionId);
        return {
          repetida: false,
          estadoCaso: caso.estado,
          coordinacion: PresentarCoordinacion(fila)
        };
      });
    },

    /**
     * Conserva la metadata del reporte. No modifica el estado del caso.
     *
     * @param {object} registro Tipo, motivo, responsable y clave.
     * @returns {Promise<object>} Reporte nuevo o repetido, con el estado bloqueado.
     */
    async RegistrarReporte(registro) {
      return EnTransaccion(async (transaccion) => {
        const caso = await BloquearCaso(transaccion, registro);
        const previa = await BuscarClave(transaccion, registro, ENTIDAD_REPORTE);
        if (previa) {
          const fila = await LeerReporte(transaccion, previa);
          if (!fila || Number(fila.caso_id) !== Number(caso.caso_id)) {
            throw ErrorDominio('CLAVE_AJENA');
          }
          return {
            repetida: true,
            estadoCaso: caso.estado,
            reporte: PresentarReporte(fila)
          };
        }
        ExigirActivo(caso, null);
        const insertadas = await transaccion.query(`
INSERT INTO dbo.doc_reporte_caso (
  caso_id, tipo_proposito, fecha_reporte, responsable_usuario, motivo, creado_en
)
OUTPUT INSERTED.reporte_id
VALUES (
  @casoId, @tipo, CAST(SYSUTCDATETIME() AS date), @responsable, @motivo,
  CAST(SYSUTCDATETIME() AS datetime2(0))
)
`, {
          casoId: Parametro(sql.BigInt, caso.caso_id),
          tipo: Parametro(sql.NVarChar(200), registro.tipoProposito),
          responsable: Parametro(sql.NVarChar(128), registro.usuario),
          motivo: Parametro(sql.NVarChar(1000), registro.motivo)
        });
        const reporteId = Number(insertadas[0].reporte_id);
        await Auditar(transaccion, registro, ENTIDAD_REPORTE, reporteId, 'CREACION');
        const fila = await LeerReporte(transaccion, reporteId);
        return {
          repetida: false,
          estadoCaso: caso.estado,
          reporte: PresentarReporte(fila)
        };
      });
    },

    /**
     * Cierra el caso de origen con el procedimiento común.
     * El traslado usa el motivo de catálogo y no inserta otro caso.
     *
     * @param {object} registro Motivo, destino ya resuelto y clave.
     * @returns {Promise<object>} Cierre nuevo o repetido.
     */
    async CerrarCaso(registro) {
      return EnTransaccion(async (transaccion) => {
        const caso = await BloquearCaso(transaccion, registro);
        const previa = await BuscarClave(transaccion, registro, ENTIDAD_CIERRE);
        if (previa) {
          if (String(caso.caso_id) !== String(previa)) {
            throw ErrorDominio('CLAVE_AJENA');
          }
          const fila = await LeerCierre(transaccion, caso.caso_id);
          if (!fila) {
            throw ErrorDominio('DATOS');
          }
          return {
            repetida: true,
            estadoCaso: caso.estado,
            cierre: PresentarCierre(fila)
          };
        }
        ExigirActivo(caso, registro.fechaCierre);
        if (registro.destinoEstablecimientoId !== null
          && Number(caso.establecimiento_id) === registro.destinoEstablecimientoId) {
          throw ErrorDominio('DESTINO');
        }
        await transaccion.query(`
DECLARE @ocurrido datetime2(0) = CAST(SYSUTCDATETIME() AS datetime2(0));
EXEC ops.cerrar_caso
  @caso_id = @casoId,
  @per_id_persona = @persona,
  @motivo_item_id = @motivoId,
  @explicacion = @explicacion,
  @fecha_cierre = @fecha,
  @responsable_usuario = @responsable,
  @usuario = @usuario,
  @ocurrido_en = @ocurrido,
  @destino_establecimiento_id = @destinoEstablecimiento,
  @destino_oficina_local_id = @destinoOficina,
  @destino_region_id = @destinoRegion,
  @destino_nombre = @destinoNombre;
`, {
          casoId: Parametro(sql.BigInt, caso.caso_id),
          persona: Parametro(sql.NVarChar(20), caso.per_id_persona),
          motivoId: Parametro(sql.BigInt, registro.motivoItemId),
          explicacion: Parametro(sql.NVarChar(2000), registro.explicacion),
          fecha: Parametro(sql.Date, registro.fechaCierre),
          responsable: Parametro(sql.NVarChar(128), registro.usuario),
          usuario: Parametro(sql.NVarChar(128), registro.usuario),
          destinoEstablecimiento: Parametro(sql.Int, registro.destinoEstablecimientoId),
          destinoOficina: Parametro(sql.Int, registro.destinoOficinaLocalId),
          destinoRegion: Parametro(sql.Int, registro.destinoRegionId),
          destinoNombre: Parametro(sql.NVarChar(200), registro.destinoNombre)
        });
        await Auditar(
          transaccion,
          registro,
          ENTIDAD_CIERRE,
          caso.caso_id,
          registro.accion
        );
        const fila = await LeerCierre(transaccion, caso.caso_id);
        if (!fila) {
          throw ErrorDominio('DATOS');
        }
        return {
          repetida: false,
          estadoCaso: 'CERRADO',
          cierre: PresentarCierre(fila)
        };
      });
    },

    async RegistrarDocumento(registro) {
      return EnTransaccion(async (transaccion) => {
        const caso = await BloquearCaso(transaccion, registro);
        ExigirActivo(caso, registro.fecha);
        const previos = await transaccion.query(`
SELECT documento_id
FROM dbo.doc_documento
WHERE caso_id = @casoId AND clave_almacen = @clave
`, {
          casoId: Parametro(sql.BigInt, caso.caso_id),
          clave: Parametro(sql.NVarChar(200), registro.claveAlmacen)
        });
        if (previos.length > 0) {
          throw ErrorDominio('DUPLICADO');
        }
        const insertadas = await transaccion.query(`
INSERT INTO dbo.doc_documento (
  caso_id, tipo_texto, fecha_documento, responsable_usuario,
  nombre_original, clave_almacen, tamano_bytes, creado_en
)
OUTPUT INSERTED.documento_id
VALUES (
  @casoId, @tipo, @fecha, @responsable, @nombre, @clave, @tamano,
  CAST(SYSUTCDATETIME() AS datetime2(0))
)
`, {
          casoId: Parametro(sql.BigInt, caso.caso_id),
          tipo: Parametro(sql.NVarChar(120), registro.tipoTexto),
          fecha: Parametro(sql.Date, registro.fecha),
          responsable: Parametro(sql.NVarChar(128), registro.usuario),
          nombre: Parametro(sql.NVarChar(260), registro.nombreOriginal),
          clave: Parametro(sql.NVarChar(200), registro.claveAlmacen),
          tamano: Parametro(sql.BigInt, registro.tamano)
        });
        const documentoId = Number(insertadas[0].documento_id);
        await Auditar(transaccion, registro, ENTIDAD_DOCUMENTO, documentoId, 'CREACION');
        return {
          documentoId,
          nombre: registro.nombreOriginal,
          tipo: registro.tipoTexto,
          fecha: registro.fecha,
          responsable: registro.usuario,
          tamano: registro.tamano
        };
      });
    },

    async ObtenerDocumento(registro) {
      const filas = await Consultar(`
SELECT
  documento.documento_id,
  documento.nombre_original,
  documento.clave_almacen,
  documento.tamano_bytes
FROM dbo.doc_documento AS documento
INNER JOIN dbo.caso_ai AS caso
  ON caso.caso_id = documento.caso_id
WHERE documento.documento_id = @documentoId
  AND documento.caso_id = @casoId
  AND caso.oficina_local_id = @oficina
  AND caso.region_id = @region
`, {
        documentoId: Parametro(sql.BigInt, registro.documentoId),
        casoId: Parametro(sql.BigInt, registro.casoId),
        oficina: Parametro(sql.Int, registro.oficinaLocalId),
        region: Parametro(sql.Int, registro.regionId)
      });
      return filas[0] || null;
    }
  };
}

module.exports = { CrearRepositorioCiclo };

/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16. Modificación: 2026-11-16.
 * HU-038, HU-039 y HU-040 a HU-043. Lecturas parametrizadas del ámbito resuelto.
 * La fecha real de atención no se sustituye por la fecha de digitación.
 * Oficina Local sigue enviando oficina y región; un nulo no estrecha el corte.
 */
'use strict';

const sql = require('mssql');
const { ErrorInfraestructura } = require('../../common/errors');
const { Parametro } = require('../proceso-interdisciplinario/repositorio-proceso');
const {
  CATALOGO_VISUALIZACIONES
} = require('./definiciones-analiticas');
const {
  ESTADO_ZONA_HORARIA,
  ZONA_HORARIA_OPERATIVA
} = require('../../common/fecha-local');

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

function Recortar(valor, maximo) {
  const texto = valor == null ? '' : String(valor);
  return texto.length <= maximo ? texto : texto.slice(0, maximo);
}

function NumeroONull(valor) {
  if (valor == null || valor === '') {
    return null;
  }
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function FilasAgregadas(vista) {
  const filas = (vista.serie || []).map((fila) => ({
    etiqueta: Recortar(fila.etiqueta || 'Sin etiqueta', 300),
    valorNumerico: Number(fila.cantidad) || 0,
    valorTexto: fila.clave == null ? null : Recortar(fila.clave, 500)
  }));
  filas.push({
    etiqueta: '[meta] Estado',
    valorNumerico: null,
    valorTexto: Recortar(vista.estado || 'SIN_INFORMACION', 500)
  });
  if (vista.mensaje) {
    filas.push({
      etiqueta: '[meta] Mensaje',
      valorNumerico: null,
      valorTexto: Recortar(vista.mensaje, 500)
    });
  }
  if (vista.nota) {
    filas.push({
      etiqueta: '[meta] Nota',
      valorNumerico: null,
      valorTexto: Recortar(vista.nota, 500)
    });
  }
  if (vista.formato && vista.formato.startsWith('KPI')) {
    filas.push({
      etiqueta: '[meta] Numerador',
      valorNumerico: NumeroONull(vista.numerador),
      valorTexto: null
    });
    filas.push({
      etiqueta: '[meta] Denominador',
      valorNumerico: NumeroONull(vista.denominador),
      valorTexto: null
    });
    filas.push({
      etiqueta: '[meta] Porcentaje',
      valorNumerico: NumeroONull(vista.porcentaje),
      valorTexto: vista.porcentaje == null ? 'No aplica' : null
    });
  }
  return filas;
}

function LeerMeta(filas, nombre) {
  return filas.find((fila) => fila.etiqueta === `[meta] ${nombre}`) || null;
}

function ReconstruirInforme(informe, vistas, agregados) {
  const resumen = String(informe.filtros_resumen || '');
  const fechaHora = (resumen.match(/fecha_hora_local=([^;]+)/) || [])[1] || null;
  const fechaCalendario = (resumen.match(/fecha_calendario=([^;]+)/) || [])[1] || null;
  const filtros = resumen.includes('|')
    ? resumen.slice(resumen.indexOf('|') + 1).trim()
    : resumen;
  const personas = (resumen.match(/personas=(\d+)/) || [])[1];
  const atenciones = (resumen.match(/atenciones=(\d+)/) || [])[1];
  return {
    informeId: Number(informe.informe_id),
    titulo: informe.titulo,
    responsable: informe.responsable_usuario,
    rol: informe.rol_codigo,
    unidad: 'Oficina Local',
    ambito: informe.ambito_nivel,
    regionId: Number(informe.region_id),
    oficinaLocalId: Number(informe.oficina_local_id),
    anio: Number(informe.periodo_anio),
    fechaHoraLocal: fechaHora,
    fechaCalendario,
    zonaHoraria: ZONA_HORARIA_OPERATIVA,
    estadoZona: ESTADO_ZONA_HORARIA,
    filtrosResumen: filtros,
    personasUnicas: personas == null ? null : Number(personas),
    totalAtenciones: atenciones == null ? null : Number(atenciones),
    visualizaciones: vistas.map((vista) => {
      const definicion = CATALOGO_VISUALIZACIONES.find((item) => (
        item.numero === Number(vista.codigo_visualizacion)
      ));
      const propias = agregados.filter((fila) => (
        Number(fila.visualizacion_id) === Number(vista.visualizacion_id)
      ));
      const serie = propias
        .filter((fila) => !String(fila.etiqueta).startsWith('[meta] '))
        .map((fila) => ({
          clave: fila.valor_texto,
          etiqueta: fila.etiqueta,
          cantidad: Number(fila.valor_numerico)
        }));
      const estado = LeerMeta(propias, 'Estado');
      const mensaje = LeerMeta(propias, 'Mensaje');
      const nota = LeerMeta(propias, 'Nota');
      const numerador = LeerMeta(propias, 'Numerador');
      const denominador = LeerMeta(propias, 'Denominador');
      const porcentaje = LeerMeta(propias, 'Porcentaje');
      return {
        numero: Number(vista.codigo_visualizacion),
        orden: Number(vista.orden),
        titulo: vista.titulo,
        formato: definicion ? definicion.formato : 'TABLA',
        fechaAplicada: definicion ? definicion.fecha : '',
        estado: estado ? estado.valor_texto : 'CON_DATOS',
        mensaje: mensaje ? mensaje.valor_texto : null,
        nota: nota ? nota.valor_texto : null,
        filtrosTexto: vista.filtros,
        analisis: vista.analisis,
        serie,
        numerador: numerador ? NumeroONull(numerador.valor_numerico) : null,
        denominador: denominador ? NumeroONull(denominador.valor_numerico) : null,
        porcentaje: porcentaje && porcentaje.valor_texto === 'No aplica'
          ? null
          : (porcentaje ? NumeroONull(porcentaje.valor_numerico) : null)
      };
    })
  };
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

  /**
   * Igualdades solo de los niveles que el ámbito ya resolvió.
   * Con oficina y región informadas coincide con el predicado de Oficina Local.
   *
   * @param {string} alias Tabla del hecho.
   * @param {object} registro Ámbito efectivo.
   * @param {boolean} incluyeRegion La tabla tiene region_id.
   * @returns {string} Predicado sin ampliar el universo.
   */
  function ClausulaIgualdad(alias, registro, incluyeRegion) {
    const partes = [];
    if (registro.oficinaLocalId != null) {
      partes.push(`${alias}.oficina_local_id = @oficina`);
    }
    if (incluyeRegion && registro.regionId != null) {
      partes.push(`${alias}.region_id = @region`);
    }
    return partes.length === 0 ? '1 = 1' : partes.join('\n  AND ');
  }

  /**
   * Limita el hecho al establecimiento pedido o a la lista autorizada.
   * Una lista vacía no abre el universo completo.
   *
   * @param {string} alias Tabla del hecho.
   * @param {object} registro Ámbito efectivo.
   * @param {object} parametros Parámetros de la consulta.
   * @returns {string} Predicado parametrizado.
   */
  function FiltroEstablecimiento(alias, registro, parametros) {
    const ids = registro.establecimientosAutorizados;
    if (Array.isArray(ids)) {
      if (ids.length === 0) {
        return '1 = 0';
      }
      const nombres = ids.map((id, indice) => {
        const nombre = `autEst${indice}`;
        parametros[nombre] = Parametro(sql.Int, id);
        return `@${nombre}`;
      });
      return `${alias}.establecimiento_id IN (${nombres.join(', ')})`;
    }
    return `(@establecimiento IS NULL OR ${alias}.establecimiento_id = @establecimiento)`;
  }

  /**
   * La grupal no tiene region_id. Con oficina, el predicado queda igual que antes.
   * Sin oficina y con región, la oficina se comprueba por un caso de esa región.
   *
   * @param {object} registro Ámbito efectivo.
   * @returns {string} Predicado de la actividad grupal.
   */
  function ClausulaGrupal(registro) {
    if (registro.oficinaLocalId != null) {
      return 'grupal.oficina_local_id = @oficina';
    }
    if (registro.regionId != null) {
      return `EXISTS (
    SELECT 1
    FROM dbo.caso_ai AS casoRegion
    WHERE casoRegion.oficina_local_id = grupal.oficina_local_id
      AND casoRegion.region_id = @region
  )`;
    }
    return '1 = 1';
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
  AND ${ClausulaIgualdad('caso', registro, true)}
  AND ${FiltroEstablecimiento('caso', registro, parametros)}`;
      const filtroReferencia = ClausulaIgualdad('referencia', registro, true);
      const filtroActividad = ClausulaIgualdad('actividad', registro, true);
      const filtroGrupal = ClausulaGrupal(registro);
      const casos = await Consultar(`
SELECT
  caso.caso_id,
  caso.per_id_persona,
  caso.establecimiento_id,
  caso.region_id,
  caso.oficina_local_id,
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
  CONVERT(char(10), referencia.fecha_referencia, 23) AS fecha_referencia,
  referencia.estado
FROM dbo.ref_referencia AS referencia
WHERE ${filtroReferencia}
  AND referencia.fecha_referencia >= @inicio
  AND referencia.fecha_referencia < @fin
  AND ${FiltroEstablecimiento('referencia', registro, parametros)}
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
WHERE ${filtroReferencia}
  AND referencia.fecha_referencia >= @inicio
  AND referencia.fecha_referencia < @fin
  AND ${FiltroEstablecimiento('referencia', registro, parametros)}
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
WHERE ${filtroGrupal}
  AND grupal.fecha_atencion >= @inicio
  AND grupal.fecha_atencion < @fin
  AND ${FiltroEstablecimiento('grupal', registro, parametros)}
`, parametros);
      const disciplinasGrupales = await Consultar(`
SELECT
  disciplina.atencion_grupal_id,
  disciplina.disciplina_item_id
FROM dbo.ate_grupal_disciplina AS disciplina
INNER JOIN dbo.ate_grupal AS grupal
  ON grupal.atencion_grupal_id = disciplina.atencion_grupal_id
WHERE ${filtroGrupal}
  AND grupal.fecha_atencion >= @inicio
  AND grupal.fecha_atencion < @fin
  AND ${FiltroEstablecimiento('grupal', registro, parametros)}
`, parametros);
      const profesionalesGrupales = await Consultar(`
SELECT
  profesional.atencion_grupal_id,
  profesional.profesional_usuario
FROM dbo.ate_grupal_profesional AS profesional
INNER JOIN dbo.ate_grupal AS grupal
  ON grupal.atencion_grupal_id = profesional.atencion_grupal_id
WHERE ${filtroGrupal}
  AND grupal.fecha_atencion >= @inicio
  AND grupal.fecha_atencion < @fin
  AND ${FiltroEstablecimiento('grupal', registro, parametros)}
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
WHERE ${filtroGrupal}
  AND grupal.fecha_atencion >= @inicio
  AND grupal.fecha_atencion < @fin
  AND ${FiltroEstablecimiento('grupal', registro, parametros)}
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
WHERE ${filtroActividad}
  AND actividad.estado = N'CANCELADA'
  AND cambio.ocurrido_en >= @inicio
  AND cambio.ocurrido_en < @fin
  AND ${FiltroEstablecimiento('actividad', registro, parametros)}
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
          regionId: Entero(fila.region_id),
          oficinaLocalId: Entero(fila.oficina_local_id),
          estado: fila.estado,
          prioridad: fila.prioridad_codigo
        })),
        referencias: referencias.map((fila) => ({
          referenciaId: Entero(fila.referencia_id),
          personaId: Texto(fila.per_id_persona),
          establecimientoId: Entero(fila.establecimiento_id),
          fecha: Fecha(fila.fecha_referencia),
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
    },

    BuscarInformePorClave,
    BuscarInformePorId,
    BuscarInformePorAmbito,
    GuardarInforme,
    ContarPosiblesPendientes
  };

  function ErrorInforme(codigo) {
    const error = new Error('La persistencia del informe no se completó.');
    error.domain = true;
    error.code = codigo;
    return error;
  }

  function TraducirInforme(error) {
    if (error && error.domain === true) {
      return error;
    }
    const numero = error && error.sqlNumber;
    if (numero === 229 || numero === 230 || (error && error.permissionDenied)) {
      return ErrorInforme('PERMISO');
    }
    if (numero === 208) {
      return ErrorInforme('AUSENTE');
    }
    if (numero === 2601 || numero === 2627) {
      return ErrorInforme('DUPLICADO');
    }
    return ErrorInforme('INFRAESTRUCTURA');
  }

  function ColumnasInforme() {
    return `
  informe.informe_id,
  informe.titulo,
  informe.responsable_usuario,
  informe.rol_codigo,
  informe.ambito_nivel,
  informe.region_id,
  informe.oficina_local_id,
  informe.periodo_anio,
  informe.filtros_resumen`;
  }

  async function CargarDetalle(informe) {
    const vistas = await cliente.query(`
SELECT
  visualizacion.visualizacion_id,
  visualizacion.codigo_visualizacion,
  visualizacion.orden,
  visualizacion.titulo,
  visualizacion.filtros,
  visualizacion.analisis
FROM dbo.inf_visualizacion AS visualizacion
WHERE visualizacion.informe_id = @informe
ORDER BY visualizacion.orden
`, {
      informe: Parametro(sql.BigInt, informe.informe_id)
    });
    const agregados = await cliente.query(`
SELECT
  agregado.visualizacion_id,
  agregado.orden,
  agregado.etiqueta,
  agregado.valor_numerico,
  agregado.valor_texto
FROM dbo.inf_agregado AS agregado
INNER JOIN dbo.inf_visualizacion AS visualizacion
  ON visualizacion.visualizacion_id = agregado.visualizacion_id
WHERE visualizacion.informe_id = @informe
ORDER BY visualizacion.orden, agregado.orden
`, {
      informe: Parametro(sql.BigInt, informe.informe_id)
    });
    return ReconstruirInforme(informe, vistas, agregados);
  }

  async function ContarPosiblesPendientes(identificadores) {
    if (!Array.isArray(identificadores) || identificadores.length === 0) {
      return 0;
    }
    const parametros = {};
    const nombres = identificadores.map((id, indice) => {
      const nombre = `posibleEst${indice}`;
      parametros[nombre] = Parametro(sql.Int, id);
      return `@${nombre}`;
    });
    const filas = await Consultar(`
SELECT COUNT(*) AS total
FROM dbo.ref_posible AS sug
WHERE sug.estado = N'PENDIENTE'
  AND sug.establecimiento_id IN (${nombres.join(', ')})
`, parametros);
    return Entero(filas[0] && filas[0].total) || 0;
  }

  async function BuscarInformePorAmbito(criterio) {
    if (!cliente || typeof cliente.query !== 'function') {
      throw ErrorInforme('AUSENTE');
    }
    try {
      const informes = await cliente.query(`
SELECT TOP (1)
${ColumnasInforme()}
FROM dbo.inf_informe AS informe
WHERE informe.clave_archivo = @clave
  AND informe.ambito_nivel = @ambito
  AND (
    (@oficina IS NULL AND informe.oficina_local_id IS NULL)
    OR informe.oficina_local_id = @oficina
  )
  AND (
    (@region IS NULL AND informe.region_id IS NULL)
    OR informe.region_id = @region
  )
  AND (
    (@establecimiento IS NULL AND informe.establecimiento_id IS NULL)
    OR informe.establecimiento_id = @establecimiento
  )
ORDER BY informe.informe_id
`, {
        clave: Parametro(sql.NVarChar(80), criterio.claveOperacion),
        ambito: Parametro(sql.NVarChar(40), criterio.ambito),
        oficina: Parametro(sql.Int, criterio.oficinaLocalId),
        region: Parametro(sql.Int, criterio.regionId),
        establecimiento: Parametro(sql.Int, criterio.establecimientoId)
      });
      if (!informes || informes.length === 0) {
        return null;
      }
      return CargarDetalle(informes[0]);
    } catch (error) {
      throw TraducirInforme(error);
    }
  }

  async function BuscarInformePorClave(oficinaLocalId, claveOperacion) {
    if (!cliente || typeof cliente.query !== 'function') {
      throw ErrorInforme('AUSENTE');
    }
    try {
      const informes = await cliente.query(`
SELECT TOP (1)
${ColumnasInforme()}
FROM dbo.inf_informe AS informe
WHERE informe.clave_archivo = @clave
  AND informe.oficina_local_id = @oficina
  AND informe.ambito_nivel = N'OFICINA_LOCAL'
ORDER BY informe.informe_id
`, {
        clave: Parametro(sql.NVarChar(80), claveOperacion),
        oficina: Parametro(sql.Int, oficinaLocalId)
      });
      if (!informes || informes.length === 0) {
        return null;
      }
      return CargarDetalle(informes[0]);
    } catch (error) {
      throw TraducirInforme(error);
    }
  }

  async function BuscarInformePorId(oficinaLocalId, informeId) {
    if (!cliente || typeof cliente.query !== 'function') {
      throw ErrorInforme('AUSENTE');
    }
    try {
      const informes = await cliente.query(`
SELECT TOP (1)
${ColumnasInforme()}
FROM dbo.inf_informe AS informe
WHERE informe.informe_id = @informe
  AND informe.oficina_local_id = @oficina
  AND informe.ambito_nivel = N'OFICINA_LOCAL'
`, {
        informe: Parametro(sql.BigInt, informeId),
        oficina: Parametro(sql.Int, oficinaLocalId)
      });
      if (!informes || informes.length === 0) {
        return null;
      }
      return CargarDetalle(informes[0]);
    } catch (error) {
      throw TraducirInforme(error);
    }
  }

  async function GuardarInforme(modelo) {
    if (!cliente || typeof cliente.EnTransaccion !== 'function') {
      throw ErrorInforme('AUSENTE');
    }
    try {
      return await cliente.EnTransaccion(async (tx) => {
        const insertados = await tx.query(`
INSERT INTO dbo.inf_informe (
  titulo, responsable_usuario, rol_codigo, ambito_nivel,
  region_id, oficina_local_id, establecimiento_id,
  periodo_anio, filtros_resumen, corte_en, generado_en, clave_archivo
)
OUTPUT INSERTED.informe_id
VALUES (
  @titulo, @responsable, @rol, @ambito,
  @region, @oficina, @establecimiento,
  @anio, @filtros, SYSUTCDATETIME(), SYSUTCDATETIME(), @clave
)
`, {
          titulo: Parametro(sql.NVarChar(300), modelo.titulo),
          responsable: Parametro(sql.NVarChar(128), modelo.responsable),
          rol: Parametro(sql.NVarChar(40), modelo.rol),
          ambito: Parametro(sql.NVarChar(40), modelo.ambito || 'OFICINA_LOCAL'),
          region: Parametro(sql.Int, modelo.regionId),
          oficina: Parametro(sql.Int, modelo.oficinaLocalId),
          establecimiento: Parametro(sql.Int, modelo.establecimientoId),
          anio: Parametro(sql.Int, modelo.anio),
          filtros: Parametro(sql.NVarChar(2000), modelo.filtrosResumen),
          clave: Parametro(sql.NVarChar(80), modelo.claveOperacion)
        });
        const informeId = Number(insertados[0].informe_id);
        for (const vista of modelo.visualizaciones) {
          const creadas = await tx.query(`
INSERT INTO dbo.inf_visualizacion (
  informe_id, codigo_visualizacion, orden, titulo, filtros, analisis
)
OUTPUT INSERTED.visualizacion_id
VALUES (@informe, @codigo, @orden, @titulo, @filtros, @analisis)
`, {
            informe: Parametro(sql.BigInt, informeId),
            codigo: Parametro(sql.TinyInt, vista.numero),
            orden: Parametro(sql.Int, vista.orden),
            titulo: Parametro(sql.NVarChar(400), vista.titulo),
            filtros: Parametro(sql.NVarChar(1000), vista.filtrosTexto),
            analisis: Parametro(sql.NVarChar(4000), vista.analisis)
          });
          const visualizacionId = Number(creadas[0].visualizacion_id);
          let orden = 1;
          for (const fila of FilasAgregadas(vista)) {
            await tx.query(`
INSERT INTO dbo.inf_agregado (
  visualizacion_id, orden, etiqueta, valor_numerico, valor_texto
)
VALUES (@vista, @orden, @etiqueta, @numero, @texto)
`, {
              vista: Parametro(sql.BigInt, visualizacionId),
              orden: Parametro(sql.Int, orden),
              etiqueta: Parametro(sql.NVarChar(300), fila.etiqueta),
              numero: Parametro(sql.Decimal(18, 4), fila.valorNumerico),
              texto: Parametro(sql.NVarChar(500), fila.valorTexto)
            });
            orden += 1;
          }
        }
        return informeId;
      });
    } catch (error) {
      throw TraducirInforme(error);
    }
  }
}

module.exports = { CrearRepositorioReporteria };

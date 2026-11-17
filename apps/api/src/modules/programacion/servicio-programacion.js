/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * Modificación: 2026-11-16. La consulta informa el total del ámbito.
 * HU-044 y HU-002. La frecuencia del plan no crea una actividad.
 */
'use strict';

const { FechaCalendarioLocal } = require('../../common/fecha-local');
const {
  ErrorConflicto,
  ErrorInfraestructura,
  ErrorNoEncontrado,
  ErrorProhibido,
  ErrorValidacion
} = require('../../common/errors');
const { CAPABILITY } = require('../../infrastructure/auth/capabilities');
const { ExigirCapacidad } = require('../../infrastructure/auth/authorization-policy');
const { ACCESS_LEVEL } = require('../../infrastructure/auth/institutional-roles');
const { ResolverAmbitoTerritorial } = require('../institutional/territorial-scope');

const INTENTOS = 3;
const MENSAJE_PERMISO = 'La programación no está disponible para la cuenta técnica actual.';

function ExigirResponsable(acceso) {
  if (!acceso || typeof acceso.principalId !== 'string' || acceso.principalId.length === 0) {
    throw new ErrorProhibido('La identidad de la sesión no puede usarse como responsable.');
  }
  return acceso.principalId;
}

function TraducirPersistencia(error) {
  if (error && error.expose === true) {
    throw error;
  }
  if (error && error.code === 'NO_ENCONTRADO') {
    throw new ErrorNoEncontrado('El recurso solicitado no existe.');
  }
  if (error && error.code === 'ESTADO') {
    throw new ErrorConflicto('La actividad ya no está programada.');
  }
  if (error && error.code === 'FECHA') {
    throw new ErrorValidacion('La nueva fecha debe ser distinta de la fecha vigente.');
  }
  if (error && error.code === 'CLAVE_AJENA') {
    throw new ErrorConflicto('La clave de la operación ya se usó en otra actividad.');
  }
  if (error && error.code === 'PERMISO') {
    throw new ErrorInfraestructura(MENSAJE_PERMISO);
  }
  if (error && error.code === 'INTERBLOQUEO') {
    return 'REINTENTAR';
  }
  if (error instanceof ErrorInfraestructura) {
    throw error;
  }
  throw new ErrorInfraestructura('La operación de base de datos no se completó.');
}

function FechaHoy() {
  return FechaCalendarioLocal();
}

function MarcarVencida(actividad, hoy) {
  const vencida = actividad.estado === 'PROGRAMADA' && actividad.fechaVigente < hoy;
  return {
    ...actividad,
    vencida,
    alerta: vencida ? 'Vencida' : null
  };
}

/**
 * Programación de Oficina Local.
 * Las próximas acciones se leen de la atención y no se convierten en filas.
 *
 * @param {object} dependencias Repositorio y adaptador territorial.
 * @returns {object} Consulta, alta y resolución.
 */
function CrearServicioProgramacion(dependencias) {
  const repositorio = dependencias.repositorio;
  const adaptador = dependencias.adaptador;

  function ExigirOficina(acceso, capacidad) {
    ExigirCapacidad(acceso, capacidad);
    if (!acceso || acceso.accessLevel !== ACCESS_LEVEL.LOCAL_OFFICE) {
      throw new ErrorProhibido('La operación no está permitida.');
    }
  }

  async function Ambito(acceso, establecimientoId) {
    return ResolverAmbitoTerritorial(acceso, {
      regionId: null,
      localOfficeId: null,
      establishmentId: establecimientoId ?? null
    }, {
      BuscarEstablecimiento: (id) => adaptador.BuscarEstablecimiento(id),
      BuscarOficinaLocal: (id) => adaptador.BuscarOficinaLocal(id),
      BuscarRegion: (id) => adaptador.BuscarRegion(id)
    });
  }

  async function Reintentar(operacion) {
    for (let intento = 1; intento <= INTENTOS; intento += 1) {
      try {
        return await operacion();
      } catch (error) {
        const traduccion = TraducirPersistencia(error);
        if (traduccion === 'REINTENTAR' && intento < INTENTOS) {
          continue;
        }
        if (traduccion === 'REINTENTAR') {
          throw new ErrorConflicto(
            'La operación no pudo confirmarse por concurrencia. Intente de nuevo.'
          );
        }
      }
    }
    throw new ErrorInfraestructura('La operación de base de datos no se completó.');
  }

  function RegistroBase(acceso, ambito, claveOperacion) {
    return {
      usuario: ExigirResponsable(acceso),
      rol: acceso.accessLevel,
      oficinaLocalId: ambito.localOfficeId,
      regionId: ambito.regionId,
      ambito: `OL:${ambito.localOfficeId}/R:${ambito.regionId}`,
      claveOperacion
    };
  }

  async function TiposVigentes() {
    const filas = await repositorio.ListarTipos();
    return filas.map((fila) => ({
      itemId: Number(fila.cat_item_id),
      codigo: fila.codigo,
      etiqueta: fila.etiqueta
    }));
  }

  return {
    async ListarCatalogos(acceso) {
      ExigirOficina(acceso, CAPABILITY.SCHEDULING_READ);
      try {
        const items = await TiposVigentes();
        if (items.length === 0) {
          return {
            disponibilidad: 'NEEDS_VALIDATION',
            items: [],
            mensaje: 'No hay tipos vigentes de actividad programada.'
          };
        }
        return { disponibilidad: 'DISPONIBLE', items };
      } catch (error) {
        if (error && error.code === 'PERMISO') {
          return {
            disponibilidad: 'BLOQUEADO',
            items: [],
            mensaje: MENSAJE_PERMISO
          };
        }
        throw TraducirPersistencia(error);
      }
    },

    async Consultar(acceso, filtros) {
      ExigirOficina(acceso, CAPABILITY.SCHEDULING_READ);
      const ambito = await Ambito(acceso, filtros.establecimientoId);
      const hoy = FechaHoy();
      const filas = await Reintentar(() => repositorio.Listar({
        oficinaLocalId: ambito.localOfficeId,
        regionId: ambito.regionId,
        establecimientoId: filtros.establecimientoId,
        estado: filtros.estado
      }));
      const total = await Reintentar(() => repositorio.Contar({
        oficinaLocalId: ambito.localOfficeId,
        regionId: ambito.regionId
      }));
      const ids = filas.map((fila) => Number(fila.actividad_id));
      let personas = [];
      let personasDisponibles = true;
      try {
        personas = await repositorio.ListarPersonas(ids);
      } catch (error) {
        if (error && error.code === 'PERMISO') {
          personasDisponibles = false;
        } else {
          throw TraducirPersistencia(error);
        }
      }
      let cambios = [];
      let cambiosDisponibles = true;
      try {
        cambios = await repositorio.ListarCambios(ids);
      } catch (error) {
        if (error && error.code === 'PERMISO') {
          cambiosDisponibles = false;
        } else {
          throw TraducirPersistencia(error);
        }
      }
      let acciones = null;
      let accionesDisponibles = true;
      try {
        acciones = await repositorio.ListarProximasAcciones({
          oficinaLocalId: ambito.localOfficeId,
          regionId: ambito.regionId
        });
      } catch (error) {
        if (error && error.code === 'PERMISO') {
          accionesDisponibles = false;
        } else {
          throw TraducirPersistencia(error);
        }
      }
      const actividades = filas.map((fila) => {
        const actividadId = Number(fila.actividad_id);
        const propias = personas.filter((item) => Number(item.actividad_id) === actividadId);
        const historia = cambios.filter((item) => Number(item.actividad_id) === actividadId);
        return MarcarVencida({
          actividadId,
          establecimientoId: fila.establecimiento_id === null
            ? null
            : Number(fila.establecimiento_id),
          tipoItemId: Number(fila.tipo_item_id),
          titulo: fila.titulo,
          fechaPrevista: String(fila.fecha_prevista).slice(0, 10),
          fechaVigente: String(fila.fecha_vigente).slice(0, 10),
          estado: fila.estado,
          motivo: fila.motivo_vigente,
          observaciones: fila.observaciones,
          responsable: fila.creada_por,
          personas: personasDisponibles
            ? propias.map((item) => ({
              identificacion: item.per_id_persona,
              casoId: item.caso_id === null ? null : Number(item.caso_id)
            }))
            : null,
          cambios: cambiosDisponibles
            ? historia.map((cambio) => ({
              numero: Number(cambio.numero),
              estadoAnterior: cambio.estado_anterior,
              estadoNuevo: cambio.estado_nuevo,
              fechaAnterior: cambio.fecha_anterior,
              fechaNueva: cambio.fecha_nueva,
              motivo: cambio.motivo,
              usuario: cambio.usuario,
              ocurridoEn: cambio.ocurrido_en
            }))
            : null
        }, hoy);
      });
      return {
        fechaConsulta: hoy,
        cantidad: actividades.length,
        total,
        actividades,
        personas: personasDisponibles
          ? { disponibilidad: 'DISPONIBLE' }
          : { disponibilidad: 'BLOQUEADO', mensaje: MENSAJE_PERMISO },
        historial: cambiosDisponibles
          ? { disponibilidad: 'DISPONIBLE' }
          : { disponibilidad: 'BLOQUEADO', mensaje: MENSAJE_PERMISO },
        proximasAcciones: accionesDisponibles
          ? {
            disponibilidad: 'DISPONIBLE',
            cantidad: acciones.length,
            items: acciones.map((fila) => ({
              casoId: Number(fila.caso_id),
              identificacion: fila.per_id_persona,
              accion: fila.proxima_accion,
              fecha: fila.fecha_proxima,
              atencionId: Number(fila.atencion_individual_id),
              origen: 'ATENCION_INDIVIDUAL'
            })),
            nota: 'Salen de la última atención individual. No son la frecuencia del plan ni una actividad programada.'
          }
          : {
            disponibilidad: 'BLOQUEADO',
            cantidad: null,
            items: null,
            mensaje: MENSAJE_PERMISO
          }
      };
    },

    async CrearActividad(acceso, solicitud) {
      ExigirOficina(acceso, CAPABILITY.SCHEDULING_MANAGE);
      const ambito = await Ambito(acceso, solicitud.establecimientoId);
      let tipos;
      try {
        tipos = await TiposVigentes();
      } catch (error) {
        throw TraducirPersistencia(error);
      }
      if (!tipos.some((item) => item.itemId === solicitud.tipoItemId)) {
        throw new ErrorValidacion('El tipo de actividad no está vigente.');
      }
      const resultado = await Reintentar(() => repositorio.Crear({
        ...RegistroBase(acceso, ambito, solicitud.claveOperacion),
        fecha: solicitud.fecha,
        tipoItemId: solicitud.tipoItemId,
        titulo: solicitud.titulo,
        establecimientoId: solicitud.establecimientoId,
        observaciones: solicitud.observaciones,
        casos: solicitud.casos
      }));
      return {
        repetida: resultado.repetida,
        actividad: MarcarVencida(resultado.actividad, FechaHoy())
      };
    },

    async ResolverActividad(acceso, actividadId, solicitud) {
      ExigirOficina(acceso, CAPABILITY.SCHEDULING_MANAGE);
      const ambito = await Ambito(acceso, null);
      const hoy = FechaHoy();
      if (solicitud.efecto === 'REPROGRAMADA' && solicitud.nuevaFecha < hoy) {
        throw new ErrorValidacion('La nueva fecha no puede ser anterior a hoy.');
      }
      const resultado = await Reintentar(() => repositorio.Resolver({
        ...RegistroBase(acceso, ambito, solicitud.claveOperacion),
        actividadId,
        efecto: solicitud.efecto,
        motivo: solicitud.motivo,
        nuevaFecha: solicitud.nuevaFecha
      }));
      return {
        repetida: resultado.repetida,
        actividad: MarcarVencida(resultado.actividad, hoy)
      };
    }
  };
}

module.exports = { CrearServicioProgramacion };

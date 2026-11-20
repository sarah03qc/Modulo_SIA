/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * Modificación: 2026-11-18. Estrategia «Otra» con texto y lectura del caso activo.
 * HU-036 y HU-037. No convierte actividades educativas generales en atención.
 */
'use strict';

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

const NO_ENCONTRADO = 'El recurso solicitado no existe.';
const INTENTOS = 3;
const CATALOGOS_CON_TEXTO = new Set(['ESTRATEGIA']);

function ExigirResponsable(acceso) {
  if (!acceso || typeof acceso.principalId !== 'string' || acceso.principalId.length === 0) {
    throw new ErrorProhibido('La identidad de la sesión no puede usarse como responsable.');
  }
  return acceso.principalId;
}

function TraducirPersistencia(error, mensajes) {
  if (error && error.expose === true) {
    throw error;
  }
  if (error && error.code === 'CASO_NO_ACTIVO') {
    throw new ErrorConflicto('La atención solo puede registrarse sobre un caso activo autorizado.');
  }
  if (error && error.code === 'DUPLICADO') {
    throw new ErrorConflicto(mensajes.duplicado || 'La actividad ya incluye a esa persona.');
  }
  if (error && error.code === 'PERMISO') {
    throw new ErrorInfraestructura(
      'La escritura de atenciones no está disponible para la cuenta técnica actual.'
    );
  }
  if (error && error.code === 'INTERBLOQUEO') {
    return 'REINTENTAR';
  }
  if (error instanceof ErrorInfraestructura) {
    throw error;
  }
  throw new ErrorInfraestructura('La operación de base de datos no se completó.');
}

function RequiereTexto(fila) {
  return fila.requiere_texto === true || fila.requiere_texto === 1;
}

/**
 * Presenta un catálogo vigente. Solo ESTRATEGIA guarda la especificación de «Otra»
 * (ate_individual.estrategia_otra_texto); en los demás no hay dónde conservarla.
 *
 * @param {Array<object>} filas Ítems leídos de cat_item.
 * @param {string} codigo Código del catálogo.
 * @returns {object} Disponibilidad e ítems.
 */
function PresentarCatalogo(filas, codigo) {
  const admiteTexto = CATALOGOS_CON_TEXTO.has(codigo);
  const items = filas
    .filter((fila) => fila.codigo_catalogo === codigo)
    .filter((fila) => admiteTexto || (
      fila.codigo !== 'OTRA' && fila.codigo !== 'OTRO' && !RequiereTexto(fila)
    ))
    .map((fila) => ({
      itemId: Number(fila.cat_item_id),
      codigo: fila.codigo,
      etiqueta: fila.etiqueta,
      requiereTexto: RequiereTexto(fila)
    }));
  if (items.length === 0) {
    return {
      disponibilidad: 'NEEDS_VALIDATION',
      items: [],
      mensaje: `No hay ítems vigentes de ${codigo}. No se inventan valores.`
    };
  }
  return { disponibilidad: 'DISPONIBLE', items };
}

/**
 * Servicio de atenciones. La capacidad y el ámbito se comprueban aquí.
 *
 * @param {object} dependencias Repositorio y adaptador territorial.
 * @returns {object} Operaciones de catálogo y registro.
 */
function CrearServicioAtenciones(dependencias) {
  const repositorio = dependencias.repositorio;
  const adaptador = dependencias.adaptador;

  async function Ambito(acceso) {
    return ResolverAmbitoTerritorial(acceso, {
      regionId: null,
      localOfficeId: null,
      establishmentId: null
    }, {
      BuscarEstablecimiento: (id) => adaptador.BuscarEstablecimiento(id),
      BuscarOficinaLocal: (id) => adaptador.BuscarOficinaLocal(id),
      BuscarRegion: (id) => adaptador.BuscarRegion(id)
    });
  }

  function ExigirOficina(acceso) {
    ExigirCapacidad(acceso, CAPABILITY.ATTENTION_WRITE);
    if (!acceso || acceso.accessLevel !== ACCESS_LEVEL.LOCAL_OFFICE) {
      throw new ErrorProhibido('La operación no está permitida.');
    }
  }

  async function Reintentar(operacion, mensajes) {
    for (let intento = 1; intento <= INTENTOS; intento += 1) {
      try {
        return await operacion();
      } catch (error) {
        const traduccion = TraducirPersistencia(error, mensajes);
        if (traduccion === 'REINTENTAR' && intento < INTENTOS) {
          continue;
        }
        if (traduccion === 'REINTENTAR') {
          throw new ErrorConflicto('La operación no pudo confirmarse por concurrencia. Intente de nuevo.');
        }
      }
    }
    throw new ErrorInfraestructura('La operación de base de datos no se completó.');
  }

  function ExigirItem(catalogo, itemId, mensaje) {
    if (catalogo.disponibilidad !== 'DISPONIBLE') {
      throw new ErrorValidacion(catalogo.mensaje);
    }
    const encontrado = catalogo.items.find((item) => item.itemId === itemId);
    if (!encontrado) {
      throw new ErrorValidacion(mensaje);
    }
    return encontrado;
  }

  function ExigirTextoEstrategia(estrategia, texto) {
    if (estrategia.requiereTexto && !texto) {
      throw new ErrorValidacion('Especifique la estrategia.');
    }
    if (!estrategia.requiereTexto && texto) {
      throw new ErrorValidacion('La estrategia elegida no admite especificación.');
    }
  }

  return {
    async ListarCatalogos(acceso) {
      ExigirOficina(acceso);
      const filas = await repositorio.ListarCatalogo([
        'DISCIPLINA',
        'ESTRATEGIA',
        'TIPO_ATENCION'
      ]);
      return {
        disciplinas: PresentarCatalogo(filas, 'DISCIPLINA'),
        estrategias: PresentarCatalogo(filas, 'ESTRATEGIA'),
        tipos: PresentarCatalogo(filas, 'TIPO_ATENCION'),
        clasificacionActividadesEducativas: 'NEEDS_VALIDATION'
      };
    },

    /**
     * Registra una atención individual de un caso activo del ámbito.
     *
     * @param {object} acceso Sesión ya resuelta.
     * @param {object} solicitud Datos validados.
     * @returns {Promise<object>} Identificador y fechas distinguibles.
     */
    async RegistrarIndividual(acceso, solicitud) {
      ExigirOficina(acceso);
      const ambito = await Ambito(acceso);
      const catalogo = await repositorio.ListarCatalogo(['DISCIPLINA', 'ESTRATEGIA']);
      ExigirItem(
        PresentarCatalogo(catalogo, 'DISCIPLINA'),
        solicitud.disciplinaId,
        'La disciplina no pertenece al catálogo vigente.'
      );
      const estrategia = ExigirItem(
        PresentarCatalogo(catalogo, 'ESTRATEGIA'),
        solicitud.estrategiaId,
        'La estrategia no pertenece al catálogo vigente.'
      );
      const estrategiaOtraTexto = solicitud.estrategiaOtraTexto ?? null;
      ExigirTextoEstrategia(estrategia, estrategiaOtraTexto);
      const caso = await repositorio.BuscarCasoActivo(solicitud.casoId, ambito);
      if (!caso) {
        throw new ErrorNoEncontrado(NO_ENCONTRADO);
      }
      const responsable = ExigirResponsable(acceso);
      const atencionId = await Reintentar(() => repositorio.RegistrarIndividual({
        ...solicitud,
        estrategiaOtraTexto,
        personaId: caso.per_id_persona,
        oficinaLocalId: ambito.localOfficeId,
        regionId: ambito.regionId,
        profesional: responsable,
        digitador: responsable,
        rol: acceso.accessLevel,
        ambitoTexto: `OL-${ambito.localOfficeId}`
      }), {});
      return {
        atencionId,
        casoId: solicitud.casoId,
        fechaAtencion: solicitud.fechaAtencion,
        estrategiaId: solicitud.estrategiaId,
        estrategiaOtraTexto,
        profesional: responsable
      };
    },

    /**
     * Confirma que el caso está activo y dentro del ámbito de la sesión.
     * No expone datos clínicos; el nombre se consulta en el listado de casos.
     *
     * @param {object} acceso Sesión ya resuelta.
     * @param {number} casoId Caso solicitado.
     * @returns {Promise<object>} Identificadores del caso activo.
     */
    async ObtenerCasoActivo(acceso, casoId) {
      ExigirOficina(acceso);
      const ambito = await Ambito(acceso);
      const caso = await repositorio.BuscarCasoActivo(casoId, ambito);
      if (!caso) {
        throw new ErrorNoEncontrado(NO_ENCONTRADO);
      }
      return {
        casoId: Number(caso.caso_id),
        identificacion: caso.per_id_persona,
        establecimientoId: caso.establecimiento_id === null
          || caso.establecimiento_id === undefined
          ? null
          : Number(caso.establecimiento_id),
        estado: caso.estado
      };
    },

    /**
     * Registra una sola actividad grupal vinculada a varios casos activos.
     * La clasificación frente a sesiones educativas generales queda pendiente.
     *
     * @param {object} acceso Sesión ya resuelta.
     * @param {object} solicitud Datos validados.
     * @returns {Promise<object>} Actividad y cantidad de participantes.
     */
    async RegistrarGrupal(acceso, solicitud) {
      ExigirOficina(acceso);
      const ambito = await Ambito(acceso);
      const catalogo = await repositorio.ListarCatalogo([
        'DISCIPLINA',
        'TIPO_ATENCION'
      ]);
      const tipos = PresentarCatalogo(catalogo, 'TIPO_ATENCION');
      ExigirItem(tipos, solicitud.tipoId, 'El tipo no pertenece al catálogo vigente.');
      const disciplinas = PresentarCatalogo(catalogo, 'DISCIPLINA');
      for (const disciplinaId of solicitud.disciplinas) {
        ExigirItem(
          disciplinas,
          disciplinaId,
          'Una disciplina no pertenece al catálogo vigente.'
        );
      }
      const participantes = [];
      for (const participante of solicitud.participantes) {
        const caso = await repositorio.BuscarCasoActivo(participante.casoId, ambito);
        if (!caso) {
          throw new ErrorNoEncontrado(NO_ENCONTRADO);
        }
        participantes.push({
          casoId: participante.casoId,
          personaId: caso.per_id_persona,
          asistio: participante.asistio
        });
      }
      const responsable = ExigirResponsable(acceso);
      const profesionales = [responsable];
      for (const profesional of solicitud.profesionales) {
        if (!profesionales.includes(profesional)) {
          profesionales.push(profesional);
        }
      }
      const atencionId = await Reintentar(() => repositorio.RegistrarGrupal({
        ...solicitud,
        participantes,
        profesionales,
        oficinaLocalId: ambito.localOfficeId,
        regionId: ambito.regionId,
        digitador: responsable,
        rol: acceso.accessLevel,
        ambitoTexto: `OL-${ambito.localOfficeId}`
      }), { duplicado: 'Una persona quedó repetida en la actividad.' });
      return {
        atencionGrupalId: atencionId,
        participantes: participantes.length,
        clasificacionActividadesEducativas: 'NEEDS_VALIDATION'
      };
    }
  };
}

module.exports = { CrearServicioAtenciones };

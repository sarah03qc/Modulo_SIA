/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-18.
 * Orquesta lectura, interpretación, reglas, conciliación y consulta.
 * HU-049, RF-127, RF-102, RF-021 y RN-037.
 */
'use strict';

const { ErrorConflicto, ErrorNoEncontrado, ErrorProhibido, ErrorValidacion } = require('../../common/errors');
const { ExigirCapacidad } = require('../../infrastructure/auth/authorization-policy');
const { CAPABILITY } = require('../../infrastructure/auth/capabilities');
const { ACCESS_LEVEL } = require('../../infrastructure/auth/institutional-roles');
const { ResolverAmbitoTerritorial } = require('../institutional/territorial-scope');
const {
  CAMPOS,
  CRITERIO_DEMO,
  FRECUENCIA_HORAS,
  MODO_INSTITUCIONAL,
  ORIGEN_SINTETICO,
  LeerModo
} = require('./configuracion-nutricion');
const { EdadEnEvaluacion, InterpretarCampo } = require('./interprete-nutricional');
const { EvaluarReglas } = require('./reglas-nutricion');
const { Conciliar, SeleccionarVigentes } = require('./conciliacion-posible');

const TAMANO_PAGINA = 20;
const TAMANO_MAXIMO = 50;

let corridaActiva = null;
let temporizador = null;

function ExigirNivelOperativo(acceso) {
  ExigirCapacidad(acceso, CAPABILITY.REFERRAL_READ);
  const nivel = acceso && acceso.accessLevel;
  if (nivel !== ACCESS_LEVEL.ESTABLISHMENT && nivel !== ACCESS_LEVEL.LOCAL_OFFICE) {
    throw new ErrorProhibido('La consulta no está disponible en este ámbito.');
  }
}

function EnAmbito(fila, ambito) {
  if (ambito.accessLevel === ACCESS_LEVEL.ESTABLISHMENT) {
    return ambito.establishmentIds.includes(Number(fila.establecimientoId));
  }
  return Number(fila.oficinaLocalId) === Number(ambito.localOfficeId)
    && Number(fila.regionId) === Number(ambito.regionId);
}

function Etiqueta(codigo, origen) {
  if (codigo === CRITERIO_DEMO || origen === ORIGEN_SINTETICO) {
    return {
      criterioEtiqueta: 'Señal nutricional de demostración. No es un diagnóstico.',
      demostracion: true
    };
  }
  if (codigo === 'SYN_CRITERIO_TAMIZAJE' || codigo === 'SYN_TEST') {
    return {
      criterioEtiqueta: 'Criterio sintético de tamizaje. No es un diagnóstico.',
      demostracion: true
    };
  }
  if (codigo === 'NUTRICION_CAH') {
    return {
      criterioEtiqueta: 'Revisión nutricional. No sustituye el criterio profesional.',
      demostracion: false
    };
  }
  return {
    criterioEtiqueta: 'Criterio registrado',
    demostracion: false
  };
}

function Presentar(fila, identidad) {
  const texto = Etiqueta(fila.criterio_codigo, fila.sistema_origen);
  return {
    posibleId: Number(fila.posible_id),
    personId: fila.per_id_persona,
    nombre: identidad ? identidad.nombre : null,
    establecimientoId: Number(fila.establecimiento_id),
    establecimiento: identidad ? identidad.establecimiento : null,
    criterioCodigo: fila.criterio_codigo,
    criterioEtiqueta: texto.criterioEtiqueta,
    demostracion: texto.demostracion,
    sistemaOrigen: fila.sistema_origen,
    fechaDeteccion: fila.fecha_deteccion,
    estado: fila.estado,
    referenciaId: fila.referencia_id === null ? null : Number(fila.referencia_id)
  };
}

function NombreDe(fila) {
  if (!fila) {
    return null;
  }
  const nombre = [fila.given_name, fila.first_surname, fila.second_surname]
    .filter((parte) => parte && String(parte).trim())
    .join(' ')
    .trim();
  return nombre || null;
}

function Sumar(conteo, motivo) {
  conteo[motivo] = (conteo[motivo] || 0) + 1;
}

/**
 * @param {object} dependencias Repositorio, lector, adaptador y período.
 * @returns {object} Servicio de posibles referencias.
 */
function CrearServicioPosibles(dependencias) {
  const repositorio = dependencias.repositorio;
  const adaptador = dependencias.adaptador;
  const periodId = Number(dependencias.periodId);
  const modo = dependencias.modo || LeerModo(process.env);
  const logger = dependencias.logger;

  async function Ambito(acceso, filtros) {
    return ResolverAmbitoTerritorial(acceso, {
      regionId: null,
      localOfficeId: null,
      establishmentId: filtros && filtros.establecimientoId
        ? filtros.establecimientoId
        : null
    });
  }

  async function Identidad(ambito, personId) {
    if (!adaptador || typeof adaptador.BuscarPersonaEnAmbito !== 'function') {
      return null;
    }
    const filas = await adaptador.BuscarPersonaEnAmbito({ periodId, personId, scope: ambito });
    if (!filas || filas.length !== 1 || Number(filas[0].location_count) !== 1) {
      return null;
    }
    return {
      nombre: NombreDe(filas[0]),
      establecimiento: filas[0].establishment_name || null
    };
  }

  async function PersonasDeBusqueda(ambito, texto) {
    const criterio = texto.trim();
    if (!criterio) {
      return null;
    }
    const porIdentificador = /[0-9]/.test(criterio);
    const resultado = await adaptador.BuscarPersonas({
      mode: porIdentificador ? 'identification' : 'name',
      periodId,
      text: criterio,
      scope: ambito,
      offset: 0,
      pageSize: 50
    });
    if (resultado.total > 50) {
      throw new ErrorValidacion('La búsqueda es demasiado amplia. Precise el criterio.');
    }
    return resultado.items.map((fila) => fila.person_id);
  }

  function PrepararEvaluaciones(filas) {
    const convertidas = filas.map((fila) => ({
      evaluacionId: Number(fila.evaluacion_id),
      personId: fila.person_id,
      fechaEvaluacion: String(fila.fecha_evaluacion).slice(0, 10),
      birthDate: fila.birth_date ? String(fila.birth_date).slice(0, 10) : null,
      codigos: {
        PE: fila.codigo_pe,
        PT: fila.codigo_pt,
        TE: fila.codigo_te,
        IMC: fila.codigo_imc
      },
      establecimientoId: Number(fila.establishment_id),
      oficinaLocalId: Number(fila.local_office_id),
      regionId: Number(fila.region_id),
      ubicacionAmbigua: Number(fila.location_count) !== 1
    }));
    const personasAmbiguas = new Set(
      convertidas.filter((fila) => fila.ubicacionAmbigua).map((fila) => fila.personId)
    );
    const utiles = convertidas.filter((fila) => !personasAmbiguas.has(fila.personId));
    return {
      utiles,
      personasAmbiguas
    };
  }

  async function DetectarEnAmbito(acceso, ambito, usuario) {
    if (corridaActiva) {
      throw new ErrorConflicto('Ya hay una detección en curso.');
    }
    const promesa = Detectar(acceso, ambito, usuario);
    corridaActiva = promesa;
    try {
      return await promesa;
    } finally {
      corridaActiva = null;
    }
  }

  async function Detectar(acceso, ambito, usuario) {
    if (modo === MODO_INSTITUCIONAL) {
      return {
        modo,
        estado: 'CODIGOS_NO_VALIDADOS',
        sugerenciasNuevas: 0,
        evaluacionesLeidas: 0,
        omitidas: {},
        errores: 0
      };
    }
    const lectura = await adaptador.ListarEvaluacionesNutricionales(periodId);
    const preparadas = PrepararEvaluaciones(lectura.filas);
    const enAmbito = ambito
      ? preparadas.utiles.filter((fila) => EnAmbito(fila, ambito))
      : preparadas.utiles;
    const seleccion = SeleccionarVigentes(enAmbito);
    const vigentes = seleccion.vigentes;
    const casos = await repositorio.PersonasConCasoActivo();
    const hechos = await repositorio.HechosNutricion();
    const indice = new Map();
    for (const hecho of hechos) {
      const clave = `${hecho.per_id_persona}|${hecho.criterio_codigo}|${hecho.establecimiento_id}`;
      const lista = indice.get(clave) || [];
      lista.push(hecho);
      indice.set(clave, lista);
    }
    let ambiguas = 0;
    for (const personId of preparadas.personasAmbiguas) {
      const fila = lectura.filas.find((item) => item.person_id === personId);
      if (!fila) {
        continue;
      }
      const candidato = {
        establecimientoId: Number(fila.establishment_id),
        oficinaLocalId: Number(fila.local_office_id),
        regionId: Number(fila.region_id)
      };
      if (!ambito || EnAmbito(candidato, ambito)) {
        ambiguas += 1;
      }
    }
    const omitidas = { HISTORICA: seleccion.historicas, UBICACION_AMBIGUA: ambiguas };
    let nuevas = 0;
    let errores = 0;
    for (const evaluacion of vigentes) {
      try {
        const resultado = await Considerar(evaluacion, casos, indice);
        if (resultado === 'CREADA') {
          nuevas += 1;
        } else if (resultado) {
          Sumar(omitidas, resultado);
        }
      } catch (error) {
        errores += 1;
        if (logger) {
          logger.error('La detección no pudo guardar una sugerencia', {
            driverCode: error && error.code ? error.code : 'DETECCION'
          });
        }
      }
    }
    const resumen = {
      modo,
      estado: 'COMPLETADA',
      institucional: 'DESHABILITADO',
      evaluacionesLeidas: enAmbito.length,
      evaluacionesVigentes: vigentes.length,
      sugerenciasNuevas: nuevas,
      omitidas,
      errores
    };
    await repositorio.RegistrarEjecucion({
      usuario,
      rol: acceso && acceso.accessLevel ? acceso.accessLevel : 'SISTEMA',
      entidadId: modo,
      ambito: ambito && ambito.localOfficeId
        ? `OFICINA:${ambito.localOfficeId}`
        : 'AMBITO_LOCAL',
      codigo: CodigoEjecucion(resumen)
    });
    return resumen;
  }

  async function Considerar(evaluacion, casos, indice) {
    const edad = EdadEnEvaluacion(evaluacion.birthDate, evaluacion.fechaEvaluacion);
    const indicadores = CAMPOS.map((campo) => InterpretarCampo({
      campo,
      codigo: evaluacion.codigos[campo],
      modo
    }));
    const regla = EvaluarReglas({ indicadores, edadAnios: edad, modo });
    if (!regla.detectar) {
      return regla.estado === 'SIN_SENAL' ? null : regla.estado;
    }
    const idExterno = `EVM-${evaluacion.evaluacionId}`;
    const clave = `${evaluacion.personId}|${regla.criterioCodigo}|${evaluacion.establecimientoId}`;
    const previos = indice.get(clave) || [];
    const pendiente = previos.find((fila) => fila.estado === 'PENDIENTE') || null;
    const decision = Conciliar({
      fechaEvaluacion: evaluacion.fechaEvaluacion,
      ubicacionAmbigua: false,
      casoActivo: casos.has(evaluacion.personId),
      idExterno,
      pendiente: pendiente
        ? { idExterno: pendiente.id_externo }
        : null,
      resueltaMismaEvaluacion: previos.some((fila) => (
        fila.estado === 'REFERENCIA_CREADA' && fila.id_externo === idExterno
      )),
      resueltaMismoCriterio: previos.some((fila) => (
        fila.estado === 'REFERENCIA_CREADA' && fila.id_externo !== idExterno
      ))
    });
    if (decision.accion !== 'CREAR') {
      return decision.motivo;
    }
    const insercion = await repositorio.InsertarPendiente({
      personId: evaluacion.personId,
      establecimientoId: evaluacion.establecimientoId,
      oficinaLocalId: evaluacion.oficinaLocalId,
      regionId: evaluacion.regionId,
      criterioCodigo: regla.criterioCodigo,
      fechaDeteccion: evaluacion.fechaEvaluacion,
      idExterno,
      sistemaOrigen: ORIGEN_SINTETICO
    });
    if (insercion === 'CREADA') {
      previos.push({
        estado: 'PENDIENTE',
        id_externo: idExterno,
        criterio_codigo: regla.criterioCodigo
      });
      indice.set(clave, previos);
    }
    return insercion === 'CREADA' ? 'CREADA' : insercion;
  }

  return {
    modo,

    Configuracion() {
      return {
        modo,
        frecuenciaHoras: FRECUENCIA_HORAS,
        deteccionAutomatica: temporizador !== null,
        institucional: modo === MODO_INSTITUCIONAL
          ? 'CODIGOS_NO_VALIDADOS'
          : 'DESHABILITADO',
        mapeoSintetico: 'MOCK-1',
        mapeoInstitucional: 'INSTITUCIONAL-0'
      };
    },

    async Listar(acceso, criterios) {
      ExigirNivelOperativo(acceso);
      const ambito = await Ambito(acceso, criterios);
      const personas = criterios.texto
        ? await PersonasDeBusqueda(ambito, criterios.texto)
        : null;
      const pagina = criterios.pagina;
      const tamano = criterios.tamano;
      const filtro = {
        estado: criterios.estado,
        fecha: criterios.fecha,
        criterio: criterios.criterio,
        establecimientoId: criterios.establecimientoId,
        personas,
        desplazamiento: (pagina - 1) * tamano,
        tamano
      };
      const total = await repositorio.Contar(ambito, filtro);
      const filas = total === 0 ? [] : await repositorio.Listar(ambito, filtro);
      const casos = await repositorio.PersonasConCasoActivo();
      const items = [];
      for (const fila of filas) {
        const presentado = Presentar(fila, await Identidad(ambito, fila.per_id_persona));
        items.push({
          ...presentado,
          puedeCrearReferencia: fila.estado === 'PENDIENTE' && !casos.has(fila.per_id_persona)
        });
      }
      return {
        total,
        page: pagina,
        pageSize: tamano,
        modo,
        items
      };
    },

    async Detalle(acceso, posibleId) {
      ExigirNivelOperativo(acceso);
      const ambito = await Ambito(acceso, {});
      const fila = await repositorio.Obtener(ambito, posibleId);
      if (!fila) {
        throw new ErrorNoEncontrado('La posible referencia no está disponible en el ámbito.');
      }
      const casos = await repositorio.PersonasConCasoActivo();
      const presentado = Presentar(fila, await Identidad(ambito, fila.per_id_persona));
      const casoActivo = casos.has(fila.per_id_persona);
      return {
        ...presentado,
        puedeCrearReferencia: fila.estado === 'PENDIENTE'
          && !casoActivo
          && ExigirCapacidadSilenciosa(acceso),
        bloqueo: casoActivo
          ? 'Hay un caso de Atención Interdisciplinaria activo. No se inicia otra referencia.'
          : null
      };
    },

    async Ejecutar(acceso) {
      ExigirCapacidad(acceso, CAPABILITY.REFERRAL_CREATE);
      ExigirNivelOperativo(acceso);
      const ambito = await Ambito(acceso, {});
      return DetectarEnAmbito(
        acceso,
        ambito,
        acceso.principalId || 'deteccion-local'
      );
    },

    async Ultima() {
      const fila = await repositorio.UltimaEjecucion();
      if (!fila) {
        return { ejecutada: false };
      }
      return {
        ejecutada: true,
        ocurridoEn: fila.ocurrido_en,
        codigo: fila.codigo_cambio
      };
    },

    async ContarPendientes(ambito) {
      return repositorio.ContarPendientes(ambito);
    },

    /**
     * Corrida sin usuario, solo para el temporizador local.
     * No abre casos ni envía referencias.
     *
     * @returns {Promise<object>} Resumen sin identificadores de persona.
     */
    async EjecutarLocal() {
      return DetectarEnAmbito(
        { accessLevel: 'SISTEMA', principalId: 'deteccion-local' },
        null,
        'deteccion-local'
      );
    }
  };
}

function ExigirCapacidadSilenciosa(acceso) {
  try {
    ExigirCapacidad(acceso, CAPABILITY.REFERRAL_CREATE);
    return true;
  } catch {
    return false;
  }
}

function CodigoEjecucion(resumen) {
  const omitidas = Object.values(resumen.omitidas).reduce((total, valor) => total + valor, 0);
  return `E${resumen.evaluacionesLeidas};V${resumen.evaluacionesVigentes};`
    + `N${resumen.sugerenciasNuevas};O${omitidas};R${resumen.errores}`.slice(0, 80);
}

/**
 * Programa la corrida local. No ejecuta una detección al habilitarse.
 * Sin un acceso de usuario, recorre la réplica en el modo ya configurado.
 *
 * @param {object} servicio Servicio ya construido.
 * @param {object} logger Registro técnico, sin datos de personas.
 * @returns {void}
 */
function ProgramarDeteccion(servicio, logger) {
  if (temporizador) {
    return;
  }
  temporizador = setInterval(() => {
    servicio.EjecutarLocal().catch((error) => {
      if (logger) {
        logger.error('La detección programada no se completó', {
          driverCode: error && error.code ? error.code : 'DETECCION'
        });
      }
    });
  }, FRECUENCIA_HORAS * 60 * 60 * 1000);
  if (typeof temporizador.unref === 'function') {
    temporizador.unref();
  }
}

module.exports = {
  CrearServicioPosibles,
  ProgramarDeteccion,
  TAMANO_PAGINA,
  TAMANO_MAXIMO
};

/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-14.
 * HU-019 a HU-025. La prioridad no se acepta como dato de entrada.
 */
'use strict';

const { ErrorValidacion } = require('../../common/errors');
const { PROTECCION, RIESGO } = require('./reglas-prioridad');

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const PERSONA = /^[A-Za-z0-9-]{1,20}$/;
const ENTERO = /^[1-9][0-9]*$/;
const ENTERO_MAXIMO = 2147483647;
const TAMANO_PAGINA = 20;
const TAMANO_MAXIMO = 50;
const DESPLAZAMIENTO_MAXIMO = 5000;
const TEXTO_LUGAR = 200;
const TEXTO_PROPOSITO = 1000;
const TEXTO_JUSTIFICACION = 2000;
const TEXTO_ESPECIFICACION = 1000;
const PROPOSITOS_MAXIMOS = 8;
const ANIO_MINIMO = 2000;
const ANIO_MAXIMO = 2100;
const ESTADOS_CASO = new Set(['ACTIVO', 'CERRADO']);
const PRIORIDADES = new Set(['ALTO', 'MODERADO', 'BAJO']);
const CAMPOS_PROHIBIDOS = ['prioridad', 'prioridadCodigo', 'priority', 'estado', 'status'];

function EntradaInvalida(mensaje) {
  throw new ErrorValidacion(mensaje);
}

function Objeto(valor, mensaje) {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) {
    EntradaInvalida(mensaje);
  }
}

function RechazarPrioridadManual(cuerpo) {
  for (const campo of CAMPOS_PROHIBIDOS) {
    if (Object.prototype.hasOwnProperty.call(cuerpo, campo)) {
      EntradaInvalida('La prioridad y el estado los determina el sistema, no la solicitud.');
    }
  }
}

function LeerFecha(valor, etiqueta) {
  if (typeof valor !== 'string' || !FECHA.test(valor)) {
    EntradaInvalida(`La ${etiqueta} no es válida.`);
  }
  const anio = Number(valor.slice(0, 4));
  const mes = Number(valor.slice(5, 7));
  const dia = Number(valor.slice(8, 10));
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  const coincide = fecha.getUTCFullYear() === anio
    && fecha.getUTCMonth() === mes - 1
    && fecha.getUTCDate() === dia;
  if (!coincide || anio < ANIO_MINIMO || anio > ANIO_MAXIMO || mes < 1 || mes > 12) {
    EntradaInvalida(`La ${etiqueta} no es válida.`);
  }
  return valor;
}

function LeerHora(valor, etiqueta) {
  if (typeof valor !== 'string' || !HORA.test(valor)) {
    EntradaInvalida(`La ${etiqueta} no es válida.`);
  }
  return valor;
}

function Minutos(hora) {
  return Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));
}

function LeerEntero(valor, etiqueta) {
  const texto = typeof valor === 'number' && Number.isInteger(valor) ? String(valor) : valor;
  if (typeof texto !== 'string' || !ENTERO.test(texto)) {
    EntradaInvalida(`El dato ${etiqueta} no es válido.`);
  }
  const numero = Number(texto);
  if (!Number.isSafeInteger(numero) || numero > ENTERO_MAXIMO) {
    EntradaInvalida(`El dato ${etiqueta} no es válido.`);
  }
  return numero;
}

function LeerEnteroOpcional(valor, etiqueta) {
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }
  return LeerEntero(String(valor), etiqueta);
}

function LeerTextoOpcional(valor, etiqueta, maximo) {
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }
  if (typeof valor !== 'string') {
    EntradaInvalida(`El dato ${etiqueta} no es válido.`);
  }
  const texto = valor.trim();
  if (texto.length === 0) {
    return null;
  }
  if (texto.length > maximo) {
    EntradaInvalida(`El dato ${etiqueta} supera la longitud permitida.`);
  }
  return texto;
}

function LeerListaEnteros(valor, etiqueta) {
  if (valor === undefined || valor === null) {
    return [];
  }
  if (!Array.isArray(valor)) {
    EntradaInvalida(`El dato ${etiqueta} no es válido.`);
  }
  const vistos = new Set();
  return valor.map((item, indice) => {
    const numero = LeerEntero(typeof item === 'number' ? String(item) : item, etiqueta);
    if (vistos.has(numero)) {
      EntradaInvalida(`El dato ${etiqueta} está repetido.`);
    }
    vistos.add(numero);
    if (indice > 30) {
      EntradaInvalida(`El dato ${etiqueta} supera la cantidad permitida.`);
    }
    return numero;
  });
}

function LeerNivel(valor, permitidos, etiqueta) {
  if (typeof valor !== 'string' || !permitidos.includes(valor)) {
    EntradaInvalida(`El ${etiqueta} no corresponde a un nivel profesional confirmado.`);
  }
  return valor;
}

function LeerPagina(consulta) {
  const origen = consulta || {};
  const pagina = LeerEnteroOpcional(origen.pagina, 'página') || 1;
  const tamano = LeerEnteroOpcional(origen.tamano, 'tamaño') || TAMANO_PAGINA;
  if (tamano > TAMANO_MAXIMO) {
    EntradaInvalida('El tamaño de página supera el límite del listado.');
  }
  const desplazamiento = (pagina - 1) * tamano;
  if (desplazamiento > DESPLAZAMIENTO_MAXIMO) {
    EntradaInvalida('La página solicitada supera el límite del listado.');
  }
  return { pagina, tamano, desplazamiento };
}

function LeerSesion(cuerpo) {
  Objeto(cuerpo, 'La sesión no tiene un cuerpo utilizable.');
  const horaInicio = LeerHora(cuerpo.horaInicio, 'hora de inicio');
  const horaFin = LeerHora(cuerpo.horaFin, 'hora de finalización');
  if (Minutos(horaFin) <= Minutos(horaInicio)) {
    EntradaInvalida('La hora de finalización debe ser posterior a la de inicio.');
  }
  return {
    fecha: LeerFecha(cuerpo.fecha, 'fecha'),
    horaInicio,
    horaFin,
    lugar: LeerTextoOpcional(cuerpo.lugar, 'lugar', TEXTO_LUGAR),
    disciplinas: LeerListaEnteros(cuerpo.disciplinas, 'disciplinas')
  };
}

function LeerSituacion(cuerpo) {
  Objeto(cuerpo, 'La situación no tiene un cuerpo utilizable.');
  const referenciaId = LeerEnteroOpcional(cuerpo.referenciaId, 'referencia');
  const casoId = LeerEnteroOpcional(cuerpo.casoId, 'caso');
  const unaSola = (referenciaId === null) !== (casoId === null);
  if (!unaSola) {
    EntradaInvalida('La situación debe indicar una referencia o un caso activo, no ambos.');
  }
  return { referenciaId, casoId };
}

function LeerFactor(valor) {
  Objeto(valor, 'Cada factor debe indicar su identificador.');
  return {
    factorId: LeerEntero(
      typeof valor.factorId === 'number' ? String(valor.factorId) : valor.factorId,
      'factor'
    ),
    especificacion: LeerTextoOpcional(valor.especificacion, 'especificación', TEXTO_ESPECIFICACION)
  };
}

function LeerValoracion(cuerpo) {
  Objeto(cuerpo, 'La valoración no tiene un cuerpo utilizable.');
  RechazarPrioridadManual(cuerpo);
  if (!Array.isArray(cuerpo.categorias) || cuerpo.categorias.length === 0) {
    EntradaInvalida('La valoración debe incluir las categorías revisadas.');
  }
  const categorias = cuerpo.categorias.map((categoria) => {
    Objeto(categoria, 'Cada categoría debe indicar su respuesta.');
    const respuesta = categoria.respuesta;
    if (respuesta !== 'NINGUNO' && respuesta !== 'FACTORES') {
      EntradaInvalida('La respuesta de la categoría debe ser Ninguno o factores.');
    }
    const factores = Array.isArray(categoria.factores) ? categoria.factores.map(LeerFactor) : [];
    if (respuesta === 'NINGUNO' && factores.length > 0) {
      EntradaInvalida('Ninguno no puede combinarse con factores de la misma categoría.');
    }
    if (respuesta === 'FACTORES' && factores.length === 0) {
      EntradaInvalida('Una categoría con factores debe incluir al menos uno.');
    }
    return {
      categoriaId: LeerEntero(
        typeof categoria.categoriaId === 'number'
          ? String(categoria.categoriaId)
          : categoria.categoriaId,
        'categoría'
      ),
      respuesta,
      factores
    };
  });
  const situacionId = LeerEntero(
    typeof cuerpo.situacionId === 'number' ? String(cuerpo.situacionId) : cuerpo.situacionId,
    'situación'
  );
  return {
    situacionId,
    categorias,
    riesgoCodigo: LeerNivel(cuerpo.riesgoCodigo, RIESGO, 'riesgo'),
    proteccionCodigo: LeerNivel(cuerpo.proteccionCodigo, PROTECCION, 'nivel de protección')
  };
}

function LeerResolucion(cuerpo) {
  Objeto(cuerpo, 'La resolución no tiene un cuerpo utilizable.');
  const decision = cuerpo.decision;
  if (decision !== 'REQUIERE_AI' && decision !== 'NO_REQUIERE_AI') {
    EntradaInvalida('La decisión debe indicar si requiere o no Atención Interdisciplinaria.');
  }
  const justificacion = LeerTextoOpcional(cuerpo.justificacion, 'justificación', TEXTO_JUSTIFICACION);
  if (decision === 'NO_REQUIERE_AI' && !justificacion) {
    EntradaInvalida('La decisión de no requerir Atención Interdisciplinaria exige justificación.');
  }
  return {
    referenciaId: LeerEntero(
      typeof cuerpo.referenciaId === 'number' ? String(cuerpo.referenciaId) : cuerpo.referenciaId,
      'referencia'
    ),
    sesionId: LeerEntero(
      typeof cuerpo.sesionId === 'number' ? String(cuerpo.sesionId) : cuerpo.sesionId,
      'sesión'
    ),
    valoracionId: LeerEntero(
      typeof cuerpo.valoracionId === 'number' ? String(cuerpo.valoracionId) : cuerpo.valoracionId,
      'valoración'
    ),
    decision,
    justificacion: decision === 'REQUIERE_AI' ? justificacion : justificacion
  };
}

function LeerApertura(cuerpo) {
  Objeto(cuerpo, 'La apertura no tiene un cuerpo utilizable.');
  RechazarPrioridadManual(cuerpo);
  if (!Array.isArray(cuerpo.propositos) || cuerpo.propositos.length === 0) {
    EntradaInvalida('La apertura exige al menos un propósito.');
  }
  if (cuerpo.propositos.length > PROPOSITOS_MAXIMOS) {
    EntradaInvalida('La apertura supera la cantidad de propósitos permitida.');
  }
  const propositos = cuerpo.propositos.map((texto) => {
    const limpio = LeerTextoOpcional(texto, 'propósito', TEXTO_PROPOSITO);
    if (!limpio) {
      EntradaInvalida('Cada propósito debe tener texto.');
    }
    return limpio;
  });
  const estrategias = LeerListaEnteros(cuerpo.estrategias, 'estrategias');
  const disciplinas = LeerListaEnteros(cuerpo.disciplinas, 'disciplinas');
  if (estrategias.length === 0 || disciplinas.length === 0) {
    EntradaInvalida('La apertura exige estrategias y disciplinas del catálogo vigente.');
  }
  if (typeof cuerpo.frecuenciaCodigo !== 'string' || cuerpo.frecuenciaCodigo.trim() === '') {
    EntradaInvalida('La apertura exige una frecuencia del catálogo vigente.');
  }
  return {
    referenciaId: LeerEntero(
      typeof cuerpo.referenciaId === 'number' ? String(cuerpo.referenciaId) : cuerpo.referenciaId,
      'referencia'
    ),
    propositos,
    estrategias,
    disciplinas,
    frecuenciaCodigo: cuerpo.frecuenciaCodigo.trim()
  };
}

function LeerConsultaCasos(consulta) {
  const pagina = LeerPagina(consulta);
  const estado = LeerTextoOpcional(consulta && consulta.estado, 'estado', 20);
  if (estado && !ESTADOS_CASO.has(estado)) {
    EntradaInvalida('El estado solicitado no corresponde a un estado de caso.');
  }
  const prioridad = LeerTextoOpcional(consulta && consulta.prioridad, 'prioridad', 20);
  if (prioridad && !PRIORIDADES.has(prioridad)) {
    EntradaInvalida('La prioridad solicitada no corresponde a RN-009.');
  }
  const identificacion = LeerTextoOpcional(consulta && consulta.identificacion, 'identificación', 20);
  if (identificacion && !PERSONA.test(identificacion)) {
    EntradaInvalida('La identificación buscada no es válida.');
  }
  return {
    ...pagina,
    estado,
    prioridad,
    identificacion,
    nombre: LeerTextoOpcional(consulta && consulta.nombre, 'nombre', 80),
    establecimientoId: LeerEnteroOpcional(consulta && consulta.establecimientoId, 'establecimiento')
  };
}

function LeerConsultaPrioridad(cuerpo) {
  Objeto(cuerpo, 'La consulta de prioridad no tiene un cuerpo utilizable.');
  RechazarPrioridadManual(cuerpo);
  return {
    riesgoCodigo: LeerNivel(cuerpo.riesgoCodigo, RIESGO, 'riesgo'),
    proteccionCodigo: LeerNivel(cuerpo.proteccionCodigo, PROTECCION, 'nivel de protección')
  };
}

module.exports = {
  LeerSesion,
  LeerSituacion,
  LeerValoracion,
  LeerResolucion,
  LeerApertura,
  LeerConsultaCasos,
  LeerConsultaPrioridad,
  LeerEntero
};

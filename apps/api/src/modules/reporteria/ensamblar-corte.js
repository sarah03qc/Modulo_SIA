/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * Modificación: 2026-11-18. Sexo por código, cinco grupos de edad y nota de filtros.
 * Modificación: 2026-11-20. Agregación territorial, porcentajes y ámbito
 * de establecimiento. El período queda en la etiqueta, no en cada título.
 * El grupo etario se muestra con su etiqueta. No se usa una edad que ya no llega.
 * HU-038 y HU-039. El mismo ensamblado alimenta la API, la pantalla y la descarga.
 * No convierte un dato desconocido en cero. Un cero solo sale de un conteo realizado.
 */
'use strict';

const { AniosCumplidos } = require('../institutional/person-presenter');
const {
  PRESENTACION_TOP,
  MUESTRA_CASOS,
  PRIORIDADES,
  ESTADOS_CASO,
  MOTIVOS_CIERRE,
  SEXOS_FILTRO,
  SEXO_OTRO_VALOR,
  SEXO_SIN_DATO,
  GRUPOS_EDAD,
  EDAD_SIN_DATO,
  TEXTO_COBERTURA,
  CATALOGO_VISUALIZACIONES,
  PorcentajeCobertura,
  PorcentajeCategoria,
  ReferenciaTemporal,
  ContarPalabras,
  TituloDinamico,
  EtiquetaPrioridad,
  EtiquetaEstado,
  EtiquetaSexoFiltro,
  EtiquetaGrupoEdad,
  ClasificarGrupoEdad
} = require('./definiciones-analiticas');

function Asistio(valor) {
  return valor === true || valor === 1 || valor === '1';
}

function FechaConsulta(fecha) {
  const anio = Number(fecha.slice(0, 4));
  const mes = Number(fecha.slice(5, 7));
  const dia = Number(fecha.slice(8, 10));
  return new Date(anio, mes - 1, dia);
}

function DemografiaDe(mapa, personaId) {
  if (!personaId || !mapa) {
    return null;
  }
  return mapa.get(personaId) || null;
}

function PersonaCumple(personaId, filtros, demografia) {
  if (!filtros.sexo && !filtros.grupoEdad) {
    return true;
  }
  const dato = DemografiaDe(demografia, personaId);
  if (filtros.sexo && (!dato || dato.sexo !== filtros.sexo)) {
    return false;
  }
  if (filtros.grupoEdad && (!dato || dato.grupoEdad !== filtros.grupoEdad)) {
    return false;
  }
  return true;
}

function CasoEnEstablecimiento(caso, filtros) {
  if (!filtros.establecimientoId) {
    return true;
  }
  return caso.establecimientoId === filtros.establecimientoId;
}

function CasosDeDistribucion(hechos, filtros, demografia) {
  return hechos.casos.filter((caso) => {
    if (!CasoEnEstablecimiento(caso, filtros)) {
      return false;
    }
    if (filtros.estado !== 'TODOS' && caso.estado !== filtros.estado) {
      return false;
    }
    if (filtros.prioridad && caso.prioridad !== filtros.prioridad) {
      return false;
    }
    return PersonaCumple(caso.personaId, filtros, demografia);
  });
}

function CasosActivosCobertura(hechos, filtros, demografia) {
  return hechos.casos.filter((caso) => (
    caso.estado === 'ACTIVO'
    && CasoEnEstablecimiento(caso, filtros)
    && PersonaCumple(caso.personaId, filtros, demografia)
  ));
}

function IndividualAplica(fila, filtros, demografia, aplicarPersona) {
  if (filtros.establecimientoId && fila.establecimientoId !== filtros.establecimientoId) {
    return false;
  }
  if (filtros.disciplinaId && fila.disciplinaId !== filtros.disciplinaId) {
    return false;
  }
  if (filtros.profesional && fila.profesional !== filtros.profesional) {
    return false;
  }
  if (aplicarPersona && !PersonaCumple(fila.personaId, filtros, demografia)) {
    return false;
  }
  return true;
}

function GruposAplican(hechos, filtros) {
  const disciplinas = new Map();
  for (const fila of hechos.disciplinasGrupales) {
    const lista = disciplinas.get(fila.atencionId) || [];
    lista.push(fila.disciplinaId);
    disciplinas.set(fila.atencionId, lista);
  }
  const profesionales = new Map();
  for (const fila of hechos.profesionalesGrupales) {
    const lista = profesionales.get(fila.atencionId) || [];
    lista.push(fila.profesional);
    profesionales.set(fila.atencionId, lista);
  }
  return hechos.grupales.filter((grupo) => {
    if (filtros.establecimientoId && grupo.establecimientoId !== filtros.establecimientoId) {
      return false;
    }
    if (filtros.disciplinaId) {
      const lista = disciplinas.get(grupo.atencionId) || [];
      if (!lista.includes(filtros.disciplinaId)) {
        return false;
      }
    }
    if (filtros.profesional) {
      const lista = profesionales.get(grupo.atencionId) || [];
      if (!lista.includes(filtros.profesional)) {
        return false;
      }
    }
    return true;
  });
}

function ParticipantesEfectivos(hechos, grupos) {
  const identificadores = new Set(grupos.map((grupo) => grupo.atencionId));
  return hechos.participantes.filter((fila) => (
    identificadores.has(fila.atencionId) && Asistio(fila.asistio)
  ));
}

function CasoAtendido(casoId, individuales, participantes) {
  if (individuales.some((fila) => fila.casoId === casoId)) {
    return true;
  }
  return participantes.some((fila) => fila.casoId === casoId);
}

function Contar(serie, clave, etiqueta) {
  const actual = serie.get(clave) || { clave, etiqueta, cantidad: 0 };
  actual.cantidad += 1;
  serie.set(clave, actual);
  return serie;
}

function OrdenarSerie(serie) {
  return [...serie.values()].sort((a, b) => (
    b.cantidad - a.cantidad || String(a.etiqueta).localeCompare(String(b.etiqueta), 'es')
  ));
}

function NombreEstablecimiento(identificador, nombres) {
  if (identificador === null || identificador === undefined) {
    return 'Sin establecimiento en la actividad';
  }
  const nombre = nombres.get(identificador);
  if (nombre) {
    return nombre;
  }
  return `Establecimiento ${identificador}`;
}

function ComplementosCaso(filtros, nombres) {
  const partes = [];
  if (filtros.estado !== 'TODOS') {
    partes.push(`estado ${EtiquetaEstado(filtros.estado)}`);
  }
  if (filtros.prioridad) {
    partes.push(`prioridad ${EtiquetaPrioridad(filtros.prioridad)}`);
  }
  if (filtros.establecimientoId) {
    partes.push(NombreEstablecimiento(filtros.establecimientoId, nombres));
  }
  return partes.concat(ComplementosPersona(filtros));
}

function ComplementosPersona(filtros) {
  const partes = [];
  if (filtros.sexo) {
    partes.push(`sexo ${EtiquetaSexoFiltro(filtros.sexo)}`);
  }
  if (filtros.grupoEdad) {
    partes.push(`edad ${EtiquetaGrupoEdad(filtros.grupoEdad)}`);
  }
  return partes;
}

function ComplementosAtencion(filtros, nombres) {
  const partes = [];
  if (filtros.establecimientoId) {
    partes.push(NombreEstablecimiento(filtros.establecimientoId, nombres));
  }
  if (filtros.disciplinaId) {
    const disciplina = (filtros.catalogoDisciplinas || []).find((item) => (
      item.itemId === filtros.disciplinaId
    ));
    partes.push(disciplina ? disciplina.etiqueta : 'disciplina seleccionada');
  }
  if (filtros.profesional) {
    partes.push(`profesional ${filtros.profesional}`);
  }
  return partes;
}

function Visualizacion(definicion, titulo, estado, mensaje, serie, nota, filtrosAplicados) {
  return {
    numero: definicion.numero,
    codigo: definicion.codigo,
    titulo,
    formato: definicion.formato,
    fechaAplicada: definicion.fecha,
    estado,
    mensaje,
    serie,
    nota,
    filtrosAplicados
  };
}

function Definicion(numero) {
  return CATALOGO_VISUALIZACIONES.find((item) => item.numero === numero);
}

/**
 * Sexo y grupo de edad por persona. Los indicadores que usan edad describen corte
 * actual, por eso la edad se cumple a la fecha de consulta y no a la apertura del caso.
 *
 * @param {object[]} personas Filas con sexCode y birthDate de la réplica.
 * @param {string} fechaConsulta Fecha de corte AAAA-MM-DD.
 * @returns {Map} Demografía sin nombres.
 */
function EnsamblarDemografia(personas, fechaConsulta) {
  const mapa = new Map();
  const corte = FechaConsulta(fechaConsulta);
  for (const persona of personas) {
    if (!persona.personId) {
      continue;
    }
    const edad = AniosCumplidos(persona.birthDate, corte);
    mapa.set(persona.personId, {
      sexo: persona.sexCode || null,
      edad,
      grupoEdad: ClasificarGrupoEdad(edad)
    });
  }
  return mapa;
}

function Opciones(hechos) {
  const profesionales = new Set();
  for (const fila of hechos.individuales) {
    if (fila.profesional) {
      profesionales.add(fila.profesional);
    }
  }
  for (const fila of hechos.profesionalesGrupales) {
    if (fila.profesional) {
      profesionales.add(fila.profesional);
    }
  }
  return {
    profesionales: [...profesionales].sort((a, b) => a.localeCompare(b, 'es')),
    sexos: SEXOS_FILTRO.map((item) => ({ codigo: item.codigo, etiqueta: item.etiqueta })),
    gruposEdad: GRUPOS_EDAD.map((item) => ({ codigo: item.codigo, etiqueta: item.etiqueta }))
  };
}

function FechaVisible(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return '';
  }
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}

function ConPorcentaje(serie, denominador, tipo) {
  return serie.map((fila) => ({
    ...fila,
    denominador: denominador > 0 ? denominador : null,
    porcentaje: PorcentajeCategoria(fila.cantidad, denominador),
    tipoPorcentaje: denominador > 0 ? tipo : null
  }));
}

function Excluyente(contenido) {
  if (!contenido || !Array.isArray(contenido.serie)) {
    return contenido;
  }
  const total = contenido.serie.reduce((suma, fila) => suma + fila.cantidad, 0);
  return {
    ...contenido,
    serie: ConPorcentaje(contenido.serie, total, 'TOTAL')
  };
}

/**
 * Elige el grano territorial sin cambiar el conteo de casos.
 * Oficina y región de la sesión prevalecen sobre un filtro más amplio.
 *
 * @param {object} filtros Filtros y nivel ya autorizados.
 * @returns {string} REGION, OFICINA_LOCAL, ESTABLECIMIENTO o PROPIO.
 */
function NivelAgrupacion(filtros) {
  if (filtros.nivelAmbito === 'ESTABLECIMIENTO' || filtros.establecimientoId) {
    return 'PROPIO';
  }
  if (filtros.nivelAmbito === 'OFICINA_LOCAL' || filtros.oficinaLocalId) {
    return 'ESTABLECIMIENTO';
  }
  if (filtros.nivelAmbito === 'REGION' || filtros.regionId) {
    return 'OFICINA_LOCAL';
  }
  return 'REGION';
}

function NombreCatalogo(mapa, identificador, respaldo) {
  if (identificador === null || identificador === undefined) {
    return respaldo;
  }
  const nombre = mapa && mapa.get(identificador);
  return nombre || `${respaldo} ${identificador}`;
}

function DistribucionTerritorial(casos, filtros, nombres) {
  const nivel = NivelAgrupacion(filtros);
  if (nivel === 'PROPIO') {
    return { nivel, serie: [] };
  }
  const catalogo = filtros.catalogoTerritorial || {};
  const serie = new Map();
  for (const caso of casos) {
    if (nivel === 'REGION') {
      const id = caso.regionId;
      Contar(
        serie,
        id == null ? 'SIN_REGION' : String(id),
        NombreCatalogo(catalogo.regiones, id, 'Sin región')
      );
    } else if (nivel === 'OFICINA_LOCAL') {
      const id = caso.oficinaLocalId;
      Contar(
        serie,
        id == null ? 'SIN_OFICINA' : String(id),
        NombreCatalogo(catalogo.oficinas, id, 'Sin Oficina Local')
      );
    } else {
      Contar(
        serie,
        String(caso.establecimientoId),
        NombreEstablecimiento(caso.establecimientoId, nombres)
      );
    }
  }
  const ordenada = OrdenarSerie(serie);
  const total = ordenada.reduce((suma, fila) => suma + fila.cantidad, 0);
  return {
    nivel,
    serie: ConPorcentaje(ordenada, total, 'TOTAL').map((fila) => ({
      ...fila,
      identificador: fila.clave
    }))
  };
}

function VisualizacionTerritorial(casos, filtros, nombres, complementos) {
  const definicion = Definicion(1);
  const territorial = DistribucionTerritorial(casos, filtros, nombres);
  const titulos = {
    REGION: 'Casos por región',
    OFICINA_LOCAL: 'Casos por Oficina Local',
    ESTABLECIMIENTO: 'Casos por establecimiento',
    PROPIO: 'Casos del establecimiento'
  };
  const titulo = TituloDinamico(titulos[territorial.nivel], complementos);
  if (casos.length === 0) {
    return {
      ...Visualizacion(
        definicion,
        titulo,
        'SIN_INFORMACION',
        'No hay casos en este corte.',
        [],
        null,
        complementos
      ),
      agrupacion: territorial.nivel
    };
  }
  if (territorial.nivel === 'PROPIO') {
    const activos = casos.filter((caso) => caso.estado === 'ACTIVO').length;
    return {
      ...Visualizacion(definicion, titulo, 'CON_DATOS', null, [], null, complementos),
      formato: 'KPI_CANTIDAD',
      numerador: casos.length,
      activos,
      agrupacion: 'PROPIO',
      detalleKpi: filtros.estado === 'ACTIVO'
        ? 'Casos activos del establecimiento'
        : `Casos del filtro. Activos: ${activos}.`
    };
  }
  return {
    ...Visualizacion(
      definicion,
      titulo,
      'CON_DATOS',
      null,
      territorial.serie,
      null,
      complementos
    ),
    agrupacion: territorial.nivel
  };
}

/**
 * Cuenta casos en categorías fijas y agrega aparte los valores sin categoría y los ausentes.
 *
 * @param {object[]} casos Casos del corte.
 * @param {Map} demografia Datos por persona.
 * @param {object} definicion Campo, categorías, residual y mensaje.
 * @returns {object} Estado, serie y mensaje.
 */
function DistribucionDemografica(casos, demografia, definicion) {
  const conteo = new Map(definicion.categorias.map((item) => [item.codigo, 0]));
  let residual = 0;
  let sinDato = 0;
  for (const caso of casos) {
    const dato = DemografiaDe(demografia, caso.personaId);
    const valor = dato ? dato[definicion.campo] : null;
    if (!valor) {
      sinDato += 1;
    } else if (conteo.has(valor)) {
      conteo.set(valor, conteo.get(valor) + 1);
    } else {
      residual += 1;
    }
  }
  if (sinDato === casos.length) {
    return { estado: 'NO_DISPONIBLE', serie: [], mensaje: definicion.mensaje };
  }
  const serie = definicion.categorias
    .filter((item) => !definicion.seleccion || item.codigo === definicion.seleccion)
    .map((item) => ({
      clave: item.codigo,
      etiqueta: item.etiqueta,
      cantidad: conteo.get(item.codigo)
    }));
  if (residual > 0 && definicion.residual && !definicion.seleccion) {
    serie.push({
      clave: definicion.residual.codigo,
      etiqueta: definicion.residual.etiqueta,
      cantidad: residual
    });
  }
  if (sinDato > 0 && !definicion.seleccion) {
    serie.push({
      clave: definicion.sinDato.codigo,
      etiqueta: definicion.sinDato.etiqueta,
      cantidad: sinDato
    });
  }
  return { estado: 'CON_DATOS', serie, mensaje: null };
}

function DistribucionSexo(casos, demografia, filtros) {
  return DistribucionDemografica(casos, demografia, {
    campo: 'sexo',
    categorias: SEXOS_FILTRO,
    residual: SEXO_OTRO_VALOR,
    sinDato: SEXO_SIN_DATO,
    seleccion: filtros.sexo,
    mensaje: 'El sexo no está disponible para los casos de este corte.'
  });
}

function DistribucionEdad(casos, demografia, filtros) {
  return DistribucionDemografica(casos, demografia, {
    campo: 'grupoEdad',
    categorias: GRUPOS_EDAD,
    residual: null,
    sinDato: EDAD_SIN_DATO,
    seleccion: filtros.grupoEdad,
    mensaje: 'La edad no está disponible para los casos de este corte.'
  });
}

function DistribucionPrioridad(casos, filtros) {
  if (filtros.prioridad) {
    const etiqueta = EtiquetaPrioridad(filtros.prioridad);
    return [{
      clave: filtros.prioridad,
      etiqueta,
      cantidad: casos.filter((caso) => caso.prioridad === filtros.prioridad).length
    }];
  }
  return PRIORIDADES.map((item) => ({
    clave: item.codigo,
    etiqueta: item.etiqueta,
    cantidad: casos.filter((caso) => caso.prioridad === item.codigo).length
  }));
}

function DistribucionEstado(casos, filtros) {
  const base = filtros.estado === 'TODOS'
    ? ESTADOS_CASO
    : ESTADOS_CASO.filter((item) => item.codigo === filtros.estado);
  return base.map((item) => ({
    clave: item.codigo,
    etiqueta: item.etiqueta,
    cantidad: casos.filter((caso) => caso.estado === item.codigo).length
  }));
}

function ReferenciasDelCorte(hechos, filtros) {
  return hechos.referencias.filter((fila) => (
    !filtros.establecimientoId || fila.establecimientoId === filtros.establecimientoId
  ));
}

function ResumenReferencias(referencias) {
  const enviadas = referencias.length;
  const admitidas = referencias.filter((fila) => fila.estado === 'ADMITIDA_AI').length;
  const noRequiere = referencias.filter((fila) => fila.estado === 'NO_REQUIERE_AI').length;
  return {
    enviadas,
    analizadas: admitidas + noRequiere,
    admitidas,
    noRequiere,
    fecha: 'fecha de la referencia',
    nota: 'Una referencia analizada puede concluir admitida o no requiere '
      + 'Atención Interdisciplinaria. Esas cifras parten las analizadas '
      + 'y no se suman a las enviadas.'
  };
}

function MotivosReferencia(hechos, referencias) {
  const identificadores = new Set(referencias.map((fila) => fila.referenciaId));
  const porEtiqueta = new Map();
  for (const motivo of hechos.motivosReferencia) {
    if (!identificadores.has(motivo.referenciaId)) {
      continue;
    }
    const referenciasMotivo = porEtiqueta.get(motivo.etiqueta) || new Set();
    referenciasMotivo.add(motivo.referenciaId);
    porEtiqueta.set(motivo.etiqueta, referenciasMotivo);
  }
  const serie = [...porEtiqueta.entries()].map(([etiqueta, ids]) => ({
    clave: etiqueta,
    etiqueta,
    cantidad: ids.size
  }));
  serie.sort((a, b) => (
    b.cantidad - a.cantidad || a.etiqueta.localeCompare(b.etiqueta, 'es')
  ));
  return ConPorcentaje(serie, referencias.length, 'REFERENCIAS');
}

function Cancelaciones(hechos, filtros) {
  const serie = new Map();
  const vistas = new Set();
  for (const fila of hechos.cancelaciones) {
    if (filtros.establecimientoId && fila.establecimientoId !== filtros.establecimientoId) {
      continue;
    }
    if (vistas.has(fila.actividadId)) {
      continue;
    }
    vistas.add(fila.actividadId);
    const etiqueta = fila.motivo && fila.motivo.trim().length > 0
      ? fila.motivo.trim()
      : 'Sin motivo registrado';
    Contar(serie, etiqueta, etiqueta);
  }
  return ConPorcentaje(OrdenarSerie(serie), vistas.size, 'CANCELACIONES');
}

function Cierres(hechos, filtros) {
  return hechos.cierres.filter((fila) => (
    !filtros.establecimientoId || fila.establecimientoId === filtros.establecimientoId
  ));
}

function SerieCierres(cierres) {
  const conteo = new Map(cierres.map((fila) => [fila.codigo, 0]));
  for (const fila of cierres) {
    conteo.set(fila.codigo, (conteo.get(fila.codigo) || 0) + 1);
  }
  const oficiales = MOTIVOS_CIERRE.map((item) => ({
    clave: item.codigo,
    etiqueta: item.etiqueta,
    cantidad: conteo.get(item.codigo) || 0
  }));
  const extras = [];
  for (const [codigo, cantidad] of conteo) {
    if (!MOTIVOS_CIERRE.some((item) => item.codigo === codigo)) {
      const muestra = cierres.find((fila) => fila.codigo === codigo);
      extras.push({
        clave: codigo,
        etiqueta: muestra && muestra.etiqueta ? muestra.etiqueta : codigo,
        cantidad
      });
    }
  }
  return oficiales.concat(extras);
}

function SerieTipos(grupos, catalogo) {
  const serie = new Map();
  for (const grupo of grupos) {
    const clave = grupo.tipoId === null ? 'NO_DISPONIBLE' : String(grupo.tipoId);
    const etiqueta = grupo.tipoEtiqueta || 'Tipo no disponible';
    Contar(serie, clave, etiqueta);
  }
  for (const tipo of catalogo) {
    const clave = String(tipo.itemId);
    if (!serie.has(clave)) {
      serie.set(clave, { clave, etiqueta: tipo.etiqueta, cantidad: 0 });
    }
  }
  return OrdenarSerie(serie);
}

function PersonasUnicas(individuales, participantes, filtros, demografia) {
  const personas = new Set();
  for (const fila of individuales) {
    if (IndividualAplica(fila, filtros, demografia, true)) {
      personas.add(fila.personaId);
    }
  }
  for (const fila of participantes) {
    if (PersonaCumple(fila.personaId, filtros, demografia)) {
      personas.add(fila.personaId);
    }
  }
  return personas.size;
}

function FiltrosActivos(filtros, nombres) {
  const activos = [{ codigo: 'anio', etiqueta: `Año ${filtros.anio}` }];
  if (filtros.etiquetaRegion) {
    activos.push({ codigo: 'region', etiqueta: filtros.etiquetaRegion });
  }
  if (filtros.etiquetaOficina) {
    activos.push({ codigo: 'oficina', etiqueta: filtros.etiquetaOficina });
  }
  if (filtros.establecimientoId) {
    activos.push({
      codigo: 'establecimiento',
      etiqueta: NombreEstablecimiento(filtros.establecimientoId, nombres)
    });
  }
  if (filtros.estado !== 'TODOS') {
    activos.push({ codigo: 'estado', etiqueta: `Estado ${EtiquetaEstado(filtros.estado)}` });
  }
  if (filtros.prioridad) {
    activos.push({
      codigo: 'prioridad',
      etiqueta: `Prioridad ${EtiquetaPrioridad(filtros.prioridad)}`
    });
  }
  if (filtros.disciplinaId) {
    const disciplina = (filtros.catalogoDisciplinas || []).find((item) => (
      item.itemId === filtros.disciplinaId
    ));
    activos.push({
      codigo: 'disciplina',
      etiqueta: disciplina ? disciplina.etiqueta : 'Disciplina seleccionada'
    });
  }
  if (filtros.profesional) {
    activos.push({ codigo: 'profesional', etiqueta: `Profesional ${filtros.profesional}` });
  }
  if (filtros.sexo) {
    const etiqueta = EtiquetaSexoFiltro(filtros.sexo);
    activos.push({
      codigo: 'sexo',
      etiqueta: etiqueta ? `Sexo ${etiqueta}` : 'Sexo seleccionado'
    });
  }
  if (filtros.grupoEdad) {
    const etiqueta = EtiquetaGrupoEdad(filtros.grupoEdad);
    activos.push({
      codigo: 'grupoEdad',
      etiqueta: etiqueta ? `Edad ${etiqueta}` : 'Grupo de edad seleccionado'
    });
  }
  return activos;
}

function AlcanceFiltros() {
  return [
    {
      codigo: 'anio',
      aplicaA: [6, 7, 8, 9, 10, 11, 12],
      noAplicaA: [1, 2, 3, 4, 5],
      motivo: 'El año usa el evento de cada indicador. '
        + 'En los casos 1 a 5 el corte es la consulta actual.'
    },
    {
      codigo: 'establecimiento',
      aplicaA: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      noAplicaA: [],
      motivo: 'Restringe el ámbito ya autorizado. No elige otra Oficina Local.'
    },
    {
      codigo: 'estado',
      aplicaA: [1, 2, 3, 4, 5],
      noAplicaA: [6, 7, 8, 9, 10, 11, 12],
      motivo: 'No cambia la cobertura ni convierte los cierres en casos activos.'
    },
    {
      codigo: 'prioridad',
      aplicaA: [1, 2, 3, 4, 5],
      noAplicaA: [6, 7, 8, 9, 10, 11, 12],
      motivo: 'La prioridad vigente distribuye casos. No altera N ni D de la cobertura.'
    },
    {
      codigo: 'disciplina',
      aplicaA: [8],
      noAplicaA: [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12],
      motivo: 'Delimita atenciones. No se aplica solo al numerador de la cobertura.'
    },
    {
      codigo: 'profesional',
      aplicaA: [8],
      noAplicaA: [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12],
      motivo: 'Delimita atenciones cuando el usuario está registrado. '
        + 'No cambia la cobertura.'
    },
    {
      codigo: 'sexo',
      aplicaA: [1, 2, 3, 4, 5, 11, 12],
      noAplicaA: [6, 7, 8, 9, 10],
      motivo: 'Delimita casos y la cobertura. No filtra motivos ni el tipo de atención.'
    },
    {
      codigo: 'edad',
      aplicaA: [1, 2, 3, 4, 5, 11, 12],
      noAplicaA: [6, 7, 8, 9, 10],
      motivo: 'Usa la edad cumplida al corte. No inventa un grupo etario.'
    }
  ];
}

/**
 * Construye el corte analítico de Oficina Local.
 * Los hechos ya vienen limitados por la oficina y la región de la sesión.
 *
 * @param {object} hechos Lecturas normalizadas.
 * @param {object} filtros Filtros ya validados.
 * @param {Map} demografia Sexo y edad por persona, o null si la réplica falló.
 * @param {Map} nombres Nombres de establecimiento.
 * @returns {object} Catálogo, complementos y cobertura.
 */
function EnsamblarCorte(hechos, filtros, demografia, nombres) {
  if ((filtros.sexo || filtros.grupoEdad) && !(demografia instanceof Map)) {
    const error = new Error('La demografía no está disponible.');
    error.code = 'DEMOGRAFIA';
    throw error;
  }
  const demografiaDisponible = demografia instanceof Map;
  const mapa = demografiaDisponible ? demografia : new Map();
  const casos = CasosDeDistribucion(hechos, filtros, mapa);
  const activos = CasosActivosCobertura(hechos, filtros, mapa);
  const individualesAtencion = hechos.individuales.filter((fila) => (
    IndividualAplica(fila, filtros, mapa, false)
  ));
  const grupos = GruposAplican(hechos, filtros);
  const participantes = ParticipantesEfectivos(hechos, grupos);
  const individualesCobertura = hechos.individuales.filter((fila) => (
    !filtros.establecimientoId || fila.establecimientoId === filtros.establecimientoId
  ));
  const gruposCobertura = GruposAplican(hechos, {
    ...filtros,
    disciplinaId: null,
    profesional: null
  });
  const participantesCobertura = ParticipantesEfectivos(hechos, gruposCobertura);
  const personasDenominador = new Set(activos.map((caso) => caso.personaId));
  let numerador = 0;
  for (const personaId of personasDenominador) {
    const casosPersona = activos.filter((caso) => caso.personaId === personaId);
    const atendida = casosPersona.some((caso) => CasoAtendido(
      caso.casoId,
      individualesCobertura,
      participantesCobertura
    ));
    if (atendida) {
      numerador += 1;
    }
  }
  const denominador = personasDenominador.size;
  const porcentaje = PorcentajeCobertura(numerador, denominador);
  const cobertura = {
    texto: TEXTO_COBERTURA,
    ratificacion: 'NEEDS_VALIDATION',
    denominador,
    numerador,
    porcentaje,
    estado: denominador === 0 ? 'SIN_CASOS_ACTIVOS' : 'CALCULADO',
    mensaje: denominador === 0
      ? 'Sin casos activos. No aplica.'
      : null,
    anio: filtros.anio,
    fechaConsulta: filtros.fechaConsulta
  };
  const referencias = ReferenciasDelCorte(hechos, filtros);
  const motivos = MotivosReferencia(hechos, referencias);
  const canceladas = Cancelaciones(hechos, filtros);
  const cierres = Cierres(hechos, filtros);
  const palabras = ContarPalabras(
    cierres
      .filter((fila) => fila.requiereTexto && fila.explicacion)
      .map((fila) => fila.explicacion)
  );
  const tipos = grupos.length === 0 ? [] : SerieTipos(grupos, hechos.catalogoTipos || []);
  const individualesFueraDeTipo = individualesAtencion.length;
  const ultimas = new Map(hechos.ultimasAtenciones.map((fila) => [fila.casoId, fila.fecha]));
  const sinAtencion = [];
  for (const caso of activos) {
    if (CasoAtendido(caso.casoId, individualesCobertura, participantesCobertura)) {
      continue;
    }
    const ultima = ultimas.get(caso.casoId) || null;
    sinAtencion.push({
      casoId: caso.casoId,
      establecimiento: NombreEstablecimiento(caso.establecimientoId, nombres),
      ultimaAtencion: ultima,
      situacion: ultima ? 'Atendido fuera del período' : 'Sin atención registrada'
    });
  }
  sinAtencion.sort((a, b) => a.casoId - b.casoId);
  const partesCaso = ComplementosCaso(filtros, nombres);
  const partesAtencion = ComplementosAtencion(filtros, nombres);
  const partesCierre = [];
  if (filtros.establecimientoId) {
    partesCierre.push(NombreEstablecimiento(filtros.establecimientoId, nombres));
  }
  const visualizaciones = [
    VisualizacionTerritorial(casos, filtros, nombres, partesCaso),
    VisualizacionPersona(2, casos, demografiaDisponible, () => (
      Excluyente(DistribucionSexo(casos, mapa, filtros))
    ), partesCaso),
    VisualizacionPersona(3, casos, demografiaDisponible, () => (
      Excluyente(DistribucionEdad(casos, mapa, filtros))
    ), partesCaso),
    VisualizacionCasos(4, casos, () => Excluyente({
      estado: 'CON_DATOS',
      serie: DistribucionPrioridad(casos, filtros),
      mensaje: null
    }), partesCaso),
    VisualizacionCasos(5, casos, () => Excluyente({
      estado: 'CON_DATOS',
      serie: DistribucionEstado(casos, filtros),
      mensaje: null
    }), partesCaso),
    VisualizacionFrecuencia(6, canceladas, '', (
      'La tabla muestra los principales. La descarga incluye la frecuencia completa.'
    )),
    VisualizacionFrecuencia(7, motivos, '', (
      'El porcentaje usa las referencias distintas del período como denominador. '
      + 'Una referencia puede tener varios motivos, así que los porcentajes '
      + 'pueden sumar más de 100.'
    )),
    VisualizacionTipos(tipos, individualesFueraDeTipo, partesAtencion),
    VisualizacionCierres(cierres, partesCierre),
    VisualizacionPalabras(palabras, partesCierre),
    VisualizacionCobertura(11, cobertura, partesCobertura(filtros, nombres)),
    VisualizacionCobertura(12, cobertura, partesCobertura(filtros, nombres))
  ].map((vista) => AjustarPresentacion(vista, filtros));
  const tiposAjustados = visualizaciones.find((vista) => vista.numero === 8);
  if (tiposAjustados && tiposAjustados.serie.length > 0) {
    const totalTipos = tiposAjustados.serie.reduce((suma, fila) => suma + fila.cantidad, 0);
    tiposAjustados.serie = ConPorcentaje(tiposAjustados.serie, totalTipos, 'TOTAL');
  }
  const cierresVista = visualizaciones.find((vista) => vista.numero === 9);
  if (cierresVista && cierresVista.serie.length > 0) {
    cierresVista.serie = ConPorcentaje(cierresVista.serie, cierres.length, 'TOTAL');
  }
  return {
    fechaConsulta: filtros.fechaConsulta,
    anio: filtros.anio,
    etiquetaAmbito: filtros.etiquetaAmbito || 'Oficina Local',
    oficinaLocalId: filtros.oficinaLocalId,
    regionId: filtros.regionId,
    filtrosActivos: FiltrosActivos(filtros, nombres),
    alcanceFiltros: AlcanceFiltros(),
    cobertura,
    referencias: ResumenReferencias(referencias),
    personasUnicas: PersonasUnicas(
      hechos.individuales,
      participantes,
      filtros,
      mapa
    ),
    totalAtenciones: individualesAtencion.length + grupos.length,
    atencionesIndividuales: individualesAtencion.length,
    atencionesGrupales: grupos.length,
    casosSinAtencion: {
      total: sinAtencion.length,
      muestra: sinAtencion.slice(0, MUESTRA_CASOS),
      filas: sinAtencion,
      estado: activos.length === 0 ? 'SIN_CASOS_ACTIVOS' : 'CON_DATOS'
    },
    visualizaciones,
    opciones: Opciones(hechos, mapa),
    catalogoDisciplinas: hechos.catalogoDisciplinas || [],
    establecimientos: [...nombres.entries()]
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es'))
  };
}

function partesCobertura(filtros, nombres) {
  const partes = [];
  if (filtros.establecimientoId) {
    partes.push(NombreEstablecimiento(filtros.establecimientoId, nombres));
  }
  if (filtros.sexo) {
    partes.push(`sexo ${EtiquetaSexoFiltro(filtros.sexo) || 'seleccionado'}`);
  }
  if (filtros.grupoEdad) {
    partes.push(`edad ${EtiquetaGrupoEdad(filtros.grupoEdad) || 'grupo seleccionado'}`);
  }
  return partes;
}

function VisualizacionCasos(numero, casos, construir, complementos) {
  const definicion = Definicion(numero);
  const contenido = casos.length === 0
    ? { estado: 'SIN_INFORMACION', serie: [], mensaje: 'No hay casos en este corte.' }
    : construir();
  return Visualizacion(
    definicion,
    TituloDinamico(definicion.titulo, complementos),
    contenido.estado,
    contenido.mensaje,
    contenido.serie,
    null,
    complementos
  );
}

function VisualizacionPersona(numero, casos, disponible, construir, complementos) {
  const definicion = Definicion(numero);
  if (!disponible) {
    return Visualizacion(
      definicion,
      TituloDinamico(definicion.titulo, complementos),
      'NO_DISPONIBLE',
      'No fue posible leer sexo o edad. No se sustituye por cero.',
      [],
      null,
      complementos
    );
  }
  return VisualizacionCasos(numero, casos, construir, complementos);
}

function VisualizacionFrecuencia(numero, serie, complemento, nota) {
  const definicion = Definicion(numero);
  if (serie.length === 0) {
    return Visualizacion(
      definicion,
      TituloDinamico(definicion.titulo, [complemento]),
      'SIN_INFORMACION',
      'No hay registros en el año seleccionado.',
      [],
      nota,
      [complemento]
    );
  }
  return {
    ...Visualizacion(
      definicion,
      TituloDinamico(definicion.titulo, [complemento]),
      'CON_DATOS',
      null,
      serie.slice(0, PRESENTACION_TOP),
      nota,
      [complemento]
    ),
    frecuenciaCompleta: serie
  };
}

function VisualizacionTipos(serie, individuales, complementos) {
  const definicion = Definicion(8);
  const nota = individuales > 0
    ? `Hay ${individuales} atenciones individuales sin tipo institucional TIPO_ATENCION. `
      + 'No entran en esta distribución ni se asignan a un tipo inventado.'
    : 'Una atención grupal cuenta una vez, aunque tenga varias personas.';
  if (serie.length === 0) {
    return Visualizacion(
      definicion,
      TituloDinamico(definicion.titulo, complementos),
      individuales > 0 ? 'NO_DISPONIBLE' : 'SIN_INFORMACION',
      individuales > 0
        ? nota
        : 'No hay atenciones grupales clasificadas por tipo en el año seleccionado.',
      [],
      nota,
      complementos
    );
  }
  return Visualizacion(
    definicion,
    TituloDinamico(definicion.titulo, complementos),
    'CON_DATOS',
    null,
    serie,
    nota,
    complementos
  );
}

function VisualizacionCierres(cierres, complementos) {
  const definicion = Definicion(9);
  if (cierres.length === 0) {
    return Visualizacion(
      definicion,
      TituloDinamico(definicion.titulo, complementos),
      'SIN_INFORMACION',
      'No hay cierres en el año seleccionado.',
      [],
      'Traslado no equivale a cierre satisfactorio.',
      complementos
    );
  }
  return Visualizacion(
    definicion,
    TituloDinamico(definicion.titulo, complementos),
    'CON_DATOS',
    null,
    SerieCierres(cierres),
    'Traslado no equivale a cierre satisfactorio.',
    complementos
  );
}

function VisualizacionPalabras(palabras, complementos) {
  const definicion = Definicion(10);
  if (palabras.length === 0) {
    return Visualizacion(
      definicion,
      TituloDinamico(definicion.titulo, complementos),
      'SIN_INFORMACION',
      'No hay explicaciones de cierre Otro en el año seleccionado.',
      [],
      null,
      complementos
    );
  }
  return {
    ...Visualizacion(
      definicion,
      TituloDinamico(definicion.titulo, complementos),
      'CON_DATOS',
      null,
      palabras.slice(0, PRESENTACION_TOP),
      'La nube muestra las palabras más frecuentes. La descarga incluye la frecuencia completa.',
      complementos
    ),
    frecuenciaCompleta: palabras
  };
}

function VisualizacionCobertura(numero, cobertura, complementos) {
  const definicion = Definicion(numero);
  const estado = cobertura.estado === 'SIN_CASOS_ACTIVOS' ? 'SIN_CASOS_ACTIVOS' : 'CON_DATOS';
  return {
    ...Visualizacion(
      definicion,
      TituloDinamico(definicion.titulo, complementos),
      estado,
      cobertura.mensaje,
      [],
      TEXTO_COBERTURA,
      complementos
    ),
    numerador: cobertura.numerador,
    denominador: cobertura.denominador,
    porcentaje: cobertura.porcentaje
  };
}

function AjustarPresentacion(vista, filtros) {
  const definicion = Definicion(vista.numero);
  const vigente = ReferenciaTemporal(vista.numero) === 'ESTADO_VIGENTE';
  const notaLarga = [definicion ? definicion.fecha : '', vista.nota]
    .filter((parte) => parte)
    .join(' ');
  let advertencia = null;
  if (vista.numero === 9 && vista.estado === 'CON_DATOS') {
    advertencia = 'Traslado no se suma a cierre satisfactorio.';
  }
  if (vista.numero === 8 && notaLarga.includes('sin tipo institucional')) {
    advertencia = 'Hay atenciones individuales sin tipo institucional. '
      + 'No entran en este gráfico.';
  }
  if (vista.numero === 11 || vista.numero === 12) {
    advertencia = 'El año limita la atención. Activo es el estado actual.';
  }
  return {
    ...vista,
    nota: notaLarga,
    notaMetodologica: notaLarga,
    advertencia,
    periodoEtiqueta: vigente
      ? `Estado al ${FechaVisible(filtros.fechaConsulta)}`
      : `Período: ${filtros.anio}`
  };
}

const ETIQUETAS_MES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

function KpiCantidadSimple(numero, codigo, titulo, cantidad, anio, detalle) {
  return {
    numero,
    codigo,
    titulo,
    formato: 'KPI_CANTIDAD',
    periodoEtiqueta: `Período: ${anio}`,
    estado: 'CON_DATOS',
    mensaje: null,
    serie: [],
    nota: null,
    notaMetodologica: detalle,
    advertencia: null,
    filtrosAplicados: [`año ${anio}`],
    numerador: cantidad,
    detalleKpi: detalle,
    autorizada: true
  };
}

function EvolucionReferencias(referencias, anio) {
  const meses = ETIQUETAS_MES.map((etiqueta, indice) => ({
    clave: `${anio}-${String(indice + 1).padStart(2, '0')}`,
    etiqueta,
    cantidad: 0
  }));
  let conFecha = 0;
  for (const fila of referencias) {
    const fecha = fila.fecha ? String(fila.fecha) : '';
    if (!fecha.startsWith(`${anio}-`)) {
      continue;
    }
    const mes = Number(fecha.slice(5, 7));
    if (mes >= 1 && mes <= 12) {
      meses[mes - 1].cantidad += 1;
      conFecha += 1;
    }
  }
  if (conFecha === 0) {
    return [];
  }
  const total = meses.reduce((suma, fila) => suma + fila.cantidad, 0);
  return ConPorcentaje(meses, total, 'TOTAL');
}

function VistaVacia(numero, codigo, titulo, estado, mensaje, anio) {
  return {
    numero,
    codigo,
    titulo,
    formato: numero === 5 ? 'KPI_CANTIDAD' : 'BARRAS',
    periodoEtiqueta: `Período: ${anio}`,
    estado,
    mensaje,
    serie: [],
    nota: null,
    notaMetodologica: null,
    advertencia: null,
    filtrosAplicados: [`año ${anio}`],
    numerador: null,
    autorizada: estado !== 'NO_DISPONIBLE'
  };
}

/**
 * Indicadores de referencia del propio establecimiento.
 * No incluye casos ni atenciones de otros ámbitos.
 *
 * @param {object} hechos Hechos ya limitados a los establecimientos autorizados.
 * @param {object} filtros Año y fecha de consulta.
 * @param {Map} nombres Nombres de establecimiento.
 * @param {number|null} posibles Pendientes, o null si la consulta no está disponible.
 * @returns {object} Corte reducido.
 */
function EnsamblarCorteEstablecimiento(hechos, filtros, nombres, posibles) {
  const referencias = ReferenciasDelCorte(hechos, filtros);
  const resumen = ResumenReferencias(referencias);
  const pendientes = referencias.filter((fila) => (
    fila.estado === 'PENDIENTE_REVISION'
  )).length;
  const motivos = MotivosReferencia(hechos, referencias);
  const evolucion = EvolucionReferencias(referencias, filtros.anio);
  const anio = filtros.anio;
  const visualizaciones = [
    KpiCantidadSimple(
      1, 'REF_ENVIADAS', 'Referencias enviadas', resumen.enviadas, anio,
      'Referencias con fecha de referencia en el año.'
    ),
    KpiCantidadSimple(
      2, 'REF_PENDIENTES', 'Referencias pendientes de revisión', pendientes, anio,
      'Pendientes de revisión entre las referencias del año.'
    ),
    KpiCantidadSimple(
      3, 'REF_ADMITIDAS', 'Referencias admitidas', resumen.admitidas, anio,
      'Resultado Admitida a A.I. No se suma a las enviadas.'
    ),
    KpiCantidadSimple(
      4, 'REF_NO_REQUIERE', 'Referencias con resultado No requiere A.I.',
      resumen.noRequiere, anio, 'Resultado No requiere A.I. No abre un caso.'
    ),
    posibles == null
      ? VistaVacia(
        5, 'POSIBLES', 'Posibles referencias del establecimiento',
        'NO_DISPONIBLE',
        'Las posibles referencias no están disponibles en esta consulta.',
        anio
      )
      : KpiCantidadSimple(
        5, 'POSIBLES', 'Posibles referencias pendientes', posibles, anio,
        'Sugerencias pendientes. No son referencias enviadas.'
      ),
    motivos.length === 0
      ? VistaVacia(
        6, 'MOTIVOS_REFERENCIA', 'Motivos de referencia',
        'SIN_INFORMACION', 'No hay motivos de referencia en el año seleccionado.',
        anio
      )
      : {
        numero: 6,
        codigo: 'MOTIVOS_REFERENCIA',
        titulo: 'Motivos de referencia',
        formato: 'BARRAS',
        periodoEtiqueta: `Período: ${anio}`,
        estado: 'CON_DATOS',
        mensaje: null,
        serie: motivos.slice(0, PRESENTACION_TOP),
        frecuenciaCompleta: motivos,
        nota: null,
        notaMetodologica: 'El porcentaje usa las referencias distintas del año. '
          + 'Una referencia puede tener varios motivos.',
        advertencia: null,
        filtrosAplicados: [`año ${anio}`],
        autorizada: true
      },
    evolucion.length === 0
      ? VistaVacia(
        7, 'REF_EVOLUCION', 'Referencias por mes',
        'SIN_INFORMACION',
        'No hay fechas de referencia para mostrar la evolución.',
        anio
      )
      : {
        numero: 7,
        codigo: 'REF_EVOLUCION',
        titulo: 'Referencias por mes',
        formato: 'DISTRIBUCION',
        periodoEtiqueta: `Período: ${anio}`,
        estado: 'CON_DATOS',
        mensaje: null,
        serie: evolucion,
        nota: null,
        notaMetodologica: 'Mes de la fecha de referencia.',
        advertencia: null,
        filtrosAplicados: [`año ${anio}`],
        autorizada: true
      }
  ];
  return {
    modo: 'ESTABLECIMIENTO',
    fechaConsulta: filtros.fechaConsulta,
    anio: filtros.anio,
    etiquetaAmbito: 'Establecimiento',
    oficinaLocalId: null,
    regionId: null,
    filtrosActivos: FiltrosActivos(filtros, nombres),
    alcanceFiltros: [],
    cobertura: {
      texto: '',
      estado: 'NO_APLICA',
      numerador: null,
      denominador: null,
      porcentaje: null,
      mensaje: null
    },
    referencias: resumen,
    personasUnicas: null,
    totalAtenciones: null,
    atencionesIndividuales: null,
    atencionesGrupales: null,
    casosSinAtencion: { total: 0, muestra: [], estado: 'NO_APLICA' },
    visualizaciones,
    opciones: { profesionales: [], sexos: [], gruposEdad: [] },
    catalogoDisciplinas: [],
    establecimientos: [...nombres.entries()]
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es'))
  };
}

module.exports = {
  EnsamblarCorte,
  EnsamblarCorteEstablecimiento,
  EnsamblarDemografia
};

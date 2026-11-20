/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-14.
 * Modificación: 2026-11-18. El expediente abierto sustituye al listado.
 * Modificación: 2026-11-19. El inicio puede abrir la lista en Activo.
 * Modificación: 2026-11-18. Título común de casos con consulta
 * superior distinguida en el texto, no en otro nombre.
 * Modificación: 2026-11-17. Nivel de riesgo, título de casos,
 * contexto y nombres de filtros.
 * Modificación: 2026-11-16. Paginación, exportación, línea de tiempo,
 * ciclo del caso, apertura directa, clave única y consulta Regional y Nacional.
 * HU-023, HU-024, HU-025 y HU-032 a HU-035.
 * El establecimiento no recibe el detalle interno.
 */
import { useEffect, useState } from 'react';
import { Aviso, Cargando, Campo, ClasePrioridad, ResumenResultados, Vacio } from '../../componentes/interfaz';
import ExpedienteConsulta from './ExpedienteConsulta';
import ExpedienteOperativo from './ExpedienteOperativo';
import { DescargarArchivo, SolicitarApi } from '../../servicios/cliente-api';

const CONSULTA_VACIA = {
  identificacion: '',
  nombre: '',
  estado: '',
  prioridad: '',
  establecimientoId: '',
  regionId: '',
  localOfficeId: ''
};

function EsConsultaSuperior(contexto) {
  return Boolean(contexto && (contexto.puedeVerCasosRegion || contexto.puedeVerCasosNacional));
}

function TituloCasos(contexto) {
  if (
    contexto.puedeVerCasosOficina
    || contexto.puedeVerCasosRegion
    || contexto.puedeVerCasosNacional
  ) {
    return 'Casos de Atención Interdisciplinaria';
  }
  return 'Lista de Atención Interdisciplinaria';
}

function ParametrosConsulta(aplicada, numeroPagina) {
  const parametros = new URLSearchParams();
  if (aplicada.identificacion) {
    parametros.set('identificacion', aplicada.identificacion);
  }
  if (aplicada.nombre) {
    parametros.set('nombre', aplicada.nombre);
  }
  if (aplicada.estado) {
    parametros.set('estado', aplicada.estado);
  }
  if (aplicada.prioridad) {
    parametros.set('prioridad', aplicada.prioridad);
  }
  if (aplicada.establecimientoId) {
    parametros.set('establecimientoId', aplicada.establecimientoId);
  }
  if (aplicada.regionId) {
    parametros.set('regionId', aplicada.regionId);
  }
  if (aplicada.localOfficeId) {
    parametros.set('localOfficeId', aplicada.localOfficeId);
  }
  if (numeroPagina) {
    parametros.set('pagina', String(numeroPagina));
  }
  return parametros;
}

function ConsultaInicial(parametros) {
  const identificacion = parametros && typeof parametros.identificacion === 'string'
    ? parametros.identificacion
    : '';
  const estados = ['ACTIVO', 'CERRADO'];
  const estado = parametros && estados.includes(parametros.estado) ? parametros.estado : '';
  return { ...CONSULTA_VACIA, identificacion, estado };
}

export default function CasosPagina({
  direccionApi,
  identidad,
  contexto,
  navegar,
  parametros = {},
  solicitarApi = SolicitarApi
}) {
  const inicial = ConsultaInicial(parametros);
  const [consulta, establecerConsulta] = useState(inicial);
  const [aplicada, establecerAplicada] = useState(inicial);
  const [pagina, establecerPagina] = useState(null);
  const [numeroPagina, establecerNumeroPagina] = useState(1);
  const [detalle, establecerDetalle] = useState(null);
  const [opciones, establecerOpciones] = useState(null);
  const [error, establecerError] = useState('');
  const [cargando, establecerCargando] = useState(true);
  const superior = EsConsultaSuperior(contexto);
  const puedeDetalle = Boolean(
    contexto && (contexto.puedeVerDetalleCaso || contexto.puedeVerDetalleConsulta)
  );

  useEffect(() => {
    if (!superior) {
      return undefined;
    }
    let vigente = true;
    const filtros = new URLSearchParams();
    if (consulta.regionId) {
      filtros.set('regionId', consulta.regionId);
    }
    if (consulta.localOfficeId) {
      filtros.set('localOfficeId', consulta.localOfficeId);
    }
    solicitarApi(
      direccionApi,
      `/api/institutional/territory/options?${filtros.toString()}`,
      { identidad }
    )
      .then((datos) => {
        if (vigente) {
          establecerOpciones(datos);
        }
      })
      .catch((fallo) => {
        if (vigente) {
          establecerError(fallo.message);
        }
      });
    return () => {
      vigente = false;
    };
  }, [consulta.localOfficeId, consulta.regionId, direccionApi, identidad, solicitarApi, superior]);

  useEffect(() => {
    let vigente = true;
    const parametros = ParametrosConsulta(aplicada, numeroPagina);
    solicitarApi(direccionApi, `/api/proceso/casos?${parametros.toString()}`, { identidad })
      .then((datos) => {
        if (vigente) {
          establecerPagina(datos);
          establecerCargando(false);
        }
      })
      .catch((fallo) => {
        if (vigente) {
          establecerError(fallo.message);
          establecerCargando(false);
        }
      });
    return () => {
      vigente = false;
    };
  }, [direccionApi, identidad, aplicada, numeroPagina, solicitarApi]);

  useEffect(() => {
    const casoId = Number(parametros.casoId);
    if (!Number.isInteger(casoId) || casoId <= 0 || !puedeDetalle) {
      return undefined;
    }
    let vigente = true;
    solicitarApi(direccionApi, `/api/proceso/casos/${casoId}`, { identidad })
      .then((datos) => {
        if (vigente) {
          establecerDetalle(datos);
        }
      })
      .catch((fallo) => {
        if (vigente) {
          establecerError(fallo.message);
        }
      });
    return () => {
      vigente = false;
    };
  }, [direccionApi, identidad, parametros.casoId, puedeDetalle, solicitarApi]);

  async function VerDetalle(casoId) {
    establecerError('');
    try {
      establecerDetalle(await solicitarApi(direccionApi, `/api/proceso/casos/${casoId}`, { identidad }));
    } catch (fallo) {
      establecerError(fallo.message);
    }
  }

  function Restablecer() {
    establecerError('');
    establecerDetalle(null);
    establecerConsulta(CONSULTA_VACIA);
    establecerCargando(true);
    establecerNumeroPagina(1);
    establecerAplicada(CONSULTA_VACIA);
  }

  async function Exportar() {
    establecerError('');
    const parametros = ParametrosConsulta(aplicada);
    try {
      const archivo = await solicitarApi(
        direccionApi,
        `/api/proceso/casos/exportacion?${parametros.toString()}`,
        { identidad, archivo: true }
      );
      DescargarArchivo(archivo.blob, archivo.nombre);
    } catch (fallo) {
      establecerError(fallo.message);
    }
  }

  if (detalle && contexto.puedeVerDetalleCaso) {
    return (
      <ExpedienteOperativo
        detalle={detalle}
        direccionApi={direccionApi}
        identidad={identidad}
        contexto={contexto}
        solicitarApi={solicitarApi}
        alCerrar={() => establecerDetalle(null)}
        alActualizar={() => VerDetalle(detalle.casoId)}
      />
    );
  }
  if (detalle && contexto.puedeVerDetalleConsulta && !contexto.puedeVerDetalleCaso) {
    return (
      <ExpedienteConsulta
        detalle={detalle}
        alCerrar={() => establecerDetalle(null)}
      />
    );
  }

  return (
    <>
      <p className="contexto">Gestión del caso</p>
      <h1>{TituloCasos(contexto)}</h1>
      <p className="introduccion">
        {superior
          ? 'Consulte los casos de su ámbito. Esta vista no modifica la información.'
          : 'Busque un caso, revise su situación y continúe la atención.'}
      </p>
      {contexto && contexto.puedeConsultarSeguimiento && navegar ? (
        <button type="button" className="secundario" onClick={() => navegar('seguimiento')}>
          Casos sin atención
        </button>
      ) : null}
      <form onSubmit={(evento) => {
        evento.preventDefault();
        establecerCargando(true);
        establecerNumeroPagina(1);
        establecerAplicada(consulta);
      }}>
        <Campo id="caso-identificacion" etiqueta="Identificación">
          <input id="caso-identificacion" value={consulta.identificacion} onChange={(evento) => establecerConsulta({ ...consulta, identificacion: evento.target.value, nombre: '' })} />
        </Campo>
        <Campo id="caso-nombre" etiqueta="Nombre">
          <input id="caso-nombre" value={consulta.nombre} onChange={(evento) => establecerConsulta({ ...consulta, nombre: evento.target.value, identificacion: '' })} />
        </Campo>
        <Campo id="caso-estado" etiqueta="Estado del caso">
          <select id="caso-estado" value={consulta.estado} onChange={(evento) => establecerConsulta({ ...consulta, estado: evento.target.value })}>
            <option value="">Todos</option>
            <option value="ACTIVO">Activo</option>
            <option value="CERRADO">Cerrado</option>
          </select>
        </Campo>
        <Campo id="caso-prioridad" etiqueta="Prioridad del caso">
          <select id="caso-prioridad" value={consulta.prioridad} onChange={(evento) => establecerConsulta({ ...consulta, prioridad: evento.target.value })}>
            <option value="">Todas</option>
            <option value="ALTO">Alto</option>
            <option value="MODERADO">Moderado</option>
            <option value="BAJO">Bajo</option>
          </select>
        </Campo>
        {superior && contexto.puedeVerCasosNacional ? (
          <Campo id="caso-region" etiqueta="Región">
            <select
              id="caso-region"
              value={consulta.regionId}
              onChange={(evento) => establecerConsulta({
                ...consulta,
                regionId: evento.target.value,
                localOfficeId: '',
                establecimientoId: ''
              })}
            >
              <option value="">Todas</option>
              {(opciones && opciones.filters.region.options || []).map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </Campo>
        ) : null}
        {superior && contexto.puedeVerCasosRegion && opciones ? (
          <p>
            Región:{' '}
            {(opciones.filters.region.options[0] && opciones.filters.region.options[0].name)
              || 'la región de la sesión'}
          </p>
        ) : null}
        {superior ? (
          <Campo id="caso-oficina" etiqueta="Oficina Local">
            <select
              id="caso-oficina"
              value={consulta.localOfficeId}
              disabled={Boolean(opciones && opciones.filters.localOffice.requiresParent)}
              onChange={(evento) => establecerConsulta({
                ...consulta,
                localOfficeId: evento.target.value,
                establecimientoId: ''
              })}
            >
              <option value="">
                {opciones && opciones.filters.localOffice.requiresParent
                  ? 'Seleccione primero una región'
                  : 'Todas'}
              </option>
              {(opciones && opciones.filters.localOffice.options || []).map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </Campo>
        ) : null}
        {superior ? (
          <Campo id="caso-establecimiento" etiqueta="Establecimiento">
            <select
              id="caso-establecimiento"
              value={consulta.establecimientoId}
              disabled={Boolean(opciones && opciones.filters.establishment.requiresParent)}
              onChange={(evento) => establecerConsulta({
                ...consulta,
                establecimientoId: evento.target.value
              })}
            >
              <option value="">
                {opciones && opciones.filters.establishment.requiresParent
                  ? 'Seleccione primero una Oficina Local'
                  : 'Todos'}
              </option>
              {(opciones && opciones.filters.establishment.options || []).map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </Campo>
        ) : (
          <Campo id="caso-establecimiento" etiqueta="Establecimiento, si corresponde filtrarlo">
            <input
              id="caso-establecimiento"
              value={consulta.establecimientoId}
              onChange={(evento) => establecerConsulta({
                ...consulta,
                establecimientoId: evento.target.value
              })}
            />
          </Campo>
        )}
        <button type="submit">Aplicar filtros</button>
        <button type="button" className="secundario" onClick={Restablecer}>Restablecer filtros</button>
      </form>
      {error ? <Aviso>{error}</Aviso> : null}
      {cargando ? <Cargando /> : null}
      {pagina ? (
        <ResumenResultados
          filtrados={pagina.total}
          totalAmbito={pagina.totalAmbito}
          pagina={numeroPagina}
          tamano={pagina.consulta && pagina.consulta.tamano}
          hayFiltros={Boolean(
            aplicada.estado || aplicada.prioridad || aplicada.identificacion
            || aplicada.nombre || aplicada.establecimientoId
            || aplicada.regionId || aplicada.localOfficeId
          )}
        />
      ) : null}
      {pagina && pagina.items.length === 0 ? <Vacio texto="No hay casos que coincidan con el criterio." /> : null}
      {pagina && pagina.items.length > 0 ? (
        <div className="tabla-contenedor">
          <table>
            <caption>Casos del ámbito autorizado</caption>
            <thead>
              <tr>
                <th>Persona</th>
                <th>Identificación</th>
                <th>Establecimiento</th>
                <th>Estado</th>
                <th>Prioridad</th>
                <th>Apertura</th>
                <th>Cierre</th>
                {superior ? <th>Oficina Local</th> : null}
                {superior ? <th>Región</th> : null}
                {puedeDetalle ? <th>Acción</th> : null}
              </tr>
            </thead>
            <tbody>
              {pagina.items.map((item) => (
                <tr key={item.casoId}>
                  <td>{item.nombre || 'Nombre no disponible'}</td>
                  <td>{item.identificacion}</td>
                  <td>{item.establecimientoId}</td>
                  <td>{item.estado}</td>
                  <td className={ClasePrioridad(item.prioridadCodigo)}>{item.prioridadEtiqueta}</td>
                  <td>{item.fechaApertura}</td>
                  <td>{item.fechaCierre || ''}</td>
                  {superior ? <td>{item.oficinaLocalId}</td> : null}
                  {superior ? <td>{item.regionId}</td> : null}
                  {puedeDetalle ? (
                    <td>
                      <button type="button" className="secundario" onClick={() => VerDetalle(item.casoId)}>
                        Ver expediente
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {pagina && pagina.total > pagina.devueltos ? (
        <div className="acciones">
          <button
            type="button"
            className="secundario"
            disabled={numeroPagina <= 1}
            onClick={() => {
              establecerCargando(true);
              establecerNumeroPagina(numeroPagina - 1);
            }}
          >
            Página anterior
          </button>
          <button
            type="button"
            className="secundario"
            disabled={numeroPagina * (pagina.consulta?.tamano || pagina.devueltos) >= pagina.total}
            onClick={() => {
              establecerCargando(true);
              establecerNumeroPagina(numeroPagina + 1);
            }}
          >
            Página siguiente
          </button>
        </div>
      ) : null}
      {contexto.puedeExportarCasos ? (
        <div className="acciones">
          <button type="button" className="secundario" onClick={Exportar}>
            Exportar el corte filtrado completo
          </button>
        </div>
      ) : null}
    </>
  );
}

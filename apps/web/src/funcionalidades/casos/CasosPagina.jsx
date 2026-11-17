/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-14.
 * Modificación: 2026-11-16. Paginación, exportación, línea de tiempo,
 * ciclo del caso, apertura directa, clave única y consulta Regional y Nacional.
 * HU-023, HU-024, HU-025 y HU-032 a HU-035.
 * El establecimiento no recibe el detalle interno.
 */
import { useEffect, useState } from 'react';
import { Aviso, Cargando, Campo, ClasePrioridad, Vacio } from '../../componentes/interfaz';
import CicloCaso from './CicloCaso';
import ExpedienteConsulta from './ExpedienteConsulta';
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
  if (contexto.puedeVerCasosRegion) {
    return 'Casos de la Región';
  }
  if (contexto.puedeVerCasosNacional) {
    return 'Casos nacionales';
  }
  if (contexto.puedeVerCasosOficina) {
    return 'Casos de la Oficina Local';
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
  return { ...CONSULTA_VACIA, identificacion };
}

export default function CasosPagina({
  direccionApi,
  identidad,
  contexto,
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

  return (
    <>
      <h1>{TituloCasos(contexto)}</h1>
      {superior ? <p>La consulta no modifica casos ni habilita la gestión de Oficina Local.</p> : null}
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
        <Campo id="caso-estado" etiqueta="Estado">
          <select id="caso-estado" value={consulta.estado} onChange={(evento) => establecerConsulta({ ...consulta, estado: evento.target.value })}>
            <option value="">Todos</option>
            <option value="ACTIVO">Activo</option>
            <option value="CERRADO">Cerrado</option>
          </select>
        </Campo>
        <Campo id="caso-prioridad" etiqueta="Prioridad A.I.">
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
      {pagina && superior ? (
        <p>Total del ámbito filtrado: {pagina.total}. En esta página: {pagina.devueltos}.</p>
      ) : null}
      {pagina && !superior ? <p>{pagina.devueltos} de {pagina.total}</p> : null}
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
      {detalle && contexto.puedeVerDetalleConsulta && !contexto.puedeVerDetalleCaso ? (
        <ExpedienteConsulta detalle={detalle} />
      ) : null}
      {detalle && contexto.puedeVerDetalleCaso ? (
        <section className="panel" aria-labelledby="titulo-caso">
          <h2 id="titulo-caso">Caso {detalle.casoId}</h2>
          <p>{detalle.nombre || 'Nombre no disponible'} — {detalle.identificacion}</p>
          <p>Establecimiento: {detalle.establecimientoNombre || detalle.establecimientoId}</p>
          <p>Consecutivo de origen: {detalle.consecutivo}</p>
          <p>
            Estado: {detalle.estado}. Apertura: {detalle.fechaApertura}.
            {detalle.fechaCierre ? ` Cierre: ${detalle.fechaCierre}.` : ''}
          </p>
          <p>
            Prioridad vigente: <strong className={ClasePrioridad(detalle.prioridadCodigo)}>{detalle.prioridadEtiqueta || 'Sin valoración vigente'}</strong>
          </p>
          <p>Riesgo profesional: {detalle.riesgoCodigo || 'No registrado'}. Protección: {detalle.proteccionCodigo || 'No registrada'}.</p>
          <h3>Contexto de ingreso</h3>
          <p>Encargado: {detalle.contextoIngreso.encargado || 'No registrado'}</p>
          <p>Relación: {detalle.contextoIngreso.relacion || 'No registrada'}</p>
          <p>Contacto: {detalle.contextoIngreso.contacto || 'No registrado'}</p>
          <h3>Valoraciones</h3>
          <ul>
            {detalle.valoraciones.map((item) => (
              <li key={item.valoracionId}>
                {item.fecha} — {item.prioridadEtiqueta}{item.vigente ? ' (vigente)' : ''} — {item.responsable}
              </li>
            ))}
          </ul>
          <h3>Plan vigente</h3>
          {detalle.plan ? (
            <>
              <p>Frecuencia: {detalle.plan.frecuenciaEtiqueta}</p>
              <p>Propósitos: {detalle.plan.propositos.join('; ')}</p>
              <p>Estrategias: {detalle.plan.estrategias.join(', ')}</p>
              <p>Disciplinas: {detalle.plan.disciplinas.join(', ')}</p>
            </>
          ) : <p>No hay plan vigente.</p>}
          <h3>Última atención</h3>
          <p>{detalle.ultimaAtencion.mensaje || detalle.ultimaAtencion.fecha}</p>
          <h3>Línea de tiempo</h3>
          {detalle.lineaTiempo && detalle.lineaTiempo.length > 0 ? (
            <ol>
              {detalle.lineaTiempo.map((evento) => (
                <li key={evento.clave}>
                  {evento.fecha} — {evento.texto}
                  {evento.responsable ? ` — ${evento.responsable}` : ''}
                </li>
              ))}
            </ol>
          ) : <p>Sin eventos persistidos para mostrar.</p>}
          {detalle.consultaIndividual
            && detalle.consultaIndividual.disponibilidad !== 'DISPONIBLE' ? (
              <p>{detalle.consultaIndividual.mensaje}</p>
            ) : null}
          <h3>Atenciones individuales</h3>
          {detalle.atenciones && detalle.atenciones.length > 0 ? (
            <ul>
              {detalle.atenciones.map((item) => (
                <li key={item.atencionId}>
                  {item.fechaAtencion}. Registro: {item.fechaRegistro}. {item.acciones}
                </li>
              ))}
            </ul>
          ) : <p>Sin atenciones individuales registradas.</p>}
          <h3>Participaciones grupales</h3>
          {detalle.consultaGrupal && detalle.consultaGrupal.disponibilidad !== 'DISPONIBLE'
            ? <p>{detalle.consultaGrupal.mensaje}</p>
            : null}
          {detalle.consultaGrupal && detalle.consultaGrupal.disponibilidad === 'DISPONIBLE'
            && detalle.participacionesGrupales && detalle.participacionesGrupales.length > 0 ? (
            <ul>
              {detalle.participacionesGrupales.map((item) => (
                <li key={item.atencionGrupalId}>
                  {item.fechaAtencion} — {item.tema}
                  {item.asistio === true ? ' — asistió' : ''}
                  {item.asistio === false ? ' — no asistió' : ''}
                  {item.asistio === null ? ' — asistencia no registrada' : ''}
                </li>
              ))}
            </ul>
          ) : null}
          {(!detalle.consultaGrupal || detalle.consultaGrupal.disponibilidad === 'DISPONIBLE')
            && (!detalle.participacionesGrupales || detalle.participacionesGrupales.length === 0)
            ? <p>Sin participaciones grupales registradas.</p>
            : null}
          <h3>Versiones del plan</h3>
          {detalle.consultaPlanes && detalle.consultaPlanes.disponibilidad !== 'DISPONIBLE' ? (
            <p>{detalle.consultaPlanes.mensaje}</p>
          ) : null}
          {detalle.planes && detalle.planes.length > 0
            && (!detalle.consultaPlanes || detalle.consultaPlanes.disponibilidad === 'DISPONIBLE') ? (
            <ul>
              {detalle.planes.map((item) => (
                <li key={item.planId}>
                  Versión {item.numero} — {item.fecha}
                  {item.vigente ? ' (vigente)' : ''} — {item.frecuenciaEtiqueta}
                </li>
              ))}
            </ul>
          ) : (
            detalle.consultaPlanes && detalle.consultaPlanes.disponibilidad !== 'DISPONIBLE'
              ? null
              : <p>Sin versiones adicionales consultables.</p>
          )}
          <h3>Documentos</h3>
          <p>{detalle.documentos ? detalle.documentos.mensaje || detalle.documentos.cantidad : 'Sin documentos registrados.'}</p>
          <CicloCaso
            direccionApi={direccionApi}
            identidad={identidad}
            contexto={contexto}
            detalle={detalle}
            solicitarApi={solicitarApi}
            alActualizar={() => VerDetalle(detalle.casoId)}
          />
          <h3>Historial de estado</h3>
          <ul>
            {detalle.historial.map((item) => (
              <li key={`${item.estado}-${item.ocurridoEn}`}>{item.ocurridoEn} — {item.estado}</li>
            ))}
          </ul>
          {detalle.pendientes.map((pendiente) => <Aviso key={pendiente} tipo="pendiente">{pendiente}</Aviso>)}
        </section>
      ) : null}
    </>
  );
}

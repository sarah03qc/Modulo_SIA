/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-14.
 * Modificación: 2026-11-16. Paginación, exportación, línea de tiempo
 * y apertura directa desde el seguimiento.
 * HU-023, HU-024 y HU-025. El establecimiento no recibe el detalle interno.
 */
import { useEffect, useState } from 'react';
import { Aviso, Cargando, Campo, ClasePrioridad, Vacio } from '../../componentes/interfaz';
import { DescargarArchivo, SolicitarApi } from '../../servicios/cliente-api';

const CONSULTA_VACIA = {
  identificacion: '',
  nombre: '',
  estado: '',
  prioridad: '',
  establecimientoId: ''
};

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
  const [error, establecerError] = useState('');
  const [cargando, establecerCargando] = useState(true);

  useEffect(() => {
    let vigente = true;
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
    parametros.set('pagina', String(numeroPagina));
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
    if (!Number.isInteger(casoId) || casoId <= 0 || !contexto || !contexto.puedeVerDetalleCaso) {
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
  }, [contexto, direccionApi, identidad, parametros.casoId, solicitarApi]);

  async function VerDetalle(casoId) {
    establecerError('');
    try {
      establecerDetalle(await solicitarApi(direccionApi, `/api/proceso/casos/${casoId}`, { identidad }));
    } catch (fallo) {
      establecerError(fallo.message);
    }
  }

  async function Exportar() {
    establecerError('');
    const parametros = new URLSearchParams();
    if (aplicada.estado) {
      parametros.set('estado', aplicada.estado);
    }
    if (aplicada.prioridad) {
      parametros.set('prioridad', aplicada.prioridad);
    }
    if (aplicada.identificacion) {
      parametros.set('identificacion', aplicada.identificacion);
    }
    if (aplicada.nombre) {
      parametros.set('nombre', aplicada.nombre);
    }
    if (aplicada.establecimientoId) {
      parametros.set('establecimientoId', aplicada.establecimientoId);
    }
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
      <h1>{contexto.puedeVerCasosOficina ? 'Casos de la Oficina Local' : 'Lista de Atención Interdisciplinaria'}</h1>
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
        <Campo id="caso-establecimiento" etiqueta="Establecimiento, si corresponde filtrarlo">
          <input id="caso-establecimiento" value={consulta.establecimientoId} onChange={(evento) => establecerConsulta({ ...consulta, establecimientoId: evento.target.value })} />
        </Campo>
        <button type="submit">Aplicar filtros</button>
      </form>
      {error ? <Aviso>{error}</Aviso> : null}
      {cargando ? <Cargando /> : null}
      {pagina ? <p>{pagina.devueltos} de {pagina.total}</p> : null}
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
                {contexto.puedeVerDetalleCaso ? <th>Acción</th> : null}
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
                  {contexto.puedeVerDetalleCaso ? (
                    <td><button type="button" className="secundario" onClick={() => VerDetalle(item.casoId)}>Ver detalle</button></td>
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
      {detalle && contexto.puedeVerDetalleCaso ? (
        <section className="panel" aria-labelledby="titulo-caso">
          <h2 id="titulo-caso">Caso {detalle.casoId}</h2>
          <p>{detalle.nombre || 'Nombre no disponible'} — {detalle.identificacion}</p>
          <p>Establecimiento: {detalle.establecimientoNombre || detalle.establecimientoId}</p>
          <p>Consecutivo de origen: {detalle.consecutivo}</p>
          <p>Estado: {detalle.estado}. Apertura: {detalle.fechaApertura}.</p>
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
                <li key={`${evento.tipo}-${evento.fecha}-${evento.texto}`}>
                  {evento.fecha} — {evento.texto}
                  {evento.responsable ? ` — ${evento.responsable}` : ''}
                </li>
              ))}
            </ol>
          ) : <p>Sin eventos persistidos para mostrar.</p>}
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
          {detalle.planes && detalle.planes.length > 0 ? (
            <ul>
              {detalle.planes.map((item) => (
                <li key={item.planId}>
                  Versión {item.numero} — {item.fecha}
                  {item.vigente ? ' (vigente)' : ''} — {item.frecuenciaEtiqueta}
                </li>
              ))}
            </ul>
          ) : <p>Sin versiones adicionales consultables.</p>}
          <h3>Documentos</h3>
          <p>{detalle.documentos ? detalle.documentos.mensaje || detalle.documentos.cantidad : 'Sin documentos registrados.'}</p>
          <h3>Coordinaciones</h3>
          <p>{detalle.coordinaciones ? detalle.coordinaciones.mensaje || detalle.coordinaciones.cantidad : 'Sin coordinaciones registradas.'}</p>
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

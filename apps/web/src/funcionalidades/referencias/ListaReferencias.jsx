/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-14.
 * Modificación: 2026-11-17. Título, filtros y detalle de la bandeja.
 * HU-015, HU-016, HU-017 y HU-018.
 */
import { useEffect, useState } from 'react';
import { Aviso, Cargando, Campo, Vacio } from '../../componentes/interfaz';
import { DescargarArchivo, SolicitarApi } from '../../servicios/cliente-api';

const ESTADOS = [
  ['', 'Todos'],
  ['PENDIENTE_REVISION', 'Pendiente de revisión'],
  ['ADMITIDA_AI', 'Admitida a A.I.'],
  ['NO_REQUIERE_AI', 'No requiere A.I.']
];

const ORIGENES = [
  ['', 'Todos'],
  ['VIGILANCIA_TAMIZAJE', 'Vigilancia / tamizaje'],
  ['OBSERVACION', 'Observación'],
  ['INFORMACION_FAMILIA_U_OTROS', 'Información aportada por la familia u otros'],
  ['REFERENCIA_EXTERNA', 'Referencia externa']
];

const CATEGORIAS = [
  ['', 'Todas'],
  ['CRECIMIENTO', 'Crecimiento'],
  ['DESARROLLO', 'Desarrollo'],
  ['SALUD', 'Salud'],
  ['FACTORES_RIESGO', 'Factores de riesgo']
];

const GRUPOS = [
  ['CRECIMIENTO', 'Crecimiento'],
  ['DESARROLLO', 'Desarrollo'],
  ['SALUD', 'Salud'],
  ['FACTORES_RIESGO', 'Factores de riesgo'],
  ['SIN_CLASIFICAR', 'Sin clasificación confirmada']
];

export default function ListaReferencias({
  direccionApi,
  identidad,
  contexto,
  navegar,
  soloPendientes = false,
  solicitarApi = SolicitarApi
}) {
  const [estado, establecerEstado] = useState(soloPendientes ? 'PENDIENTE_REVISION' : '');
  const [identificacion, establecerIdentificacion] = useState('');
  const [nombre, establecerNombre] = useState('');
  const [via, establecerVia] = useState('');
  const [origen, establecerOrigen] = useState('');
  const [categoria, establecerCategoria] = useState('');
  const [consecutivo, establecerConsecutivo] = useState('');
  const [pagina, establecerPagina] = useState(null);
  const [detalle, establecerDetalle] = useState(null);
  const [error, establecerError] = useState('');
  const [cargando, establecerCargando] = useState(true);

  useEffect(() => {
    let vigente = true;
    const parametros = new URLSearchParams();
    if (estado) {
      parametros.set('status', estado);
    }
    if (identificacion.trim()) {
      parametros.set('identification', identificacion.trim());
    }
    if (nombre.trim()) {
      parametros.set('name', nombre.trim());
    }
    if (via) {
      parametros.set('attentionRoute', via);
    }
    if (origen) {
      parametros.set('origin', origen);
    }
    if (categoria) {
      parametros.set('category', categoria);
    }
    if (consecutivo.trim()) {
      parametros.set('consecutive', consecutivo.trim());
    }
    solicitarApi(direccionApi, `/api/references?${parametros.toString()}`, { identidad })
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
  }, [direccionApi, identidad, estado, identificacion, nombre, via, origen, categoria, consecutivo, solicitarApi]);

  async function VerDetalle(referenceId) {
    establecerError('');
    try {
      establecerDetalle(await solicitarApi(
        direccionApi,
        `/api/references/${referenceId}`,
        { identidad }
      ));
    } catch (fallo) {
      establecerError(fallo.message);
    }
  }

  async function Descargar(referenceId) {
    establecerError('');
    try {
      const archivo = await solicitarApi(
        direccionApi,
        `/api/references/${referenceId}/document`,
        { identidad, archivo: true }
      );
      DescargarArchivo(archivo.blob, archivo.nombre);
    } catch (fallo) {
      establecerError(fallo.message);
    }
  }

  const items = pagina && pagina.result ? pagina.result.items : [];
  return (
    <>
      <p className="contexto">Detección y referencia</p>
      <h1>
        {soloPendientes
          ? 'Referencias pendientes de revisión'
          : 'Referencias a Atención Interdisciplinaria'}
      </h1>
      <h2>Bandeja de referencias</h2>
      <form onSubmit={(evento) => evento.preventDefault()}>
        <Campo id="filtro-estado" etiqueta="Estado">
          <select id="filtro-estado" value={estado} onChange={(evento) => establecerEstado(evento.target.value)}>
            {ESTADOS.map(([valor, etiqueta]) => <option key={valor || 'todos'} value={valor}>{etiqueta}</option>)}
          </select>
        </Campo>
        <Campo id="filtro-identificacion" etiqueta="Identificación">
          <input id="filtro-identificacion" value={identificacion} onChange={(evento) => establecerIdentificacion(evento.target.value)} />
        </Campo>
        <Campo id="filtro-nombre" etiqueta="Nombre">
          <input id="filtro-nombre" value={nombre} onChange={(evento) => establecerNombre(evento.target.value)} />
        </Campo>
        <Campo id="filtro-consecutivo" etiqueta="Consecutivo">
          <input id="filtro-consecutivo" value={consecutivo} onChange={(evento) => establecerConsecutivo(evento.target.value)} />
        </Campo>
        <Campo id="filtro-via" etiqueta="Vía de Atención">
          <select id="filtro-via" value={via} onChange={(evento) => establecerVia(evento.target.value)}>
            <option value="">Todas</option>
            <option value="URGENCIA">Urgencia</option>
            <option value="NO_INMEDIATA">No inmediata</option>
          </select>
        </Campo>
        <Campo id="filtro-origen" etiqueta="Origen">
          <select id="filtro-origen" value={origen} onChange={(evento) => establecerOrigen(evento.target.value)}>
            {ORIGENES.map(([valor, etiqueta]) => (
              <option key={valor || 'todos-origen'} value={valor}>{etiqueta}</option>
            ))}
          </select>
        </Campo>
        <Campo id="filtro-categoria" etiqueta="Categoría">
          <select id="filtro-categoria" value={categoria} onChange={(evento) => establecerCategoria(evento.target.value)}>
            {CATEGORIAS.map(([valor, etiqueta]) => (
              <option key={valor || 'todas-categoria'} value={valor}>{etiqueta}</option>
            ))}
          </select>
        </Campo>
      </form>
      {error ? <Aviso>{error}</Aviso> : null}
      {cargando ? <Cargando /> : null}
      {pagina && pagina.result ? <p>{pagina.result.returned} de {pagina.result.total}</p> : null}
      {!cargando && items.length === 0 ? <Vacio texto="No hay referencias para ese criterio." /> : null}
      {items.length > 0 ? (
        <div className="tabla-contenedor">
          <table>
            <caption>Referencias del ámbito</caption>
            <thead>
              <tr>
                <th>Consecutivo</th>
                <th>Persona</th>
                <th>Identificación</th>
                <th>Establecimiento</th>
                <th>Responsable</th>
                <th>Envío</th>
                <th>Estado</th>
                <th>Vía</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.referenceId}>
                  <td>{item.consecutive}</td>
                  <td>{item.person.fullName || 'Nombre no disponible'}</td>
                  <td>{item.person.personId}</td>
                  <td>{item.establishment.name || item.establishment.id}</td>
                  <td>{item.responsible}</td>
                  <td>{item.sentAt}</td>
                  <td>{item.statusLabel}</td>
                  <td>{item.attentionRoute.label}</td>
                  <td>
                    <button type="button" className="secundario" onClick={() => VerDetalle(item.referenceId)}>
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {detalle ? (
        <section className="panel" aria-labelledby="titulo-detalle-referencia">
          <h2 id="titulo-detalle-referencia">Detalle de referencia</h2>
          <p>Consecutivo: {detalle.consecutive}</p>
          <p>Estado: {detalle.statusLabel}</p>
          <p>Fecha de referencia: {detalle.referenceDate}</p>
          <p>Envío: {detalle.sentAt}</p>
          <p>Responsable: {detalle.responsible}</p>
          <p>Origen: {detalle.origin.label}</p>
          <p>Vía: {detalle.attentionRoute.label}</p>
          <p>Identificación: {detalle.person.personId}</p>
          <p>Nombre vigente: {detalle.person.fullName || 'No disponible'}</p>
          {detalle.historicalContext ? (
            <>
              <p>Región: {detalle.historicalContext.regionName || 'No disponible'}</p>
              <p>Oficina Local: {detalle.historicalContext.localOfficeName || 'No disponible'}</p>
              <p>Establecimiento: {detalle.historicalContext.establishmentName || 'No disponible'}</p>
            </>
          ) : null}
          <h3>Motivos</h3>
          {GRUPOS.map(([codigo, etiqueta]) => {
            const motivos = detalle.motives.filter((motivo) => motivo.category === codigo);
            if (motivos.length === 0) {
              return null;
            }
            return (
              <div key={codigo}>
                <h4>{etiqueta}</h4>
                <ul>
                  {motivos.map((motivo) => (
                    <li key={motivo.code}>
                      {motivo.label}{motivo.specification ? ` — ${motivo.specification}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          <p>
            Acciones realizadas previo a la referencia: {detalle.previousActions || 'No disponible'}
          </p>
          <p>
            Resultados obtenidos previo a la referencia: {detalle.previousResults || 'No disponible'}
          </p>
          <p>
            Información complementaria asociada al motivo de referencia:
            {' '}
            {detalle.complementaryInformation || 'No disponible'}
          </p>
          <div className="acciones">
            <button type="button" onClick={() => Descargar(detalle.referenceId)}>Imprimir referencia</button>
            {contexto.puedeGestionarSesiones && detalle.status === 'PENDIENTE_REVISION' ? (
              <button type="button" className="secundario" onClick={() => navegar('sesiones', { referenciaId: detalle.referenceId })}>
                Llevar a una sesión
              </button>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}

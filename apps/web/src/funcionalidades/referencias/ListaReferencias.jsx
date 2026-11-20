/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-14.
 * Modificación: 2026-11-17. Título, filtros y detalle de la bandeja.
 * Modificación: 2026-11-18. Pendientes y todas en la misma bandeja.
 * Modificación: 2026-11-19. El inicio puede abrir la bandeja en un estado.
 * HU-015, HU-016, HU-017 y HU-018.
 */
import { useEffect, useState } from 'react';
import { Aviso, Cargando, Campo, ResumenResultados, Vacio } from '../../componentes/interfaz';
import VistaDetalle, { SeccionDetalle } from '../../componentes/VistaDetalle';
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
  parametros = {},
  soloPendientes = false,
  solicitarApi = SolicitarApi
}) {
  const estadoInicial = ESTADOS.some(([codigo]) => codigo === parametros.estado)
    ? parametros.estado
    : 'PENDIENTE_REVISION';
  const [pendientes, establecerPendientes] = useState(soloPendientes || true);
  const [estado, establecerEstado] = useState(estadoInicial);
  const [identificacion, establecerIdentificacion] = useState('');
  const [nombre, establecerNombre] = useState('');
  const [via, establecerVia] = useState('');
  const [origen, establecerOrigen] = useState('');
  const [categoria, establecerCategoria] = useState('');
  const [consecutivo, establecerConsecutivo] = useState('');
  const [numeroPagina, establecerNumeroPagina] = useState(1);
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
    parametros.set('page', String(numeroPagina));
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
  }, [
    categoria,
    consecutivo,
    direccionApi,
    estado,
    identificacion,
    identidad,
    nombre,
    numeroPagina,
    origen,
    solicitarApi,
    via
  ]);

  function CambiarFiltro(establecer) {
    return (evento) => {
      establecer(evento.target.value);
      establecerNumeroPagina(1);
    };
  }

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
  const tamanoPagina = pagina && pagina.query && Number(pagina.query.pageSize)
    ? Number(pagina.query.pageSize)
    : 20;
  const totalFiltrado = pagina && pagina.result ? Number(pagina.result.total) || 0 : 0;
  const ultimaPagina = Math.max(1, Math.ceil(totalFiltrado / tamanoPagina));
  if (detalle) {
    return (
      <VistaDetalle
        titulo={detalle.consecutive || 'Referencia'}
        subtitulo={detalle.statusLabel}
        etiquetaVolver="Volver a la bandeja"
        alVolver={() => establecerDetalle(null)}
        acciones={(
          <>
            <button type="button" onClick={() => Descargar(detalle.referenceId)}>
              Imprimir referencia
            </button>
            {contexto && contexto.puedeGestionarSesiones
              && detalle.status === 'PENDIENTE_REVISION' ? (
                <button
                  type="button"
                  className="secundario"
                  onClick={() => navegar('sesiones', { referenciaId: detalle.referenceId })}
                >
                  Llevar a una sesión
                </button>
              ) : null}
          </>
        )}
      >
        {error ? <Aviso>{error}</Aviso> : null}
        <SeccionDetalle titulo="Identificación">
          <p>Identificación: {detalle.person.personId}</p>
          <p>Nombre vigente: {detalle.person.fullName || 'No disponible'}</p>
          <p>Responsable: {detalle.responsible}</p>
        </SeccionDetalle>
        <SeccionDetalle titulo="Referencia">
          <p>Fecha de referencia: {detalle.referenceDate}</p>
          <p>Envío: {detalle.sentAt}</p>
          <p>Origen: {detalle.origin.label}</p>
          <p>Vía: {detalle.attentionRoute.label}</p>
        </SeccionDetalle>
        {detalle.historicalContext ? (
          <SeccionDetalle titulo="Contexto territorial">
            <p>Región: {detalle.historicalContext.regionName || 'No disponible'}</p>
            <p>Oficina Local: {detalle.historicalContext.localOfficeName || 'No disponible'}</p>
            <p>
              Establecimiento: {detalle.historicalContext.establishmentName || 'No disponible'}
            </p>
          </SeccionDetalle>
        ) : null}
        <SeccionDetalle titulo="Motivos">
          {GRUPOS.map(([codigo, etiqueta]) => {
            const motivos = (detalle.motives || []).filter((motivo) => motivo.category === codigo);
            if (motivos.length === 0) {
              return null;
            }
            return (
              <div key={codigo}>
                <h4>{etiqueta}</h4>
                <ul>
                  {motivos.map((motivo) => (
                    <li key={motivo.code}>
                      {motivo.label}
                      {motivo.specification ? ` — ${motivo.specification}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </SeccionDetalle>
        <SeccionDetalle titulo="Información previa">
          <p>
            Acciones realizadas previo a la referencia: {detalle.previousActions || 'No disponible'}
          </p>
          <p>
            Resultados obtenidos previo a la referencia: {detalle.previousResults || 'No disponible'}
          </p>
          <p>
            Información complementaria: {detalle.complementaryInformation || 'No disponible'}
          </p>
        </SeccionDetalle>
      </VistaDetalle>
    );
  }
  return (
    <>
      <p className="contexto">Detección y referencia</p>
      <div className="encabezado-reporteria">
        <div>
          <h1>Referencias</h1>
          <p className="introduccion">
            Revise primero las que esperan una decisión. En Todas puede consultar
            las que ya fueron analizadas.
          </p>
        </div>
        {contexto && contexto.puedeCrearReferencia && navegar ? (
          <button type="button" onClick={() => navegar('referencia-nueva')}>
            Nueva referencia
          </button>
        ) : null}
      </div>
      <div className="pestanas" role="tablist" aria-label="Consulta de referencias">
        <button
          type="button"
          role="tab"
          aria-selected={pendientes}
          onClick={() => {
            establecerPendientes(true);
            establecerEstado('PENDIENTE_REVISION');
            establecerNumeroPagina(1);
          }}
        >
          Pendientes
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!pendientes}
          onClick={() => {
            establecerPendientes(false);
            establecerEstado('');
            establecerNumeroPagina(1);
          }}
        >
          Todas
        </button>
      </div>
      <form onSubmit={(evento) => evento.preventDefault()}>
        {pendientes ? null : (
          <Campo id="filtro-estado" etiqueta="Estado">
            <select id="filtro-estado" value={estado} onChange={CambiarFiltro(establecerEstado)}>
              {ESTADOS.map(([valor, etiqueta]) => <option key={valor || 'todos'} value={valor}>{etiqueta}</option>)}
            </select>
          </Campo>
        )}
        <Campo id="filtro-identificacion" etiqueta="Identificación">
          <input id="filtro-identificacion" value={identificacion} onChange={CambiarFiltro(establecerIdentificacion)} />
        </Campo>
        <Campo id="filtro-nombre" etiqueta="Nombre">
          <input id="filtro-nombre" value={nombre} onChange={CambiarFiltro(establecerNombre)} />
        </Campo>
        <Campo id="filtro-consecutivo" etiqueta="Consecutivo">
          <input id="filtro-consecutivo" value={consecutivo} onChange={CambiarFiltro(establecerConsecutivo)} />
        </Campo>
        <Campo id="filtro-via" etiqueta="Vía de Atención">
          <select id="filtro-via" value={via} onChange={CambiarFiltro(establecerVia)}>
            <option value="">Todas</option>
            <option value="URGENCIA">Urgencia</option>
            <option value="NO_INMEDIATA">No inmediata</option>
          </select>
        </Campo>
        <Campo id="filtro-origen" etiqueta="Origen">
          <select id="filtro-origen" value={origen} onChange={CambiarFiltro(establecerOrigen)}>
            {ORIGENES.map(([valor, etiqueta]) => (
              <option key={valor || 'todos-origen'} value={valor}>{etiqueta}</option>
            ))}
          </select>
        </Campo>
        <Campo id="filtro-categoria" etiqueta="Categoría">
          <select id="filtro-categoria" value={categoria} onChange={CambiarFiltro(establecerCategoria)}>
            {CATEGORIAS.map(([valor, etiqueta]) => (
              <option key={valor || 'todas-categoria'} value={valor}>{etiqueta}</option>
            ))}
          </select>
        </Campo>
      </form>
      {error ? <Aviso>{error}</Aviso> : null}
      {cargando ? <Cargando /> : null}
      {pagina && pagina.result ? (
        <ResumenResultados
          filtrados={pagina.result.total}
          totalAmbito={pagina.result.totalAmbito}
          pagina={numeroPagina}
          tamano={pagina.query && pagina.query.pageSize}
          hayFiltros={Boolean(
            estado || identificacion.trim() || nombre.trim()
            || via || origen || categoria || consecutivo.trim()
          )}
        />
      ) : null}
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
                      Ver referencia
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {totalFiltrado > tamanoPagina ? (
        <div className="acciones">
          <button
            type="button"
            className="secundario"
            disabled={numeroPagina <= 1}
            onClick={() => establecerNumeroPagina((actual) => Math.max(1, actual - 1))}
          >
            Página anterior
          </button>
          <p>{`Página ${Math.min(numeroPagina, ultimaPagina)} de ${ultimaPagina}`}</p>
          <button
            type="button"
            className="secundario"
            disabled={numeroPagina >= ultimaPagina}
            onClick={() => establecerNumeroPagina((actual) => actual + 1)}
          >
            Página siguiente
          </button>
        </div>
      ) : null}
    </>
  );
}

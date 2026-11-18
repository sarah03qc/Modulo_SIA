/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * Modificación: 2026-11-16. El alta y la resolución usan metodo y json.
 * Modificación: 2026-11-17. Título de planificación operativa.
 * HU-044 y HU-002. La resolución no borra la actividad anterior.
 */
import { useEffect, useState } from 'react';
import { Aviso, Campo, Cargando, Vacio } from '../../componentes/interfaz';
import { SolicitarApi } from '../../servicios/cliente-api';

function NuevaClave() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `prog-${Date.now()}`;
}

const RESOLUCION_INICIAL = {
  efecto: 'REALIZADA',
  nuevaFecha: '',
  motivo: ''
};

export default function ProgramacionPagina({
  direccionApi,
  identidad,
  contexto,
  navegar,
  solicitarApi = SolicitarApi
}) {
  const [catalogo, establecerCatalogo] = useState(null);
  const [consulta, establecerConsulta] = useState(null);
  const [filtros, establecerFiltros] = useState({ establecimientoId: '', estado: '' });
  const [actividad, establecerActividad] = useState({
    fecha: '',
    tipoItemId: '',
    titulo: '',
    establecimientoId: '',
    observaciones: '',
    casos: ''
  });
  const [seleccion, establecerSeleccion] = useState(null);
  const [resolucion, establecerResolucion] = useState(RESOLUCION_INICIAL);
  const [claveAlta, establecerClaveAlta] = useState(NuevaClave);
  const [claveResolucion, establecerClaveResolucion] = useState(NuevaClave);
  const [error, establecerError] = useState('');
  const [mensaje, establecerMensaje] = useState('');
  const [enviando, establecerEnviando] = useState(false);

  async function Cargar(aplicados = filtros) {
    const parametros = new URLSearchParams();
    if (aplicados.establecimientoId) {
      parametros.set('establecimientoId', aplicados.establecimientoId);
    }
    if (aplicados.estado) {
      parametros.set('estado', aplicados.estado);
    }
    const ruta = parametros.toString()
      ? `/api/programacion/actividades?${parametros.toString()}`
      : '/api/programacion/actividades';
    const datos = await solicitarApi(direccionApi, ruta, { identidad });
    establecerConsulta(datos);
  }

  useEffect(() => {
    let vigente = true;
    establecerError('');
    Promise.all([
      solicitarApi(direccionApi, '/api/programacion/catalogos', { identidad }),
      solicitarApi(direccionApi, '/api/programacion/actividades', { identidad })
    ]).then(([tipos, datos]) => {
      if (vigente) {
        establecerCatalogo(tipos);
        establecerConsulta(datos);
      }
    }).catch((fallo) => {
      if (vigente) {
        establecerError(fallo.message);
      }
    });
    return () => {
      vigente = false;
    };
  }, [direccionApi, identidad, solicitarApi]);

  async function Crear(evento) {
    evento.preventDefault();
    establecerError('');
    establecerMensaje('');
    establecerEnviando(true);
    try {
      const casos = actividad.casos
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .map((item) => Number(item));
      const resultado = await solicitarApi(direccionApi, '/api/programacion/actividades', {
        identidad,
        metodo: 'POST',
        json: {
          fecha: actividad.fecha,
          tipoItemId: Number(actividad.tipoItemId),
          titulo: actividad.titulo,
          establecimientoId: actividad.establecimientoId
            ? Number(actividad.establecimientoId)
            : null,
          observaciones: actividad.observaciones || null,
          casos,
          claveOperacion: claveAlta
        }
      });
      establecerMensaje(resultado.repetida
        ? 'La actividad ya estaba registrada.'
        : 'La actividad quedó programada.');
      establecerClaveAlta(NuevaClave());
      await Cargar();
    } catch (fallo) {
      establecerError(fallo.message);
    } finally {
      establecerEnviando(false);
    }
  }

  async function Resolver(evento) {
    evento.preventDefault();
    if (!seleccion) {
      return;
    }
    establecerError('');
    establecerMensaje('');
    establecerEnviando(true);
    try {
      const resultado = await solicitarApi(
        direccionApi,
        `/api/programacion/actividades/${seleccion.actividadId}/resoluciones`,
        {
          identidad,
          metodo: 'POST',
          json: {
            efecto: resolucion.efecto,
            nuevaFecha: resolucion.efecto === 'REPROGRAMADA' ? resolucion.nuevaFecha : null,
            motivo: resolucion.efecto === 'REALIZADA' ? null : resolucion.motivo,
            claveOperacion: claveResolucion
          }
        }
      );
      establecerMensaje(resultado.repetida
        ? 'Esa resolución ya estaba registrada.'
        : 'La actividad conservó su historial.');
      establecerClaveResolucion(NuevaClave());
      establecerSeleccion(null);
      await Cargar();
    } catch (fallo) {
      establecerError(fallo.message);
    } finally {
      establecerEnviando(false);
    }
  }

  if (!consulta || !catalogo) {
    return error ? <Aviso>{error}</Aviso> : <Cargando texto="Cargando la programación." />;
  }
  const puedeGestionar = contexto && contexto.puedeGestionarProgramacion;
  return (
    <>
      <p className="contexto">Planificación operativa</p>
      <h1>Programación</h1>
      <p>
        Fecha de consulta: {consulta.fechaConsulta}. Una actividad vencida sigue
        programada después de su fecha. El texto «Vencida» acompaña la alerta.
      </p>
      {consulta.historial && consulta.historial.disponibilidad === 'BLOQUEADO' ? (
        <Aviso tipo="pendiente">
          El historial de cambios y las personas asociadas no se pueden leer
          con la cuenta actual. La resolución queda pendiente del permiso de escritura.
        </Aviso>
      ) : null}
      {error ? <Aviso>{error}</Aviso> : null}
      {mensaje ? <Aviso tipo="ok">{mensaje}</Aviso> : null}
      <form className="panel" onSubmit={(evento) => {
        evento.preventDefault();
        Cargar().catch((fallo) => establecerError(fallo.message));
      }}>
        <Campo id="filtro-establecimiento" etiqueta="Establecimiento">
          <input
            id="filtro-establecimiento"
            value={filtros.establecimientoId}
            onChange={(evento) => establecerFiltros({
              ...filtros,
              establecimientoId: evento.target.value
            })}
          />
        </Campo>
        <Campo id="filtro-estado" etiqueta="Estado">
          <select
            id="filtro-estado"
            value={filtros.estado}
            onChange={(evento) => establecerFiltros({ ...filtros, estado: evento.target.value })}
          >
            <option value="">Todos</option>
            <option value="PROGRAMADA">Programada</option>
            <option value="REALIZADA">Realizada</option>
            <option value="REPROGRAMADA">Reprogramada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </Campo>
        <button type="submit">Aplicar filtros</button>
      </form>
      <p>{consulta.cantidad} de {consulta.total ?? consulta.cantidad} actividades.</p>
      {consulta.cantidad === 0 ? <Vacio texto="No hay actividades para este corte." /> : (
        <div className="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>Fecha vigente</th>
                <th>Fecha prevista</th>
                <th>Título</th>
                <th>Estado</th>
                <th>Alerta</th>
                <th>Motivo</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {consulta.actividades.map((item) => (
                <tr key={item.actividadId} className={item.vencida ? 'alerta-vencida' : undefined}>
                  <td>{item.fechaVigente}</td>
                  <td>{item.fechaPrevista}</td>
                  <td>{item.titulo}</td>
                  <td>{item.estado}</td>
                  <td>{item.alerta || 'Sin alerta'}</td>
                  <td>{item.motivo || 'Sin motivo'}</td>
                  <td>
                    {puedeGestionar && item.estado === 'PROGRAMADA' ? (
                      <button type="button" className="secundario" onClick={() => {
                        establecerSeleccion(item);
                        establecerResolucion(RESOLUCION_INICIAL);
                        establecerClaveResolucion(NuevaClave());
                      }}>
                        Resolver
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <section className="panel">
        <h2>Próximas acciones de atención</h2>
        <p>{consulta.proximasAcciones.nota || consulta.proximasAcciones.mensaje}</p>
        {consulta.proximasAcciones.disponibilidad === 'DISPONIBLE'
          && consulta.proximasAcciones.items.length === 0
          ? <p>No hay próximas acciones con fecha en la última atención.</p>
          : null}
        {consulta.proximasAcciones.disponibilidad === 'DISPONIBLE' ? (
          <ul>
            {consulta.proximasAcciones.items.map((item) => (
              <li key={item.atencionId}>
                <button
                  type="button"
                  className="secundario"
                  onClick={() => navegar('casos', { casoId: item.casoId })}
                >
                  {item.fecha} — caso {item.casoId} — {item.accion}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
      {puedeGestionar ? (
        <form className="panel" onSubmit={Crear}>
          <h2>Nueva actividad</h2>
          <p>Sin casos asociados queda como actividad general. No programa a todos los casos.</p>
          <Campo id="actividad-fecha" etiqueta="Fecha prevista">
            <input
              id="actividad-fecha"
              type="date"
              required
              value={actividad.fecha}
              onChange={(evento) => establecerActividad({ ...actividad, fecha: evento.target.value })}
            />
          </Campo>
          <Campo id="actividad-tipo" etiqueta="Tipo">
            <select
              id="actividad-tipo"
              required
              value={actividad.tipoItemId}
              onChange={(evento) => establecerActividad({
                ...actividad,
                tipoItemId: evento.target.value
              })}
            >
              <option value="">Seleccione</option>
              {catalogo.items.map((item) => (
                <option key={item.itemId} value={item.itemId}>{item.etiqueta}</option>
              ))}
            </select>
          </Campo>
          <Campo id="actividad-titulo" etiqueta="Título o propósito">
            <input
              id="actividad-titulo"
              required
              value={actividad.titulo}
              onChange={(evento) => establecerActividad({ ...actividad, titulo: evento.target.value })}
            />
          </Campo>
          <Campo id="actividad-establecimiento" etiqueta="Establecimiento, si corresponde">
            <input
              id="actividad-establecimiento"
              value={actividad.establecimientoId}
              onChange={(evento) => establecerActividad({
                ...actividad,
                establecimientoId: evento.target.value
              })}
            />
          </Campo>
          <Campo id="actividad-casos" etiqueta="Casos, separados por coma">
            <input
              id="actividad-casos"
              value={actividad.casos}
              onChange={(evento) => establecerActividad({ ...actividad, casos: evento.target.value })}
            />
          </Campo>
          <Campo id="actividad-observaciones" etiqueta="Observaciones">
            <input
              id="actividad-observaciones"
              value={actividad.observaciones}
              onChange={(evento) => establecerActividad({
                ...actividad,
                observaciones: evento.target.value
              })}
            />
          </Campo>
          {catalogo.disponibilidad !== 'DISPONIBLE' ? <Aviso tipo="pendiente">{catalogo.mensaje}</Aviso> : null}
          <button type="submit" disabled={enviando || catalogo.disponibilidad !== 'DISPONIBLE'}>
            Programar
          </button>
        </form>
      ) : null}
      {seleccion ? (
        <form className="panel" onSubmit={Resolver}>
          <h2>Resolver {seleccion.titulo}</h2>
          <p>La fila se conserva. Reprogramar cambia la fecha vigente y guarda la anterior.</p>
          <Campo id="resolucion-efecto" etiqueta="Resolución">
            <select
              id="resolucion-efecto"
              value={resolucion.efecto}
              onChange={(evento) => establecerResolucion({
                ...resolucion,
                efecto: evento.target.value
              })}
            >
              <option value="REALIZADA">Realizada</option>
              <option value="REPROGRAMADA">Reprogramada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </Campo>
          {resolucion.efecto === 'REPROGRAMADA' ? (
            <Campo id="resolucion-fecha" etiqueta="Nueva fecha">
              <input
                id="resolucion-fecha"
                type="date"
                required
                value={resolucion.nuevaFecha}
                onChange={(evento) => establecerResolucion({
                  ...resolucion,
                  nuevaFecha: evento.target.value
                })}
              />
            </Campo>
          ) : null}
          {resolucion.efecto !== 'REALIZADA' ? (
            <Campo id="resolucion-motivo" etiqueta="Motivo">
              <input
                id="resolucion-motivo"
                required
                value={resolucion.motivo}
                onChange={(evento) => establecerResolucion({
                  ...resolucion,
                  motivo: evento.target.value
                })}
              />
            </Campo>
          ) : null}
          <button type="submit" disabled={enviando}>Confirmar resolución</button>
        </form>
      ) : null}
    </>
  );
}

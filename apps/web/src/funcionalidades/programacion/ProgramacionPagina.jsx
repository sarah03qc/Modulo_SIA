/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * Modificación: 2026-11-16. El alta y la resolución usan metodo y json.
 * Modificación: 2026-11-18. Calendario, alta y lenguaje de la lista.
 * Modificación: 2026-11-18. Una sola «Fecha» efectiva en lista, calendario y
 * detalle; la fecha original y las reprogramaciones pasan al historial.
 * HU-044 y HU-002. La resolución no borra la actividad anterior.
 */
import { useEffect, useState } from 'react';
import { Aviso, Campo, Cargando, ResumenResultados, Vacio } from '../../componentes/interfaz';
import VistaDetalle, { DatosDetalle, SeccionDetalle } from '../../componentes/VistaDetalle';
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

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function ClaveFecha(valor) {
  return String(valor || '').slice(0, 10);
}

/**
 * Presenta una fecha ISO (aaaa-mm-dd) como dd/mm/aaaa sin conversión de zona.
 */
function FormatearFecha(valor) {
  const clave = ClaveFecha(valor);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clave)) {
    return valor ? String(valor) : '—';
  }
  return `${clave.slice(8, 10)}/${clave.slice(5, 7)}/${clave.slice(0, 4)}`;
}

/**
 * Historial legible: la fecha original y cada cambio en orden.
 */
function EventosHistorial(actividad) {
  const eventos = [{
    clave: 'origen',
    texto: `Programada originalmente para el ${FormatearFecha(actividad.fechaPrevista)}.`
  }];
  const cambios = [...(actividad.cambios || [])].sort((a, b) => a.numero - b.numero);
  for (const cambio of cambios) {
    const etiqueta = ETIQUETA_ESTADO[cambio.estadoNuevo] || cambio.estadoNuevo;
    const fechas = cambio.estadoNuevo === 'REPROGRAMADA'
      ? ` del ${FormatearFecha(cambio.fechaAnterior)} al ${FormatearFecha(cambio.fechaNueva)}`
      : ` (fecha ${FormatearFecha(cambio.fechaNueva || cambio.fechaAnterior)})`;
    const motivo = cambio.motivo ? ` Motivo: ${cambio.motivo}.` : '';
    const registro = cambio.usuario
      ? ` Registró ${cambio.usuario} el ${FormatearFecha(cambio.ocurridoEn)}.`
      : '';
    eventos.push({
      clave: `cambio-${cambio.numero}`,
      texto: `${etiqueta}${fechas}.${motivo}${registro}`
    });
  }
  return eventos;
}

function CeldasDelMes(anio, mes) {
  const primero = new Date(anio, mes - 1, 1);
  const desplazamiento = (primero.getDay() + 6) % 7;
  const cantidad = new Date(anio, mes, 0).getDate();
  const celdas = Array(desplazamiento).fill(null);
  for (let dia = 1; dia <= cantidad; dia += 1) {
    celdas.push(dia);
  }
  return celdas;
}

function NombreMes(anio, mes) {
  return new Date(anio, mes - 1, 1).toLocaleDateString('es-CR', {
    month: 'long',
    year: 'numeric'
  });
}

const ETIQUETA_ESTADO = {
  PROGRAMADA: 'Programada',
  REALIZADA: 'Realizada',
  REPROGRAMADA: 'Reprogramada',
  CANCELADA: 'Cancelada'
};

function MesMasReciente(actividades) {
  const fechas = actividades
    .map((item) => ClaveFecha(item.fechaVigente))
    .filter((clave) => /^\d{4}-\d{2}-\d{2}$/.test(clave))
    .sort();
  if (fechas.length === 0) {
    return null;
  }
  const clave = fechas[fechas.length - 1];
  return {
    anio: Number(clave.slice(0, 4)),
    mes: Number(clave.slice(5, 7))
  };
}

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
  const [corte, establecerCorte] = useState({ establecimientoId: '', estado: '' });
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
  const [modo, establecerModo] = useState('calendario');
  const [creando, establecerCreando] = useState(false);
  const hoy = new Date();
  const [mes, establecerMes] = useState({
    anio: hoy.getFullYear(),
    mes: hoy.getMonth() + 1
  });

  async function Cargar(aplicados = corte) {
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

  useEffect(() => {
    if (!creando) {
      return undefined;
    }
    document.getElementById('actividad-fecha')?.focus();
    function CerrarConEscape(evento) {
      if (evento.key === 'Escape') {
        establecerCreando(false);
      }
    }
    document.addEventListener('keydown', CerrarConEscape);
    return () => {
      document.removeEventListener('keydown', CerrarConEscape);
      document.getElementById('abrir-nueva-actividad')?.focus();
    };
  }, [creando]);

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
      establecerCreando(false);
      establecerActividad({
        fecha: '',
        tipoItemId: '',
        titulo: '',
        establecimientoId: '',
        observaciones: '',
        casos: ''
      });
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
  const prefijoMes = `${mes.anio}-${String(mes.mes).padStart(2, '0')}`;
  const actividades = consulta.actividades || [];
  const delMes = actividades.filter((item) => ClaveFecha(item.fechaVigente).startsWith(prefijoMes));
  const celdas = CeldasDelMes(mes.anio, mes.mes);
  function MoverMes(delta) {
    const fecha = new Date(mes.anio, mes.mes - 1 + delta, 1);
    establecerMes({ anio: fecha.getFullYear(), mes: fecha.getMonth() + 1 });
  }
  function AbrirActividad(item) {
    establecerSeleccion(item);
    establecerResolucion(RESOLUCION_INICIAL);
    establecerClaveResolucion(NuevaClave());
  }
  const puedeResolver = Boolean(
    puedeGestionar && seleccion && seleccion.estado === 'PROGRAMADA'
  );
  if (seleccion) {
    return (
      <VistaDetalle
        titulo={seleccion.titulo}
        etiquetaVolver="Volver a programación"
        alVolver={() => establecerSeleccion(null)}
        subtitulo={`${FormatearFecha(seleccion.fechaVigente)}`
          + `${seleccion.vencida ? ' · Vencida' : ''}`
          + ` · ${ETIQUETA_ESTADO[seleccion.estado] || seleccion.estado}`}
      >
        {error ? <Aviso>{error}</Aviso> : null}
        {mensaje ? <Aviso tipo="ok">{mensaje}</Aviso> : null}
        <SeccionDetalle titulo="Fecha">
          <DatosDetalle datos={[{
            etiqueta: 'Fecha',
            valor: FormatearFecha(seleccion.fechaVigente)
          }]}
          />
        </SeccionDetalle>
        <SeccionDetalle titulo="Historial">
          <ul>
            {EventosHistorial(seleccion).map((evento) => (
              <li key={evento.clave}>{evento.texto}</li>
            ))}
          </ul>
        </SeccionDetalle>
        {puedeResolver ? (
          <form onSubmit={Resolver}>
            <p>
              La actividad se conserva. Si la reprograma,
              la fecha anterior queda registrada.
            </p>
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
      </VistaDetalle>
    );
  }
  return (
    <>
      <p className="contexto">Planificación</p>
      <div className="encabezado-reporteria">
        <div>
          <h1>Programación</h1>
          <p className="introduccion">
            Consulte las actividades, revise el calendario y organice las que faltan.
          </p>
        </div>
        {puedeGestionar ? (
          <button
            id="abrir-nueva-actividad"
            type="button"
            onClick={() => establecerCreando(true)}
          >
            Nueva actividad
          </button>
        ) : null}
      </div>
      {consulta.historial && consulta.historial.disponibilidad === 'BLOQUEADO' ? (
        <Aviso tipo="pendiente">
          Con esta cuenta no se puede consultar el historial de cambios.
        </Aviso>
      ) : null}
      {error ? <Aviso>{error}</Aviso> : null}
      {mensaje ? <Aviso tipo="ok">{mensaje}</Aviso> : null}
      <form className="panel" onSubmit={(evento) => {
        evento.preventDefault();
        establecerCorte(filtros);
        Cargar(filtros).catch((fallo) => establecerError(fallo.message));
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
      <div className="pestanas" role="tablist" aria-label="Presentación de actividades">
        <button type="button" role="tab" aria-selected={modo === 'calendario'} onClick={() => establecerModo('calendario')}>
          Calendario
        </button>
        <button type="button" role="tab" aria-selected={modo === 'lista'} onClick={() => establecerModo('lista')}>
          Lista
        </button>
      </div>
      <ResumenResultados
        filtrados={consulta.cantidad}
        totalAmbito={consulta.total}
        hayFiltros={Boolean(corte.estado || corte.establecimientoId)}
      />
      {consulta.cantidad === 0 ? <Vacio texto="No hay actividades para este corte." /> : null}
      {modo === 'calendario' && consulta.cantidad > 0 ? (
        <section aria-label="Calendario de actividades">
          <div className="calendario-controles">
            <button type="button" className="secundario" onClick={() => MoverMes(-1)}>
              Mes anterior
            </button>
            <p>{NombreMes(mes.anio, mes.mes)}</p>
            <button type="button" className="secundario" onClick={() => MoverMes(1)}>
              Mes siguiente
            </button>
          </div>
          {delMes.length === 0 ? (
            <div className="ayuda">
              <p>No hay actividades en {NombreMes(mes.anio, mes.mes)}.</p>
              {MesMasReciente(actividades) ? (
                <button
                  type="button"
                  className="secundario"
                  onClick={() => establecerMes(MesMasReciente(actividades))}
                >
                  Ver el mes más reciente con actividades
                </button>
              ) : null}
            </div>
          ) : null}
          <div className="calendario">
            {DIAS.map((dia) => <div key={dia} className="calendario-nombre">{dia}</div>)}
            {celdas.map((dia, indice) => {
              if (!dia) {
                return <div key={`vacio-${indice}`} className="calendario-dia vacio-dia" />;
              }
              const clave = `${prefijoMes}-${String(dia).padStart(2, '0')}`;
              const delDia = delMes.filter((item) => ClaveFecha(item.fechaVigente) === clave);
              return (
                <div key={clave} className="calendario-dia">
                  <span>{dia}</span>
                  {delDia.map((item) => (
                    <button
                      key={item.actividadId}
                      type="button"
                      className="secundario"
                      onClick={() => AbrirActividad(item)}
                      title={item.titulo}
                    >
                      {item.titulo}
                      {item.vencida ? ' · Vencida' : ''}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
      {modo === 'lista' && consulta.cantidad > 0 ? (
        <div className="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
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
                  <td>{FormatearFecha(item.fechaVigente)}</td>
                  <td>{item.titulo}</td>
                  <td>{ETIQUETA_ESTADO[item.estado] || item.estado}</td>
                  <td>{item.alerta || '—'}</td>
                  <td>{item.motivo || '—'}</td>
                  <td>
                    <button
                      type="button"
                      className="secundario"
                      onClick={() => AbrirActividad(item)}
                    >
                      {puedeGestionar && item.estado === 'PROGRAMADA' ? 'Resolver' : 'Ver detalle'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <section className="panel">
        <h2>Próximas acciones de atención</h2>
        {consulta.proximasAcciones.disponibilidad !== 'DISPONIBLE'
          && consulta.proximasAcciones.mensaje ? (
            <Aviso tipo="pendiente">{consulta.proximasAcciones.mensaje}</Aviso>
          ) : null}
        {consulta.proximasAcciones.disponibilidad === 'DISPONIBLE'
          && consulta.proximasAcciones.items.length === 0
          ? <p>No hay próximas acciones con fecha en la última atención.</p>
          : null}
        {consulta.proximasAcciones.disponibilidad === 'DISPONIBLE' ? (
          <ul className="lista-acciones">
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
      {puedeGestionar && creando ? (
        <div className="dialogo-fondo" role="presentation">
        <div className="dialogo dialogo-amplio" role="dialog" aria-modal="true" aria-labelledby="titulo-nueva-actividad">
        <form onSubmit={Crear}>
          <h2 id="titulo-nueva-actividad">Nueva actividad</h2>
          <p className="introduccion">
            Puede programar una actividad general o relacionarla con uno o varios casos.
          </p>
          <Campo id="actividad-fecha" etiqueta="Fecha">
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
              aria-describedby="ayuda-casos-actividad"
              onChange={(evento) => establecerActividad({ ...actividad, casos: evento.target.value })}
            />
            <p id="ayuda-casos-actividad">
              Si deja este campo vacío, la actividad no se asigna a todos los casos.
            </p>
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
          <div className="acciones">
            <button type="submit" disabled={enviando || catalogo.disponibilidad !== 'DISPONIBLE'}>
              Programar
            </button>
            <button type="button" className="secundario" onClick={() => establecerCreando(false)}>
              Cancelar
            </button>
          </div>
        </form>
        </div>
        </div>
      ) : null}
    </>
  );
}

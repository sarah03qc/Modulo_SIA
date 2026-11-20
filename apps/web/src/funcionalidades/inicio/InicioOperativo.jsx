/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-14.
 * Modificación: 2026-11-16. Alerta de actividades vencidas, programación
 * y acceso a casos de Región y Nacional.
 * Modificación: 2026-11-18. Jerarquía del resumen y acciones de la sesión.
 * Modificación: 2026-11-19. Inicio por ámbito, con datos del resumen vigente.
 * HU-001 y HU-002. Un indicador ausente no se muestra como cero.
 */
import { useEffect, useState } from 'react';
import Icono from '../../componentes/Icono';
import { Aviso, Cargando } from '../../componentes/interfaz';
import { SolicitarApi } from '../../servicios/cliente-api';

const FORMATO = new Intl.NumberFormat('es-CR');

const SUBTITULOS = {
  ESTABLECIMIENTO: 'Busque personas, registre referencias y consulte '
    + 'las situaciones de su establecimiento.',
  OFICINA_LOCAL: 'Revise sus pendientes, consulte la actividad de su oficina '
    + 'y continúe con sus tareas.',
  REGION: 'Consulte los principales resultados y actividades '
    + 'de las Oficinas Locales de su región.',
  NACIONAL: 'Consulte los indicadores nacionales de Atención Interdisciplinaria '
    + 'y su distribución territorial.'
};

const METRICAS = [
  ['casosActivos', 'Casos activos'],
  ['referenciasPendientes', 'Referencias pendientes'],
  ['atencionesIndividuales', 'Atenciones individuales']
];

function Disponible(indicador) {
  return Boolean(indicador && (
    indicador.disponibilidad === 'DISPONIBLE' || indicador.disponibilidad === 'PARCIAL'
  ) && indicador.cantidad !== null && indicador.cantidad !== undefined);
}

function TextoCantidad(indicador) {
  return Disponible(indicador) ? FORMATO.format(indicador.cantidad) : null;
}

function TarjetaIndicador({ icono, titulo, indicador, descripcion, accion, textoAccion }) {
  const cifra = TextoCantidad(indicador);
  return (
    <section className="tarjeta-indicador">
      <div className="tarjeta-encabezado">
        <Icono nombre={icono} />
        <h3>{titulo}</h3>
      </div>
      {cifra !== null ? <p className="tarjeta-cifra">{cifra}</p> : null}
      {cifra === null && indicador && indicador.motivo
        ? <p className="tarjeta-nota">{indicador.motivo}</p>
        : null}
      {cifra === null && indicador && !indicador.motivo
        ? <p className="tarjeta-nota">No disponible.</p>
        : null}
      <p className="tarjeta-descripcion">{descripcion}</p>
      {accion ? (
        <button type="button" className="accion-tarjeta" onClick={accion}>
          {textoAccion}
        </button>
      ) : null}
    </section>
  );
}

function AlertaVencidas({ cantidad, alAbrir }) {
  if (!cantidad) {
    return null;
  }
  const texto = cantidad === 1
    ? '1 actividad vencida'
    : `${FORMATO.format(cantidad)} actividades vencidas`;
  return (
    <div className="banda-alerta" role="status">
      <Icono nombre="aviso" />
      <p>
        <strong>{texto}</strong>
        <span>
          {alAbrir
            ? ' Revise las actividades que siguen programadas después de su fecha.'
            : ' Siguen programadas después de su fecha en el ámbito autorizado.'}
        </span>
      </p>
      {alAbrir ? (
        <button type="button" className="secundario" onClick={alAbrir}>Ver programación</button>
      ) : null}
    </div>
  );
}

function PanelAgenda({ agenda, alAbrir }) {
  const items = agenda && agenda.disponibilidad === 'DISPONIBLE' ? agenda.items : [];
  return (
    <section className="panel panel-lateral" aria-labelledby="agenda-hoy">
      <h2 id="agenda-hoy">Agenda de hoy</h2>
      {!agenda || agenda.disponibilidad !== 'DISPONIBLE' ? (
        <p className="tarjeta-nota">{agenda && agenda.motivo ? agenda.motivo : 'No disponible.'}</p>
      ) : null}
      {agenda && agenda.disponibilidad === 'DISPONIBLE' && items.length === 0 ? (
        <p>No tiene actividades programadas para hoy.</p>
      ) : null}
      {items.length > 0 ? (
        <ul className="lista-agenda">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" className="fila-agenda" onClick={() => alAbrir(item)}>
                <span className="hora-agenda">{item.hora || 'Sin hora'}</span>
                <span>
                  <strong>{item.tipo}</strong>
                  <span className="detalle-agenda">{item.titulo}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function PanelAcciones({ titulo, acciones }) {
  const visibles = acciones.filter((item) => item.visible);
  if (visibles.length === 0) {
    return null;
  }
  return (
    <section className="panel panel-lateral" aria-labelledby="acciones-inicio">
      <h2 id="acciones-inicio">{titulo}</h2>
      <ul className="lista-acciones">
        {visibles.map((item) => (
          <li key={item.titulo}>
            <button type="button" className="secundario" onClick={item.accion}>
              {item.titulo}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DistribucionTerritorial({ distribucion, titulo }) {
  const [metrica, establecerMetrica] = useState('casosActivos');
  if (!distribucion || distribucion.disponibilidad !== 'DISPONIBLE') {
    return (
      <section className="panel">
        <h2>{titulo}</h2>
        <p>{distribucion && distribucion.motivo ? distribucion.motivo : 'No disponible.'}</p>
      </section>
    );
  }
  const filas = distribucion.filas || [];
  const maximo = filas.reduce((mayor, fila) => Math.max(mayor, fila[metrica] || 0), 0);
  const etiqueta = METRICAS.find((item) => item[0] === metrica)[1];
  return (
    <section className="panel" aria-labelledby="distribucion-inicio">
      <h2 id="distribucion-inicio">{titulo}</h2>
      <div className="selector-metrica" role="radiogroup" aria-label="Indicador de la comparación">
        {METRICAS.map(([codigo, nombre]) => (
          <button
            key={codigo}
            type="button"
            role="radio"
            aria-checked={metrica === codigo}
            className={metrica === codigo ? 'metrica-activa' : 'secundario'}
            onClick={() => establecerMetrica(codigo)}
          >
            {nombre}
          </button>
        ))}
      </div>
      {filas.length === 0 ? <p>No hay registros en este ámbito.</p> : null}
      {filas.length > 0 ? (
        <div className="tabla-responsive">
          <table className="tabla-distribucion">
            <caption>{etiqueta} por ámbito. Cada fila usa la misma unidad.</caption>
            <thead>
              <tr>
                <th scope="col">Ámbito</th>
                <th scope="col">{etiqueta}</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => {
                const valor = fila[metrica] || 0;
                const ancho = maximo > 0 ? Math.round((valor / maximo) * 100) : 0;
                return (
                  <tr key={fila.id}>
                    <th scope="row">{fila.nombre || `Identificador ${fila.id}`}</th>
                    <td>
                      <span className="barra-valor">{FORMATO.format(valor)}</span>
                      <span className="barra-comparacion" aria-hidden="true">
                        <span style={{ width: `${ancho}%` }} />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

function DescripcionAtenciones(indicador) {
  if (indicador && indicador.disponibilidad === 'PARCIAL') {
    return 'Solo atenciones individuales. La asistencia grupal no está disponible.';
  }
  if (indicador && indicador.grupalesConAsistencia !== null
    && indicador.grupalesConAsistencia !== undefined) {
    const grupales = FORMATO.format(indicador.grupalesConAsistencia);
    return `Atenciones individuales. Grupales con asistencia: ${grupales}.`;
  }
  return 'Atenciones individuales registradas en el ámbito.';
}

export default function InicioOperativo({
  direccionApi,
  identidad,
  contexto,
  navegar,
  solicitarApi = SolicitarApi
}) {
  const [resumen, establecerResumen] = useState(null);
  const [error, establecerError] = useState('');

  useEffect(() => {
    let vigente = true;
    establecerResumen(null);
    establecerError('');
    solicitarApi(direccionApi, '/api/proceso/resumen', { identidad })
      .then((datos) => {
        if (vigente) {
          establecerResumen(datos);
        }
      })
      .catch(() => {
        if (vigente) {
          establecerError('No fue posible cargar los indicadores. Intente nuevamente.');
        }
      });
    return () => {
      vigente = false;
    };
  }, [direccionApi, identidad, solicitarApi]);

  if (error) {
    return <Aviso>{error}</Aviso>;
  }
  if (!resumen) {
    return <Cargando texto="Cargando el resumen." />;
  }
  if (resumen.mensaje) {
    return (
      <>
        <h1>Inicio</h1>
        <Aviso tipo="pendiente">{resumen.mensaje}</Aviso>
      </>
    );
  }

  const nivel = contexto.nivel;
  const abrirProgramacion = contexto.puedeConsultarProgramacion
    ? () => navegar('programacion')
    : null;
  const vencidas = Disponible(resumen.actividadesVencidas)
    && resumen.actividadesVencidas.cantidad > 0
    ? resumen.actividadesVencidas.cantidad
    : 0;

  function AbrirAgenda(item) {
    if (item.destino === 'sesion') {
      navegar('sesion', { sesionId: item.sesionId });
      return;
    }
    if (abrirProgramacion) {
      abrirProgramacion();
    }
  }

  const accionesOperativas = [
    {
      titulo: 'Revisar referencias pendientes',
      visible: contexto.puedeConsultarReferencias
        && Disponible(resumen.referenciasPendientes)
        && resumen.referenciasPendientes.cantidad > 0,
      accion: () => navegar('referencias', { estado: 'PENDIENTE_REVISION' })
    },
    {
      titulo: 'Revisar posibles referencias',
      visible: contexto.puedeConsultarPosibles
        && Disponible(resumen.posiblesReferencias)
        && resumen.posiblesReferencias.cantidad > 0,
      accion: () => navegar('posibles')
    },
    {
      titulo: 'Atender programación vencida',
      visible: Boolean(abrirProgramacion) && vencidas > 0,
      accion: abrirProgramacion
    },
    {
      titulo: 'Consultar próximas sesiones',
      visible: contexto.puedeGestionarSesiones
        && resumen.proximasSesiones
        && resumen.proximasSesiones.disponibilidad === 'DISPONIBLE'
        && resumen.proximasSesiones.cantidad > 0,
      accion: () => navegar('sesiones')
    }
  ];

  return (
    <div className="inicio">
      <header className="inicio-encabezado">
        <h1>Inicio</h1>
        <p className="introduccion">{SUBTITULOS[nivel] || SUBTITULOS.OFICINA_LOCAL}</p>
        {resumen.etiquetaAmbito && nivel !== 'NACIONAL' ? (
          <p className="ambito-inicio">{resumen.etiquetaAmbito}</p>
        ) : null}
      </header>
      <AlertaVencidas cantidad={vencidas} alAbrir={abrirProgramacion} />
      {nivel === 'ESTABLECIMIENTO' ? (
        <InicioEstablecimiento
          resumen={resumen}
          contexto={contexto}
          navegar={navegar}
        />
      ) : null}
      {nivel === 'OFICINA_LOCAL' ? (
        <InicioOficina
          resumen={resumen}
          contexto={contexto}
          navegar={navegar}
          acciones={accionesOperativas}
          alAbrirAgenda={AbrirAgenda}
          abrirProgramacion={abrirProgramacion}
        />
      ) : null}
      {nivel === 'REGION' || nivel === 'NACIONAL' ? (
        <InicioSuperior
          nivel={nivel}
          resumen={resumen}
          contexto={contexto}
          navegar={navegar}
        />
      ) : null}
    </div>
  );
}

function InicioEstablecimiento({ resumen, contexto, navegar }) {
  return (
    <>
      <section className="acciones-principales" aria-labelledby="acciones-establecimiento">
        <h2 id="acciones-establecimiento" className="titulo-seccion">Qué puede hacer ahora</h2>
        <div className="rejilla-acciones">
          {contexto.puedeBuscarPersonas ? (
            <button type="button" className="tarjeta-accion" onClick={() => navegar('buscar')}>
              <Icono nombre="lupa" />
              <span>
                <strong>Buscar persona</strong>
                <span>Consulte la información disponible de una persona.</span>
              </span>
            </button>
          ) : null}
          {contexto.puedeCrearReferencia ? (
            <button
              type="button"
              className="tarjeta-accion"
              onClick={() => navegar('referencia-nueva')}
            >
              <Icono nombre="documento" />
              <span>
                <strong>Nueva referencia</strong>
                <span>Registre y envíe una referencia a Atención Interdisciplinaria.</span>
              </span>
            </button>
          ) : null}
          {contexto.puedeConsultarReferencias ? (
            <button
              type="button"
              className="tarjeta-accion"
              onClick={() => navegar('referencias', { estado: '' })}
            >
              <Icono nombre="documento" />
              <span>
                <strong>Referencias del establecimiento</strong>
                <span>Consulte las referencias enviadas y su estado.</span>
              </span>
            </button>
          ) : null}
          {contexto.puedeConsultarPosibles ? (
            <button type="button" className="tarjeta-accion" onClick={() => navegar('posibles')}>
              <Icono nombre="personas" />
              <span>
                <strong>Posibles referencias</strong>
                <span>Revise situaciones detectadas que podrían necesitar referencia.</span>
              </span>
            </button>
          ) : null}
        </div>
      </section>
      <section aria-labelledby="indicadores-establecimiento">
        <h2 id="indicadores-establecimiento" className="titulo-seccion">
          Situación del establecimiento
        </h2>
        <div className="rejilla-inicio">
          <TarjetaIndicador
            icono="personas"
            titulo="Posibles referencias pendientes"
            indicador={resumen.posiblesReferencias}
            descripcion="Situaciones detectadas que aún no tienen referencia."
            accion={contexto.puedeConsultarPosibles ? () => navegar('posibles') : null}
            textoAccion="Ver posibles referencias"
          />
          <TarjetaIndicador
            icono="documento"
            titulo="Referencias del establecimiento"
            indicador={resumen.referencias}
            descripcion="Referencias registradas en el establecimiento."
            accion={contexto.puedeConsultarReferencias
              ? () => navegar('referencias', { estado: '' })
              : null}
            textoAccion="Ver referencias"
          />
          <TarjetaIndicador
            icono="aviso"
            titulo="Pendientes de revisión"
            indicador={resumen.referenciasPendientes}
            descripcion="Referencias de este establecimiento que esperan revisión."
            accion={contexto.puedeConsultarReferencias
              ? () => navegar('referencias', { estado: 'PENDIENTE_REVISION' })
              : null}
            textoAccion="Revisar referencias"
          />
          <TarjetaIndicador
            icono="carpeta"
            titulo="Con resultado"
            indicador={resumen.referenciasConResultado}
            descripcion="Admitidas a Atención Interdisciplinaria o que no la requieren."
            accion={contexto.puedeConsultarReferencias
              ? () => navegar('referencias', { estado: '' })
              : null}
            textoAccion="Ver referencias"
          />
        </div>
      </section>
    </>
  );
}

function InicioOficina({
  resumen,
  contexto,
  navegar,
  acciones,
  alAbrirAgenda,
  abrirProgramacion
}) {
  const sesionesDisponibles = resumen.proximasSesiones
    && resumen.proximasSesiones.disponibilidad === 'DISPONIBLE';
  const sesiones = sesionesDisponibles
    ? {
      disponibilidad: 'DISPONIBLE',
      cantidad: resumen.proximasSesiones.cantidad
    }
    : resumen.proximasSesiones;
  return (
    <div className="inicio-cuerpo">
      <div>
        <h2 className="titulo-seccion">Actividad de la Oficina Local</h2>
        <div className="rejilla-inicio">
          <TarjetaIndicador
            icono="personas"
            titulo="Posibles referencias"
            indicador={resumen.posiblesReferencias}
            descripcion="Situaciones detectadas que podrían necesitar atención interdisciplinaria."
            accion={contexto.puedeConsultarPosibles ? () => navegar('posibles') : null}
            textoAccion="Ver posibles referencias"
          />
          <TarjetaIndicador
            icono="documento"
            titulo="Referencias pendientes"
            indicador={resumen.referenciasPendientes}
            descripcion="Referencias que necesitan análisis del Equipo Interdisciplinario."
            accion={contexto.puedeConsultarReferencias
              ? () => navegar('referencias', { estado: 'PENDIENTE_REVISION' })
              : null}
            textoAccion="Revisar referencias"
          />
          <TarjetaIndicador
            icono="carpeta"
            titulo="Casos activos"
            indicador={resumen.casosActivos}
            descripcion="Casos con Atención Interdisciplinaria en curso."
            accion={contexto.puedeVerCasosOficina
              ? () => navegar('casos', { estado: 'ACTIVO' })
              : null}
            textoAccion="Ver casos"
          />
          <TarjetaIndicador
            icono="calendario"
            titulo="Sesiones próximas"
            indicador={sesiones}
            descripcion="Sesiones registradas a partir de hoy. No incluye fechas anteriores."
            accion={contexto.puedeGestionarSesiones ? () => navegar('sesiones') : null}
            textoAccion="Ver sesiones"
          />
          <TarjetaIndicador
            icono="aviso"
            titulo="Actividades vencidas"
            indicador={resumen.actividadesVencidas}
            descripcion="Actividades cuya fecha programada ya pasó."
            accion={abrirProgramacion}
            textoAccion="Revisar programación"
          />
          <TarjetaIndicador
            icono="corazon"
            titulo="Atenciones individuales"
            indicador={resumen.atencionesRegistradas}
            descripcion={DescripcionAtenciones(resumen.atencionesRegistradas)}
            accion={contexto.puedeRegistrarAtencion || contexto.puedeConsultarSeguimiento
              ? () => navegar('atenciones')
              : null}
            textoAccion="Ver atenciones"
          />
        </div>
      </div>
      <div className="columna-lateral">
        <PanelAgenda agenda={resumen.agendaHoy} alAbrir={alAbrirAgenda} />
        <PanelAcciones titulo="Próximas acciones" acciones={acciones} />
        <Seguimientos resumen={resumen} navegar={navegar} />
      </div>
    </div>
  );
}

function Seguimientos({ resumen, navegar }) {
  const lista = resumen.proximasAcciones;
  if (!lista || lista.disponibilidad !== 'DISPONIBLE' || !lista.items || lista.items.length === 0) {
    return null;
  }
  return (
    <section className="panel panel-lateral" aria-labelledby="seguimientos-inicio">
      <h2 id="seguimientos-inicio">Seguimientos registrados</h2>
      <ul className="lista-agenda">
        {lista.items.map((item) => (
          <li key={`${item.casoId}-${item.fecha}`}>
            <button
              type="button"
              className="fila-agenda"
              onClick={() => navegar('casos', { casoId: item.casoId, estado: 'ACTIVO' })}
            >
              <span className="hora-agenda">{item.fecha}</span>
              <span>
                <strong>Caso {item.casoId}</strong>
                <span className="detalle-agenda">{item.accion}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function InicioSuperior({ nivel, resumen, contexto, navegar }) {
  const puedeCasos = contexto.puedeVerCasosRegion || contexto.puedeVerCasosNacional;
  const tituloDistribucion = nivel === 'NACIONAL'
    ? 'Actividad por región'
    : 'Actividad por Oficina Local';
  return (
    <>
      <h2 className="titulo-seccion">
        {nivel === 'NACIONAL' ? 'Indicadores nacionales' : 'Indicadores de la región'}
      </h2>
      <div className="rejilla-inicio">
        <TarjetaIndicador
          icono="carpeta"
          titulo="Casos activos"
          indicador={resumen.casosActivos}
          descripcion="Casos vigentes del ámbito autorizado."
          accion={puedeCasos ? () => navegar('casos', { estado: 'ACTIVO' }) : null}
          textoAccion="Ver casos"
        />
        <TarjetaIndicador
          icono="documento"
          titulo="Referencias pendientes"
          indicador={resumen.referenciasPendientes}
          descripcion="Referencias que todavía requieren revisión."
          accion={null}
          textoAccion=""
        />
        <TarjetaIndicador
          icono="documento"
          titulo="Referencias registradas"
          indicador={resumen.referencias}
          descripcion="Referencias del ámbito, en cualquier estado."
          accion={null}
          textoAccion=""
        />
        <TarjetaIndicador
          icono="corazon"
          titulo="Atenciones individuales"
          indicador={resumen.atencionesRegistradas}
          descripcion={DescripcionAtenciones(resumen.atencionesRegistradas)}
          accion={null}
          textoAccion=""
        />
        <TarjetaIndicador
          icono="aviso"
          titulo="Actividades vencidas"
          indicador={resumen.actividadesVencidas}
          descripcion="Actividades que siguen programadas después de su fecha."
          accion={null}
          textoAccion=""
        />
      </div>
      <DistribucionTerritorial distribucion={resumen.distribucion} titulo={tituloDistribucion} />
      <PanelAcciones
        titulo="Consultas"
        acciones={[
          {
            titulo: 'Abrir reportería',
            visible: contexto.puedeConsultarReporteria,
            accion: () => navegar('reporteria')
          },
          {
            titulo: 'Ver casos',
            visible: puedeCasos,
            accion: () => navegar('casos', { estado: 'ACTIVO' })
          }
        ]}
      />
    </>
  );
}

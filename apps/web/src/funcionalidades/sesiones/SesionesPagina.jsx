/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-14.
 * Modificación: 2026-11-17. Contexto de Equipo Interdisciplinario.
 * HU-019. La sesión puede guardarse sin situaciones y recibirlas después.
 */
import { useEffect, useState } from 'react';
import { Aviso, Cargando, Campo, ResumenResultados, Vacio } from '../../componentes/interfaz';
import VistaDetalle, { SeccionDetalle } from '../../componentes/VistaDetalle';
import { SolicitarApi } from '../../servicios/cliente-api';
import SituacionTrabajo from './SituacionTrabajo';

const SESION_VACIA = {
  fecha: '',
  horaInicio: '',
  horaFin: '',
  lugar: '',
  disciplinas: []
};

function Alternar(lista, valor) {
  return lista.includes(valor) ? lista.filter((item) => item !== valor) : [...lista, valor];
}

const TAMANO_LISTA = 12;

function ListaSesiones({ sesiones, pagina, alCambiarPagina, alAbrir, seleccionada }) {
  const ordenadas = [...sesiones].sort((a, b) => (
    `${a.fecha} ${a.horaInicio}`.localeCompare(`${b.fecha} ${b.horaInicio}`, 'es')
  ));
  const paginas = Math.max(1, Math.ceil(ordenadas.length / TAMANO_LISTA));
  const actual = Math.min(pagina, paginas);
  const inicio = (actual - 1) * TAMANO_LISTA;
  const visibles = ordenadas.slice(inicio, inicio + TAMANO_LISTA);
  return (
    <>
      <ResumenResultados
        filtrados={ordenadas.length}
        pagina={actual}
        tamano={TAMANO_LISTA}
      />
      <div className="tabla-contenedor">
        <table className="tabla-sesiones">
          <caption>Sesiones de la Oficina Local</caption>
          <thead>
            <tr>
              <th scope="col">Fecha</th>
              <th scope="col">Horario</th>
              <th scope="col">Lugar</th>
              <th scope="col">Acción</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((item) => (
              <tr key={item.sesionId}>
                <td>{item.fecha}</td>
                <td>{item.horaInicio}–{item.horaFin}</td>
                <td>{item.lugar || 'Sin lugar'}</td>
                <td>
                  <button
                    type="button"
                    className="secundario"
                    aria-current={seleccionada === item.sesionId ? 'true' : undefined}
                    onClick={() => alAbrir(item.sesionId)}
                  >
                    Ver sesión
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {paginas > 1 ? (
        <div className="acciones">
          <button
            type="button"
            className="secundario"
            disabled={actual <= 1}
            onClick={() => alCambiarPagina(actual - 1)}
          >
            Página anterior
          </button>
          <p>{actual} de {paginas}</p>
          <button
            type="button"
            className="secundario"
            disabled={actual >= paginas}
            onClick={() => alCambiarPagina(actual + 1)}
          >
            Página siguiente
          </button>
        </div>
      ) : null}
    </>
  );
}

export default function SesionesPagina({
  direccionApi,
  identidad,
  parametros,
  solicitarApi = SolicitarApi
}) {
  const [catalogos, establecerCatalogos] = useState(null);
  const [sesiones, establecerSesiones] = useState([]);
  const [avisoLista, establecerAvisoLista] = useState('');
  const [sesion, establecerSesion] = useState(null);
  const [formulario, establecerFormulario] = useState(SESION_VACIA);
  const [elegido, establecerElegido] = useState(
    parametros.referenciaId
      ? {
        tipo: 'referencia',
        id: Number(parametros.referenciaId),
        texto: `Referencia ${parametros.referenciaId}`
      }
      : null
  );
  const [busqueda, establecerBusqueda] = useState('');
  const [candidatos, establecerCandidatos] = useState([]);
  const [error, establecerError] = useState('');
  const [mensaje, establecerMensaje] = useState('');
  const [cargando, establecerCargando] = useState(true);
  const [creando, establecerCreando] = useState(false);
  const [paginaLista, establecerPaginaLista] = useState(1);

  async function RecargarSesion(sesionId) {
    establecerSesion(await solicitarApi(direccionApi, `/api/proceso/sesiones/${sesionId}`, { identidad }));
  }

  useEffect(() => {
    let vigente = true;
    Promise.all([
      solicitarApi(direccionApi, '/api/proceso/catalogos', { identidad }),
      solicitarApi(direccionApi, '/api/proceso/sesiones', { identidad })
    ]).then(async ([catalogo, lista]) => {
      if (!vigente) {
        return;
      }
      establecerCatalogos(catalogo);
      establecerSesiones(lista.disponibilidad === 'BLOQUEADO' ? [] : (lista.items || []));
      establecerAvisoLista(lista.disponibilidad === 'BLOQUEADO' ? lista.motivo : '');
      if (parametros.sesionId) {
        establecerSesion(await solicitarApi(
          direccionApi,
          `/api/proceso/sesiones/${parametros.sesionId}`,
          { identidad }
        ));
      }
      establecerCargando(false);
    }).catch((fallo) => {
      if (vigente) {
        establecerError(fallo.message);
        establecerCargando(false);
      }
    });
    return () => {
      vigente = false;
    };
  }, [direccionApi, identidad, parametros.sesionId, solicitarApi]);

  async function Crear(evento) {
    evento.preventDefault();
    establecerError('');
    try {
      const creada = await solicitarApi(direccionApi, '/api/proceso/sesiones', {
        identidad,
        metodo: 'POST',
        json: formulario
      });
      establecerMensaje(creada.advertencia || 'Sesión registrada.');
      establecerCreando(false);
      establecerFormulario(SESION_VACIA);
      const lista = await solicitarApi(direccionApi, '/api/proceso/sesiones', { identidad });
      establecerSesiones(lista.items || []);
      establecerSesion(null);
    } catch (fallo) {
      establecerError(fallo.message);
    }
  }

  async function BuscarCandidatos(evento) {
    evento.preventDefault();
    establecerError('');
    const criterio = busqueda.trim();
    const porNombre = criterio.includes(' ');
    const parametro = porNombre ? 'name' : 'identification';
    try {
      const [referencias, casos] = await Promise.all([
        solicitarApi(
          direccionApi,
          `/api/references?status=PENDIENTE_REVISION&${parametro}=${encodeURIComponent(criterio)}`,
          { identidad }
        ),
        solicitarApi(
          direccionApi,
          `/api/proceso/casos?${porNombre ? 'nombre' : 'identificacion'}=${encodeURIComponent(criterio)}&estado=ACTIVO`,
          { identidad }
        )
      ]);
      const encontrados = [
        ...(referencias.result?.items || []).map((item) => ({
          tipo: 'referencia',
          id: item.referenceId,
          texto: `${item.consecutive} — ${item.person.fullName || item.person.personId}`
        })),
        ...(casos.items || []).map((item) => ({
          tipo: 'caso',
          id: item.casoId,
          texto: `Caso ${item.casoId} — ${item.nombre || item.identificacion}`
        }))
      ];
      establecerCandidatos(encontrados);
      if (encontrados.length === 0) {
        establecerMensaje('No hay referencias pendientes ni casos activos con ese criterio.');
      }
    } catch (fallo) {
      establecerError(fallo.message);
    }
  }

  async function Asociar(evento) {
    evento.preventDefault();
    establecerError('');
    if (!elegido) {
      establecerError('Seleccione una referencia o un caso de la búsqueda.');
      return;
    }
    const cuerpo = elegido.tipo === 'caso'
      ? { casoId: Number(elegido.id) }
      : { referenciaId: Number(elegido.id) };
    try {
      await solicitarApi(direccionApi, `/api/proceso/sesiones/${sesion.sesionId}/situaciones`, {
        identidad,
        metodo: 'POST',
        json: cuerpo
      });
      await RecargarSesion(sesion.sesionId);
      establecerMensaje('Situación asociada.');
    } catch (fallo) {
      establecerError(fallo.message);
    }
  }

  if (cargando) {
    return <Cargando texto="Cargando sesiones." />;
  }
  if (sesion) {
    return (
      <VistaDetalle
        titulo={`Sesión del ${sesion.fecha || ''}`}
        subtitulo={sesion.lugar || 'Sin lugar registrado'}
        etiquetaVolver="Volver a sesiones"
        alVolver={() => establecerSesion(null)}
      >
        {error ? <Aviso>{error}</Aviso> : null}
        {mensaje ? <Aviso tipo="ok">{mensaje}</Aviso> : null}
        <SeccionDetalle titulo="Datos de la sesión">
          <p>
            Fecha: {sesion.fecha}. Horario: {sesion.horaInicio}–{sesion.horaFin}.
          </p>
          <p>
            Disciplinas: {sesion.disciplinas.map((item) => item.etiqueta).join(', ')
              || 'Sin disciplinas registradas.'}
          </p>
        </SeccionDetalle>
        <SeccionDetalle titulo="Situaciones por analizar">
          <form onSubmit={BuscarCandidatos}>
            <Campo id="buscar-situacion" etiqueta="Buscar por identificación o nombre">
              <input
                id="buscar-situacion"
                value={busqueda}
                onChange={(evento) => establecerBusqueda(evento.target.value)}
              />
            </Campo>
            <button type="submit" className="secundario">Buscar en el ámbito</button>
          </form>
          {candidatos.length > 0 ? (
            <ul>
              {candidatos.map((candidato) => (
                <li key={`${candidato.tipo}-${candidato.id}`}>
                  <button
                    type="button"
                    className="secundario"
                    onClick={() => establecerElegido(candidato)}
                  >
                    {candidato.texto}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <form onSubmit={Asociar}>
            <p>
              {elegido
                ? `Seleccionado: ${elegido.texto}`
                : 'Busque y seleccione una referencia pendiente o un caso activo.'}
            </p>
            <button type="submit" disabled={!elegido}>Asociar a la sesión</button>
          </form>
          {sesion.situaciones.length === 0
            ? <Vacio texto="La sesión todavía no tiene situaciones." />
            : null}
          {sesion.situaciones.map((situacion) => (
            <SituacionTrabajo
              key={situacion.situacionId}
              direccionApi={direccionApi}
              identidad={identidad}
              sesionId={sesion.sesionId}
              situacion={situacion}
              catalogos={catalogos}
              solicitarApi={solicitarApi}
              alInformar={establecerMensaje}
            />
          ))}
        </SeccionDetalle>
      </VistaDetalle>
    );
  }
  return (
    <>
      <p className="contexto">Equipo interdisciplinario</p>
      <div className="encabezado-reporteria">
        <div>
          <h1>Sesiones interdisciplinarias</h1>
          <p className="introduccion">
            Organice las reuniones del equipo y consulte las situaciones que se analizarán.
          </p>
        </div>
        <button type="button" onClick={() => establecerCreando(true)}>Nueva sesión</button>
      </div>
      {error ? <Aviso>{error}</Aviso> : null}
      {mensaje ? <Aviso tipo="ok">{mensaje}</Aviso> : null}
      {catalogos && catalogos.disciplinas.disponibilidad !== 'DISPONIBLE'
        ? <Aviso tipo="pendiente">{catalogos.disciplinas.mensaje}</Aviso>
        : null}
      {creando ? (
      <form onSubmit={Crear}>
        <h2>Nueva sesión</h2>
        <Campo id="fecha-sesion" etiqueta="Fecha">
          <input id="fecha-sesion" type="date" required value={formulario.fecha} onChange={(evento) => establecerFormulario({ ...formulario, fecha: evento.target.value })} />
        </Campo>
        <Campo id="hora-inicio" etiqueta="Hora de inicio">
          <input id="hora-inicio" type="time" required value={formulario.horaInicio} onChange={(evento) => establecerFormulario({ ...formulario, horaInicio: evento.target.value })} />
        </Campo>
        <Campo id="hora-fin" etiqueta="Hora de finalización">
          <input id="hora-fin" type="time" required value={formulario.horaFin} onChange={(evento) => establecerFormulario({ ...formulario, horaFin: evento.target.value })} />
        </Campo>
        <Campo id="lugar-sesion" etiqueta="Lugar">
          <input id="lugar-sesion" value={formulario.lugar} onChange={(evento) => establecerFormulario({ ...formulario, lugar: evento.target.value })} />
        </Campo>
        <fieldset>
          <legend>Disciplinas participantes</legend>
          {((catalogos && catalogos.disciplinas.items) || []).map((item) => (
            <label key={item.itemId}>
              <input
                type="checkbox"
                checked={formulario.disciplinas.includes(item.itemId)}
                onChange={() => establecerFormulario({
                  ...formulario,
                  disciplinas: Alternar(formulario.disciplinas, item.itemId)
                })}
              />
              {item.etiqueta}
            </label>
          ))}
        </fieldset>
        <div className="acciones">
          <button type="submit">Guardar sesión</button>
          <button type="button" className="secundario" onClick={() => establecerCreando(false)}>
            Cancelar
          </button>
        </div>
      </form>
      ) : null}
      {avisoLista ? <Aviso tipo="pendiente">{avisoLista}</Aviso> : null}
      {!error && !avisoLista && sesiones.length === 0 ? (
        <Vacio texto="No hay sesiones en esta Oficina Local." />
      ) : sesiones.length > 0 ? (
        <ListaSesiones
          sesiones={sesiones}
          pagina={paginaLista}
          alCambiarPagina={establecerPaginaLista}
          alAbrir={(sesionId) => RecargarSesion(sesionId).catch((fallo) => {
            establecerError(fallo.message);
          })}
        />
      ) : null}
    </>
  );
}

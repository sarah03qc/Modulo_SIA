/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-14.
 * HU-019. La sesión puede guardarse sin situaciones y recibirlas después.
 */
import { useEffect, useState } from 'react';
import { Aviso, Cargando, Campo, Vacio } from '../../componentes/interfaz';
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
  const [referenciaId, establecerReferenciaId] = useState(
    parametros.referenciaId ? String(parametros.referenciaId) : ''
  );
  const [casoId, establecerCasoId] = useState('');
  const [busqueda, establecerBusqueda] = useState('');
  const [candidatos, establecerCandidatos] = useState([]);
  const [error, establecerError] = useState('');
  const [mensaje, establecerMensaje] = useState('');
  const [cargando, establecerCargando] = useState(true);

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
      const lista = await solicitarApi(direccionApi, '/api/proceso/sesiones', { identidad });
      establecerSesiones(lista.items || []);
      await RecargarSesion(creada.sesionId);
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
    const cuerpo = casoId ? { casoId: Number(casoId) } : { referenciaId: Number(referenciaId) };
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
  return (
    <>
      <h1>Sesiones interdisciplinarias</h1>
      {error ? <Aviso>{error}</Aviso> : null}
      {mensaje ? <Aviso tipo="ok">{mensaje}</Aviso> : null}
      {catalogos && catalogos.disciplinas.disponibilidad !== 'DISPONIBLE'
        ? <Aviso tipo="pendiente">{catalogos.disciplinas.mensaje}</Aviso>
        : null}
      <form onSubmit={Crear}>
        <h2>Registrar sesión</h2>
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
        <button type="submit">Guardar sesión</button>
      </form>
      {avisoLista ? <Aviso tipo="pendiente">{avisoLista}</Aviso> : null}
      {!error && !avisoLista && sesiones.length === 0 ? (
        <Vacio texto="No hay sesiones en esta Oficina Local." />
      ) : sesiones.length > 0 ? (
        <ul>
          {sesiones.map((item) => (
            <li key={item.sesionId}>
              <button
                type="button"
                className="secundario"
                onClick={() => RecargarSesion(item.sesionId).catch((fallo) => {
                  establecerError(fallo.message);
                })}
              >
                {item.fecha} {item.horaInicio}–{item.horaFin} {item.lugar || 'Sin lugar'}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {sesion ? (
        <section className="panel" aria-labelledby="titulo-sesion">
          <h2 id="titulo-sesion">Sesión {sesion.sesionId}</h2>
          <p>
            Disciplinas: {sesion.disciplinas.map((item) => item.etiqueta).join(', ')
              || 'Sin disciplinas registradas.'}
          </p>
          <form onSubmit={BuscarCandidatos}>
            <Campo id="buscar-situacion" etiqueta="Buscar por identificación o nombre">
              <input id="buscar-situacion" value={busqueda} onChange={(evento) => establecerBusqueda(evento.target.value)} />
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
                    onClick={() => {
                      if (candidato.tipo === 'referencia') {
                        establecerReferenciaId(String(candidato.id));
                        establecerCasoId('');
                      } else {
                        establecerCasoId(String(candidato.id));
                        establecerReferenciaId('');
                      }
                    }}
                  >
                    {candidato.texto}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <form onSubmit={Asociar}>
            <Campo id="asociar-referencia" etiqueta="Identificador de referencia pendiente">
              <input id="asociar-referencia" value={referenciaId} onChange={(evento) => { establecerReferenciaId(evento.target.value); establecerCasoId(''); }} />
            </Campo>
            <Campo id="asociar-caso" etiqueta="O identificador de caso activo para revalorar">
              <input id="asociar-caso" value={casoId} onChange={(evento) => { establecerCasoId(evento.target.value); establecerReferenciaId(''); }} />
            </Campo>
            <button type="submit">Asociar a la sesión</button>
          </form>
          {sesion.situaciones.length === 0 ? <Vacio texto="La sesión todavía no tiene situaciones." /> : null}
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
        </section>
      ) : null}
    </>
  );
}

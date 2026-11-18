/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * Modificación: 2026-11-17. Contexto de la vista y asistencia
 * Presente / Ausente.
 * HU-036 y HU-037. Una actividad grupal se guarda una sola vez.
 */
import { useEffect, useState } from 'react';
import { Aviso, Cargando, Campo, Vacio } from '../../componentes/interfaz';
import { SolicitarApi } from '../../servicios/cliente-api';

const INDIVIDUAL_VACIA = {
  casoId: '',
  fechaAtencion: '',
  disciplinaId: '',
  estrategiaId: '',
  acciones: '',
  recomendaciones: '',
  proximaAccion: '',
  fechaProxima: ''
};

const GRUPAL_VACIA = {
  fechaAtencion: '',
  tipoId: '',
  tema: '',
  lugar: '',
  acciones: '',
  recomendaciones: '',
  disciplinas: [],
  profesionales: '',
  participantes: []
};

function Alternar(lista, valor) {
  return lista.includes(valor) ? lista.filter((item) => item !== valor) : [...lista, valor];
}

export default function AtencionesPagina({
  direccionApi,
  identidad,
  solicitarApi = SolicitarApi
}) {
  const [catalogos, establecerCatalogos] = useState(null);
  const [individual, establecerIndividual] = useState(INDIVIDUAL_VACIA);
  const [grupal, establecerGrupal] = useState(GRUPAL_VACIA);
  const [busqueda, establecerBusqueda] = useState('');
  const [candidatos, establecerCandidatos] = useState([]);
  const [error, establecerError] = useState('');
  const [mensaje, establecerMensaje] = useState('');
  const [cargando, establecerCargando] = useState(true);

  useEffect(() => {
    let vigente = true;
    solicitarApi(direccionApi, '/api/atenciones/catalogos', { identidad })
      .then((datos) => {
        if (vigente) {
          establecerCatalogos(datos);
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
  }, [direccionApi, identidad, solicitarApi]);

  async function Buscar(evento) {
    evento.preventDefault();
    establecerError('');
    const criterio = busqueda.trim();
    const porNombre = criterio.includes(' ');
    try {
      const casos = await solicitarApi(
        direccionApi,
        `/api/proceso/casos?${porNombre ? 'nombre' : 'identificacion'}=${encodeURIComponent(criterio)}&estado=ACTIVO`,
        { identidad }
      );
      establecerCandidatos(casos.items || []);
      if ((casos.items || []).length === 0) {
        establecerMensaje('No hay casos activos con ese criterio.');
      }
    } catch (fallo) {
      establecerError(fallo.message);
    }
  }

  function AgregarParticipante(caso) {
    if (grupal.participantes.some((item) => item.casoId === caso.casoId)) {
      establecerMensaje('Esa persona ya está en la actividad.');
      return;
    }
    establecerGrupal({
      ...grupal,
      participantes: [
        ...grupal.participantes,
        {
          casoId: caso.casoId,
          texto: caso.nombre || caso.identificacion,
          asistio: true
        }
      ]
    });
  }

  async function GuardarIndividual(evento) {
    evento.preventDefault();
    establecerError('');
    try {
      const guardada = await solicitarApi(direccionApi, '/api/atenciones/individuales', {
        identidad,
        metodo: 'POST',
        json: {
          casoId: Number(individual.casoId),
          fechaAtencion: individual.fechaAtencion,
          disciplinaId: Number(individual.disciplinaId),
          estrategiaId: Number(individual.estrategiaId),
          acciones: individual.acciones,
          recomendaciones: individual.recomendaciones,
          proximaAccion: individual.proximaAccion,
          fechaProxima: individual.fechaProxima || null
        }
      });
      establecerMensaje(`Atención ${guardada.atencionId} registrada. La fecha de registro queda en el servidor.`);
      establecerIndividual(INDIVIDUAL_VACIA);
    } catch (fallo) {
      establecerError(fallo.message);
    }
  }

  async function GuardarGrupal(evento) {
    evento.preventDefault();
    establecerError('');
    try {
      const guardada = await solicitarApi(direccionApi, '/api/atenciones/grupales', {
        identidad,
        metodo: 'POST',
        json: {
          fechaAtencion: grupal.fechaAtencion,
          tipoId: Number(grupal.tipoId),
          tema: grupal.tema,
          lugar: grupal.lugar,
          acciones: grupal.acciones,
          recomendaciones: grupal.recomendaciones,
          disciplinas: grupal.disciplinas,
          profesionales: grupal.profesionales.split('\n').map((linea) => linea.trim()).filter(Boolean),
          participantes: grupal.participantes.map((item) => ({
            casoId: item.casoId,
            asistio: item.asistio
          }))
        }
      });
      establecerMensaje(
        `Actividad ${guardada.atencionGrupalId} registrada con ${guardada.participantes} participantes.`
      );
      establecerGrupal(GRUPAL_VACIA);
    } catch (fallo) {
      establecerError(fallo.message);
    }
  }

  if (cargando) {
    return <Cargando texto="Cargando catálogos de atención." />;
  }
  return (
    <>
      <p className="contexto">Atención y seguimiento</p>
      <h1>Atenciones</h1>
      {error ? <Aviso>{error}</Aviso> : null}
      {mensaje ? <Aviso tipo="ok">{mensaje}</Aviso> : null}
      <Aviso tipo="pendiente">
        La clasificación entre atención grupal de A.I. y sesiones educativas generales
        sigue pendiente de validación institucional. Esta pantalla no convierte una
        actividad educativa general en atención.
      </Aviso>
      <form onSubmit={Buscar}>
        <Campo id="buscar-caso-atencion" etiqueta="Buscar caso activo por identificación o nombre">
          <input
            id="buscar-caso-atencion"
            value={busqueda}
            onChange={(evento) => establecerBusqueda(evento.target.value)}
          />
        </Campo>
        <button type="submit" className="secundario">Buscar</button>
      </form>
      {candidatos.length === 0 ? <Vacio texto="Busque un caso activo para registrarlo." /> : (
        <ul>
          {candidatos.map((caso) => (
            <li key={caso.casoId}>
              <button type="button" className="secundario" onClick={() => establecerIndividual({
                ...individual,
                casoId: String(caso.casoId)
              })}
              >
                Usar en individual: {caso.nombre || caso.identificacion}
              </button>
              <button type="button" className="secundario" onClick={() => AgregarParticipante(caso)}>
                Agregar a la grupal
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={GuardarIndividual}>
        <h2>Atención individual</h2>
        <Campo id="caso-atencion" etiqueta="Caso activo">
          <input
            id="caso-atencion"
            required
            value={individual.casoId}
            onChange={(evento) => establecerIndividual({ ...individual, casoId: evento.target.value })}
          />
        </Campo>
        <Campo id="fecha-atencion" etiqueta="Fecha real de atención">
          <input
            id="fecha-atencion"
            type="date"
            required
            value={individual.fechaAtencion}
            onChange={(evento) => establecerIndividual({
              ...individual,
              fechaAtencion: evento.target.value
            })}
          />
        </Campo>
        <Campo id="disciplina-atencion" etiqueta="Disciplina">
          <select
            id="disciplina-atencion"
            required
            value={individual.disciplinaId}
            onChange={(evento) => establecerIndividual({
              ...individual,
              disciplinaId: evento.target.value
            })}
          >
            <option value="">Seleccione</option>
            {((catalogos && catalogos.disciplinas.items) || []).map((item) => (
              <option key={item.itemId} value={item.itemId}>{item.etiqueta}</option>
            ))}
          </select>
        </Campo>
        <Campo id="estrategia-atencion" etiqueta="Estrategia">
          <select
            id="estrategia-atencion"
            required
            value={individual.estrategiaId}
            onChange={(evento) => establecerIndividual({
              ...individual,
              estrategiaId: evento.target.value
            })}
          >
            <option value="">Seleccione</option>
            {((catalogos && catalogos.estrategias.items) || []).map((item) => (
              <option key={item.itemId} value={item.itemId}>{item.etiqueta}</option>
            ))}
          </select>
        </Campo>
        <Campo id="acciones-atencion" etiqueta="Acciones realizadas">
          <textarea
            id="acciones-atencion"
            required
            value={individual.acciones}
            onChange={(evento) => establecerIndividual({ ...individual, acciones: evento.target.value })}
          />
        </Campo>
        <Campo id="recomendaciones-atencion" etiqueta="Recomendaciones">
          <textarea
            id="recomendaciones-atencion"
            required
            value={individual.recomendaciones}
            onChange={(evento) => establecerIndividual({
              ...individual,
              recomendaciones: evento.target.value
            })}
          />
        </Campo>
        <Campo id="proxima-atencion" etiqueta="Próxima acción, si corresponde">
          <input
            id="proxima-atencion"
            value={individual.proximaAccion}
            onChange={(evento) => establecerIndividual({
              ...individual,
              proximaAccion: evento.target.value
            })}
          />
        </Campo>
        <Campo id="fecha-proxima" etiqueta="Fecha de la próxima acción, si corresponde">
          <input
            id="fecha-proxima"
            type="date"
            value={individual.fechaProxima}
            onChange={(evento) => establecerIndividual({
              ...individual,
              fechaProxima: evento.target.value
            })}
          />
        </Campo>
        <button type="submit">Registrar atención individual</button>
      </form>
      <form onSubmit={GuardarGrupal}>
        <h2>Atención grupal</h2>
        <Campo id="fecha-grupal" etiqueta="Fecha real de la actividad">
          <input
            id="fecha-grupal"
            type="date"
            required
            value={grupal.fechaAtencion}
            onChange={(evento) => establecerGrupal({ ...grupal, fechaAtencion: evento.target.value })}
          />
        </Campo>
        <Campo id="tipo-grupal" etiqueta="Tipo vigente">
          <select
            id="tipo-grupal"
            required
            value={grupal.tipoId}
            onChange={(evento) => establecerGrupal({ ...grupal, tipoId: evento.target.value })}
          >
            <option value="">Seleccione</option>
            {((catalogos && catalogos.tipos.items) || []).map((item) => (
              <option key={item.itemId} value={item.itemId}>{item.etiqueta}</option>
            ))}
          </select>
        </Campo>
        {catalogos && catalogos.tipos.disponibilidad !== 'DISPONIBLE'
          ? <Aviso tipo="pendiente">{catalogos.tipos.mensaje}</Aviso>
          : null}
        <Campo id="tema-grupal" etiqueta="Tema u objetivo">
          <input
            id="tema-grupal"
            required
            value={grupal.tema}
            onChange={(evento) => establecerGrupal({ ...grupal, tema: evento.target.value })}
          />
        </Campo>
        <Campo id="lugar-grupal" etiqueta="Lugar">
          <input
            id="lugar-grupal"
            value={grupal.lugar}
            onChange={(evento) => establecerGrupal({ ...grupal, lugar: evento.target.value })}
          />
        </Campo>
        <fieldset>
          <legend>Disciplinas</legend>
          {((catalogos && catalogos.disciplinas.items) || []).map((item) => (
            <label key={`grupal-${item.itemId}`}>
              <input
                type="checkbox"
                checked={grupal.disciplinas.includes(item.itemId)}
                onChange={() => establecerGrupal({
                  ...grupal,
                  disciplinas: Alternar(grupal.disciplinas, item.itemId)
                })}
              />
              {item.etiqueta}
            </label>
          ))}
        </fieldset>
        <Campo id="profesionales-grupal" etiqueta="Otros profesionales declarados, uno por línea">
          <textarea
            id="profesionales-grupal"
            value={grupal.profesionales}
            onChange={(evento) => establecerGrupal({ ...grupal, profesionales: evento.target.value })}
          />
        </Campo>
        <p>La sesión actual queda como profesional responsable. No hay directorio institucional.</p>
        <Campo id="acciones-grupal" etiqueta="Acciones">
          <textarea
            id="acciones-grupal"
            required
            value={grupal.acciones}
            onChange={(evento) => establecerGrupal({ ...grupal, acciones: evento.target.value })}
          />
        </Campo>
        <Campo id="recomendaciones-grupal" etiqueta="Recomendaciones">
          <textarea
            id="recomendaciones-grupal"
            required
            value={grupal.recomendaciones}
            onChange={(evento) => establecerGrupal({
              ...grupal,
              recomendaciones: evento.target.value
            })}
          />
        </Campo>
        <h3>Participantes</h3>
        {grupal.participantes.length === 0 ? <Vacio texto="Agregue participantes desde la búsqueda." /> : (
          <ul>
            {grupal.participantes.map((item) => (
              <li key={item.casoId}>
                {item.texto}
                <label>
                  <input
                    type="checkbox"
                    checked={item.asistio}
                    onChange={(evento) => establecerGrupal({
                      ...grupal,
                      participantes: grupal.participantes.map((actual) => (
                        actual.casoId === item.casoId
                          ? { ...actual, asistio: evento.target.checked }
                          : actual
                      ))
                    })}
                  />
                  {item.asistio ? 'Presente' : 'Ausente'}
                </label>
              </li>
            ))}
          </ul>
        )}
        <button type="submit">Registrar actividad grupal</button>
      </form>
    </>
  );
}

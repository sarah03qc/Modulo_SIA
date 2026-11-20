/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * Modificación: 2026-11-18. Paneles individuales y grupales, uno a la vez.
 * Modificación: 2026-11-17. Contexto de la vista y asistencia
 * Presente / Ausente.
 * Modificación: 2026-11-18. Caso seleccionado de solo lectura con «Buscar caso
 * activo» y «Cambiar caso», contexto casoId, participantes por búsqueda y
 * especificación obligatoria de la estrategia «Otra».
 * HU-036 y HU-037. Una actividad grupal se guarda una sola vez.
 */
import { useEffect, useState } from 'react';
import {
  Aviso,
  Cargando,
  Campo,
  PanelPlegable,
  Vacio
} from '../../componentes/interfaz';
import { SolicitarApi } from '../../servicios/cliente-api';
import SelectorCasoActivo, { BuscarCasosActivos } from './SelectorCasoActivo';

const TEXTO_ESTRATEGIA_OTRA = 300;

const INDIVIDUAL_VACIA = {
  fechaAtencion: '',
  disciplinaId: '',
  estrategiaId: '',
  estrategiaOtraTexto: '',
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

function TieneDatos(actual, vacio) {
  return JSON.stringify(actual) !== JSON.stringify(vacio);
}

function TextoCaso(caso) {
  return caso.nombre || `Identificación ${caso.identificacion}`;
}

/**
 * Confirma en el módulo de atenciones que el caso sigue activo y autorizado.
 */
async function ConfirmarCasoActivo({ direccionApi, identidad, solicitarApi }, casoId) {
  return solicitarApi(
    direccionApi,
    `/api/atenciones/casos/${encodeURIComponent(casoId)}`,
    { identidad }
  );
}

export default function AtencionesPagina({
  direccionApi,
  identidad,
  parametros = {},
  solicitarApi = SolicitarApi
}) {
  const [catalogos, establecerCatalogos] = useState(null);
  const [individual, establecerIndividual] = useState(INDIVIDUAL_VACIA);
  const [grupal, establecerGrupal] = useState(GRUPAL_VACIA);
  const [casoSeleccionado, establecerCasoSeleccionado] = useState(null);
  const [cargandoCaso, establecerCargandoCaso] = useState(false);
  const [selector, establecerSelector] = useState(null);
  const [error, establecerError] = useState('');
  const [mensaje, establecerMensaje] = useState('');
  const [cargando, establecerCargando] = useState(true);
  const [modalidad, establecerModalidad] = useState('');
  const casoIdContexto = parametros && parametros.casoId ? String(parametros.casoId) : '';

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

  useEffect(() => {
    if (!casoIdContexto) {
      return undefined;
    }
    let vigente = true;
    const dependencias = { direccionApi, identidad, solicitarApi };
    establecerCargandoCaso(true);
    establecerError('');
    ConfirmarCasoActivo(dependencias, casoIdContexto)
      .then(async (caso) => {
        let nombre = null;
        try {
          const resultado = await BuscarCasosActivos({
            ...dependencias,
            modo: 'identificacion',
            criterio: caso.identificacion,
            tamano: 5
          });
          const coincidente = resultado.items.find((item) => item.casoId === caso.casoId);
          nombre = coincidente ? coincidente.nombre : null;
        } catch {
          nombre = null;
        }
        if (vigente) {
          establecerCasoSeleccionado({ ...caso, nombre });
          establecerModalidad('individual');
        }
      })
      .catch((fallo) => {
        if (vigente) {
          establecerError(`No se pudo usar el caso indicado. ${fallo.message}`);
        }
      })
      .finally(() => {
        if (vigente) {
          establecerCargandoCaso(false);
        }
      });
    return () => {
      vigente = false;
    };
  }, [casoIdContexto, direccionApi, identidad, solicitarApi]);

  async function SeleccionarCaso(caso) {
    const confirmado = await ConfirmarCasoActivo(
      { direccionApi, identidad, solicitarApi },
      caso.casoId
    );
    establecerCasoSeleccionado({ ...confirmado, nombre: caso.nombre || null });
    establecerSelector(null);
    establecerMensaje('');
    establecerModalidad('individual');
  }

  async function AgregarParticipante(caso) {
    if (grupal.participantes.some((item) => item.casoId === caso.casoId)) {
      throw new Error('Esa persona ya está en la actividad.');
    }
    const confirmado = await ConfirmarCasoActivo(
      { direccionApi, identidad, solicitarApi },
      caso.casoId
    );
    establecerGrupal((actual) => ({
      ...actual,
      participantes: [
        ...actual.participantes,
        {
          casoId: confirmado.casoId,
          texto: `${TextoCaso({ ...confirmado, nombre: caso.nombre })} — Caso ${confirmado.casoId}`,
          asistio: true
        }
      ]
    }));
    establecerSelector(null);
  }

  function QuitarParticipante(casoId) {
    establecerGrupal({
      ...grupal,
      participantes: grupal.participantes.filter((item) => item.casoId !== casoId)
    });
  }

  const estrategias = (catalogos && catalogos.estrategias && catalogos.estrategias.items) || [];
  const disciplinas = (catalogos && catalogos.disciplinas && catalogos.disciplinas.items) || [];
  const estrategiaElegida = estrategias.find(
    (item) => String(item.itemId) === String(individual.estrategiaId)
  );
  const exigeTextoEstrategia = Boolean(estrategiaElegida && estrategiaElegida.requiereTexto);

  async function GuardarIndividual(evento) {
    evento.preventDefault();
    establecerError('');
    if (!casoSeleccionado) {
      establecerError('Seleccione un caso activo antes de registrar la atención.');
      return;
    }
    try {
      await solicitarApi(direccionApi, '/api/atenciones/individuales', {
        identidad,
        metodo: 'POST',
        json: {
          casoId: casoSeleccionado.casoId,
          fechaAtencion: individual.fechaAtencion,
          disciplinaId: Number(individual.disciplinaId),
          estrategiaId: Number(individual.estrategiaId),
          estrategiaOtraTexto: exigeTextoEstrategia
            ? individual.estrategiaOtraTexto.trim()
            : null,
          acciones: individual.acciones,
          recomendaciones: individual.recomendaciones,
          proximaAccion: individual.proximaAccion,
          fechaProxima: individual.fechaProxima || null
        }
      });
      establecerMensaje('La atención individual quedó registrada.');
      establecerModalidad('');
      establecerIndividual(INDIVIDUAL_VACIA);
    } catch (fallo) {
      establecerError(fallo.message);
    }
  }

  async function GuardarGrupal(evento) {
    evento.preventDefault();
    establecerError('');
    if (grupal.participantes.length === 0) {
      establecerError('Agregue al menos un participante con «Agregar participante».');
      return;
    }
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
          profesionales: grupal.profesionales
            .split('\n')
            .map((linea) => linea.trim())
            .filter(Boolean),
          participantes: grupal.participantes.map((item) => ({
            casoId: item.casoId,
            asistio: item.asistio
          }))
        }
      });
      establecerMensaje(
        `La actividad grupal quedó registrada, con ${guardada.participantes} participantes.`
      );
      establecerModalidad('');
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
      <p className="introduccion">
        Registre la atención de un caso. Una actividad educativa general no se guarda aquí.
      </p>
      <section className="panel" aria-labelledby="titulo-caso-seleccionado">
        <h2 id="titulo-caso-seleccionado">Caso para la atención individual</h2>
        {cargandoCaso ? <Cargando texto="Confirmando el caso indicado." /> : null}
        {!cargandoCaso && casoSeleccionado ? (
          <>
            <p className="caso-seleccionado" aria-live="polite">
              <strong>Caso seleccionado</strong>
              {` — ${TextoCaso(casoSeleccionado)} — Caso ${casoSeleccionado.casoId}`}
            </p>
            <p>
              Identificación {casoSeleccionado.identificacion}
              {casoSeleccionado.establecimientoId
                ? ` · Establecimiento ${casoSeleccionado.establecimientoId}`
                : ''}
              {' · Activo'}
            </p>
            <button
              type="button"
              className="secundario"
              onClick={() => establecerSelector('individual')}
            >
              Cambiar caso
            </button>
          </>
        ) : null}
        {!cargandoCaso && !casoSeleccionado ? (
          <>
            <Vacio texto="Todavía no hay un caso seleccionado." />
            <button type="button" onClick={() => establecerSelector('individual')}>
              Buscar caso activo
            </button>
          </>
        ) : null}
      </section>
      <PanelPlegable
        id="panel-atencion-individual"
        titulo="Registrar atención individual"
        abierto={modalidad === 'individual'}
        alAlternar={() => establecerModalidad(
          modalidad === 'individual' ? '' : 'individual'
        )}
      >
      {!casoSeleccionado ? (
        <Aviso tipo="pendiente">
          Seleccione un caso activo con «Buscar caso activo» para habilitar el registro.
        </Aviso>
      ) : null}
      <form onSubmit={GuardarIndividual}>
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
            {disciplinas.map((item) => (
              <option key={item.itemId} value={item.itemId}>{item.etiqueta}</option>
            ))}
          </select>
        </Campo>
        {catalogos && catalogos.disciplinas && catalogos.disciplinas.mensaje
          ? <Aviso tipo="pendiente">{catalogos.disciplinas.mensaje}</Aviso>
          : null}
        <Campo id="estrategia-atencion" etiqueta="Estrategia de intervención">
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
            {estrategias.map((item) => (
              <option key={item.itemId} value={item.itemId}>{item.etiqueta}</option>
            ))}
          </select>
        </Campo>
        {catalogos && catalogos.estrategias && catalogos.estrategias.mensaje
          ? <Aviso tipo="pendiente">{catalogos.estrategias.mensaje}</Aviso>
          : null}
        {exigeTextoEstrategia ? (
          <Campo id="estrategia-otra-atencion" etiqueta="Especifique la estrategia">
            <input
              id="estrategia-otra-atencion"
              required
              maxLength={TEXTO_ESTRATEGIA_OTRA}
              value={individual.estrategiaOtraTexto}
              onChange={(evento) => establecerIndividual({
                ...individual,
                estrategiaOtraTexto: evento.target.value
              })}
            />
          </Campo>
        ) : null}
        <Campo id="acciones-atencion" etiqueta="Acciones realizadas">
          <textarea
            id="acciones-atencion"
            required
            value={individual.acciones}
            onChange={(evento) => establecerIndividual({
              ...individual,
              acciones: evento.target.value
            })}
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
        <button type="submit" disabled={!casoSeleccionado}>
          Registrar atención individual
        </button>
      </form>
      </PanelPlegable>
      {modalidad !== 'individual' && TieneDatos(individual, INDIVIDUAL_VACIA) ? (
        <p className="ayuda">
          La atención individual conserva lo escrito. No se ha registrado.
        </p>
      ) : null}
      <PanelPlegable
        id="panel-atencion-grupal"
        titulo="Registrar atención grupal"
        abierto={modalidad === 'grupal'}
        alAlternar={() => establecerModalidad(
          modalidad === 'grupal' ? '' : 'grupal'
        )}
      >
      <form onSubmit={GuardarGrupal}>
        <Campo id="fecha-grupal" etiqueta="Fecha real de la actividad">
          <input
            id="fecha-grupal"
            type="date"
            required
            value={grupal.fechaAtencion}
            onChange={(evento) => establecerGrupal({
              ...grupal,
              fechaAtencion: evento.target.value
            })}
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
          {disciplinas.map((item) => (
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
        <Campo
          id="profesionales-grupal"
          etiqueta="Otros profesionales declarados, uno por línea"
        >
          <textarea
            id="profesionales-grupal"
            value={grupal.profesionales}
            onChange={(evento) => establecerGrupal({
              ...grupal,
              profesionales: evento.target.value
            })}
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
        {grupal.participantes.length === 0
          ? <Vacio texto="Agregue participantes con «Agregar participante»." />
          : (
            <ul className="lista-acciones" aria-label="Participantes de la actividad">
              {grupal.participantes.map((item) => (
                <li key={item.casoId}>
                  <span>{item.texto}</span>
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
                  <button
                    type="button"
                    className="secundario"
                    aria-label={`Quitar participante: ${item.texto}`}
                    onClick={() => QuitarParticipante(item.casoId)}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
        <div className="acciones">
          <button
            type="button"
            className="secundario"
            onClick={() => establecerSelector('grupal')}
          >
            Agregar participante
          </button>
          <button type="submit">Registrar actividad grupal</button>
        </div>
      </form>
      </PanelPlegable>
      {modalidad !== 'grupal' && TieneDatos(grupal, GRUPAL_VACIA) ? (
        <p className="ayuda">
          La atención grupal conserva lo escrito. No se ha registrado.
        </p>
      ) : null}
      {selector === 'individual' ? (
        <SelectorCasoActivo
          titulo="Buscar caso activo"
          etiquetaAccion="Seleccionar caso"
          direccionApi={direccionApi}
          identidad={identidad}
          solicitarApi={solicitarApi}
          alSeleccionar={SeleccionarCaso}
          alCerrar={() => establecerSelector(null)}
        />
      ) : null}
      {selector === 'grupal' ? (
        <SelectorCasoActivo
          titulo="Agregar participante"
          etiquetaAccion="Agregar"
          excluidos={grupal.participantes.map((item) => item.casoId)}
          direccionApi={direccionApi}
          identidad={identidad}
          solicitarApi={solicitarApi}
          alSeleccionar={AgregarParticipante}
          alCerrar={() => establecerSelector(null)}
        />
      ) : null}
    </>
  );
}

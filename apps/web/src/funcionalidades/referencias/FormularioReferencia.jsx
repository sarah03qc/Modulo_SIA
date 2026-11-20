/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-14.
 * Modificación: 2026-11-18. Orden de motivos según el catálogo.
 * Modificación: 2026-11-17. Etapas, grupos de motivo y nombres de campo.
 * Modificación: 2026-11-19. La confirmación de envío no deja el formulario activo.
 * HU-013 y HU-014. El envío exige revisión explícita. El consecutivo no se genera.
 */
import { useEffect, useState } from 'react';
import { Aviso, Cargando, Campo } from '../../componentes/interfaz';
import { DescargarArchivo, SolicitarApi } from '../../servicios/cliente-api';

const VACIO = {
  personId: '',
  referenceDate: '',
  attentionRouteCode: '',
  originCode: '',
  consecutive: '',
  motives: [],
  previousActions: '',
  previousResults: '',
  complementaryInformation: ''
};

const ETAPAS = [
  'Cliente/beneficiaria y trazabilidad',
  'Motivo',
  'Información complementaria',
  'Revisar'
];

const GRUPOS = [
  ['CRECIMIENTO', 'Crecimiento'],
  ['DESARROLLO', 'Desarrollo'],
  ['SALUD', 'Salud'],
  ['FACTORES_RIESGO', 'Factores de riesgo']
];

function Cuerpo(formulario, origen, version) {
  return {
    personId: formulario.personId.trim(),
    referenceDate: formulario.referenceDate,
    attentionRouteCode: formulario.attentionRouteCode,
    originCode: formulario.originCode,
    consecutive: formulario.consecutive.trim(),
    motives: formulario.motives,
    previousActions: formulario.previousActions,
    previousResults: formulario.previousResults,
    complementaryInformation: formulario.complementaryInformation,
    captureOrigin: origen,
    templateVersion: version
  };
}

function TextoTerritorio(unidad) {
  if (!unidad) {
    return 'No disponible';
  }
  return unidad.name || unidad.id || 'No disponible';
}

function MotivosDe(catalogos, codigo) {
  return (catalogos.motives || [])
    .filter((motivo) => motivo.category === codigo)
    .slice()
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
}

export default function FormularioReferencia({
  direccionApi,
  identidad,
  personIdInicial = '',
  posibleIdInicial = null,
  solicitarApi = SolicitarApi
}) {
  const [catalogos, establecerCatalogos] = useState(null);
  const [formulario, establecerFormulario] = useState({ ...VACIO, personId: personIdInicial });
  const [persona, establecerPersona] = useState(null);
  const [coincidencias, establecerCoincidencias] = useState(null);
  const [criterio, establecerCriterio] = useState(personIdInicial);
  const [paso, establecerPaso] = useState(0);
  const [revision, establecerRevision] = useState(null);
  const [confirmado, establecerConfirmado] = useState(false);
  const [enviada, establecerEnviada] = useState(false);
  const [borradores, establecerBorradores] = useState([]);
  const [borradorId, establecerBorradorId] = useState(null);
  const [mensaje, establecerMensaje] = useState('');
  const [error, establecerError] = useState('');
  const [origenCaptura, establecerOrigenCaptura] = useState('MANUAL');
  const [versionPlantilla, establecerVersionPlantilla] = useState(null);

  useEffect(() => {
    let vigente = true;
    Promise.all([
      solicitarApi(direccionApi, '/api/references/catalogs', { identidad }),
      solicitarApi(direccionApi, '/api/references/drafts', { identidad })
    ]).then(([catalogo, lista]) => {
      if (!vigente) {
        return;
      }
      establecerCatalogos(catalogo);
      establecerBorradores(lista.items || []);
    }).catch((fallo) => {
      if (vigente) {
        establecerError(fallo.message);
      }
    });
    return () => {
      vigente = false;
    };
  }, [direccionApi, identidad, solicitarApi]);

  function LimpiarRevision(cambio) {
    establecerRevision(null);
    establecerConfirmado(false);
    cambio();
  }

  function Actualizar(campo, valor) {
    LimpiarRevision(() => {
      establecerFormulario((actual) => ({ ...actual, [campo]: valor }));
    });
  }

  function AlternarMotivo(codigo) {
    LimpiarRevision(() => {
      establecerFormulario((actual) => {
        const existe = actual.motives.some((motivo) => motivo.code === codigo);
        return {
          ...actual,
          motives: existe
            ? actual.motives.filter((motivo) => motivo.code !== codigo)
            : [...actual.motives, { code: codigo, specification: '' }]
        };
      });
    });
  }

  function Especificar(codigo, texto) {
    LimpiarRevision(() => {
      establecerFormulario((actual) => ({
        ...actual,
        motives: actual.motives.map((motivo) => (
          motivo.code === codigo ? { ...motivo, specification: texto } : motivo
        ))
      }));
    });
  }

  function SeleccionarPersona(item) {
    LimpiarRevision(() => {
      establecerPersona(item);
      establecerFormulario((actual) => ({ ...actual, personId: item.personId }));
    });
  }

  async function BuscarPersona(evento) {
    evento.preventDefault();
    establecerError('');
    establecerCoincidencias(null);
    try {
      const datos = await solicitarApi(
        direccionApi,
        `/api/institutional/persons/search?q=${encodeURIComponent(criterio.trim())}`,
        { identidad }
      );
      establecerCoincidencias(datos.result || { items: [], returned: 0, total: 0 });
    } catch (fallo) {
      establecerError(fallo.message);
    }
  }

  function MensajeDeEtapa() {
    if (paso === 0) {
      if (!formulario.personId.trim()) {
        return 'Seleccione una persona válida antes de continuar.';
      }
      if (!formulario.referenceDate) {
        return 'Indique la fecha de la referencia.';
      }
      if (!formulario.attentionRouteCode) {
        return 'Seleccione la Vía de Atención.';
      }
      if (!formulario.originCode) {
        return 'Seleccione el origen.';
      }
      if (!formulario.consecutive.trim()) {
        return 'Digite el consecutivo institucional completo.';
      }
    }
    if (paso === 1 && formulario.motives.length === 0) {
      return 'Seleccione al menos un motivo del catálogo vigente.';
    }
    return '';
  }

  function Continuar() {
    const aviso = MensajeDeEtapa();
    if (aviso) {
      establecerError(aviso);
      return;
    }
    establecerError('');
    establecerPaso((actual) => Math.min(actual + 1, ETAPAS.length - 1));
  }

  function Retroceder() {
    establecerError('');
    establecerPaso((actual) => Math.max(actual - 1, 0));
  }

  async function Validar() {
    establecerError('');
    establecerMensaje('');
    try {
      const resultado = await solicitarApi(direccionApi, '/api/references/validation', {
        identidad,
        metodo: 'POST',
        json: Cuerpo(formulario, origenCaptura, versionPlantilla)
      });
      establecerRevision(resultado);
      if (!resultado.valid) {
        establecerError(resultado.message || 'La referencia no puede enviarse.');
      }
    } catch (fallo) {
      establecerRevision(null);
      establecerError(fallo.message);
    }
  }

  async function Enviar() {
    establecerError('');
    try {
      const enviado = await solicitarApi(direccionApi, '/api/references', {
        identidad,
        metodo: 'POST',
        json: {
          ...Cuerpo(formulario, origenCaptura, versionPlantilla),
          draftId: borradorId,
          posibleId: posibleIdInicial || undefined
        }
      });
      establecerMensaje(
        `Referencia enviada. Consecutivo ${enviado.consecutive}. Quedó pendiente de revisión.`
      );
      establecerRevision(null);
      establecerConfirmado(false);
      establecerEnviada(true);
    } catch (fallo) {
      establecerError(fallo.message);
    }
  }

  async function GuardarBorrador() {
    establecerError('');
    try {
      const guardado = await solicitarApi(direccionApi, '/api/references/drafts', {
        identidad,
        metodo: 'PUT',
        json: {
          draftId: borradorId,
          personId: formulario.personId || null,
          content: formulario
        }
      });
      establecerBorradorId(guardado.draftId);
      establecerMensaje('Borrador guardado. Todavía no es una referencia enviada.');
    } catch (fallo) {
      establecerError(fallo.message);
    }
  }

  async function DescargarPlantilla() {
    establecerError('');
    try {
      const archivo = await solicitarApi(direccionApi, '/api/references/template', {
        identidad,
        archivo: true
      });
      DescargarArchivo(archivo.blob, archivo.nombre);
    } catch (fallo) {
      establecerError(fallo.message);
    }
  }

  async function Precargar(evento) {
    const archivo = evento.target.files && evento.target.files[0];
    if (!archivo) {
      return;
    }
    establecerError('');
    try {
      const precarga = await solicitarApi(direccionApi, '/api/references/template', {
        identidad,
        metodo: 'POST',
        cuerpo: await archivo.arrayBuffer(),
        encabezados: { 'Content-Type': 'application/octet-stream' }
      });
      establecerOrigenCaptura('PLANTILLA');
      establecerVersionPlantilla(precarga.templateVersion);
      establecerFormulario({
        ...VACIO,
        ...precarga.referral,
        motives: precarga.referral.motives || []
      });
      establecerPersona(null);
      establecerRevision(null);
      establecerConfirmado(false);
      establecerPaso(0);
      establecerMensaje('Plantilla precargada. Revise los datos y confirme el envío.');
      if (precarga.issues && precarga.issues.length > 0) {
        establecerError(precarga.issues.map((issue) => issue.message).join(' '));
      }
    } catch (fallo) {
      establecerError(fallo.message);
    }
  }

  function PrepararOtra() {
    establecerFormulario(VACIO);
    establecerPersona(null);
    establecerCriterio('');
    establecerCoincidencias(null);
    establecerRevision(null);
    establecerConfirmado(false);
    establecerBorradorId(null);
    establecerPaso(0);
    establecerMensaje('');
    establecerError('');
    establecerOrigenCaptura('MANUAL');
    establecerVersionPlantilla(null);
    establecerEnviada(false);
  }

  if (!catalogos && !error) {
    return <Cargando texto="Cargando el formulario." />;
  }

  if (enviada) {
    return (
      <>
        <p className="contexto">Detección y referencia</p>
        <h1>Nueva referencia</h1>
        <Aviso tipo="ok">{mensaje}</Aviso>
        <p>Puede volver a la bandeja o preparar otra referencia.</p>
        <button type="button" onClick={PrepararOtra}>Preparar otra referencia</button>
      </>
    );
  }

  const sinClasificar = (catalogos?.motives || []).filter(
    (motivo) => !GRUPOS.some(([codigo]) => codigo === motivo.category)
  );
  const items = coincidencias ? coincidencias.items || [] : [];
  const revisionDatos = revision && revision.review;

  return (
    <>
      <p className="contexto">Detección y referencia</p>
      <h1>Nueva referencia</h1>
      {posibleIdInicial ? (
        <Aviso tipo="pendiente">
          La persona viene de una posible referencia. El envío se confirma en la revisión
          y recién entonces se vincula la sugerencia.
        </Aviso>
      ) : null}
      {error ? <Aviso>{error}</Aviso> : null}
      {mensaje ? <Aviso tipo="ok">{mensaje}</Aviso> : null}
      <div className="acciones">
        <button type="button" className="secundario" onClick={DescargarPlantilla}>
          Descargar plantilla Excel
        </button>
      </div>
      <Campo id="archivo-plantilla" etiqueta="Cargar Excel estandarizado">
        <input
          id="archivo-plantilla"
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={Precargar}
        />
      </Campo>
      {borradores.length > 0 ? (
        <Campo id="borrador" etiqueta="Recuperar borrador">
          <select id="borrador" value={borradorId || ''} onChange={(evento) => {
            const id = Number(evento.target.value);
            const encontrado = borradores.find((item) => item.draftId === id);
            establecerBorradorId(id || null);
            if (encontrado && encontrado.content) {
              establecerFormulario({ ...VACIO, ...encontrado.content });
              establecerPersona(null);
              establecerRevision(null);
              establecerPaso(0);
            }
          }}>
            <option value="">Seleccione</option>
            {borradores.map((item) => (
              <option key={item.draftId} value={item.draftId}>
                {item.personId || 'Sin persona'} — {item.updatedAt}
              </option>
            ))}
          </select>
        </Campo>
      ) : null}
      <ol className="pasos">
        {ETAPAS.map((etiqueta, indice) => (
          <li key={etiqueta} aria-current={indice === paso ? 'step' : undefined}>
            {etiqueta}
          </li>
        ))}
      </ol>
      {paso === 0 ? (
        <section aria-labelledby="etapa-persona">
          <h2 id="etapa-persona">Cliente/beneficiaria y trazabilidad</h2>
          <form onSubmit={BuscarPersona}>
            <Campo id="buscar-referencia" etiqueta="Buscar por identificación o nombre">
              <input
                id="buscar-referencia"
                value={criterio}
                minLength={2}
                onChange={(evento) => establecerCriterio(evento.target.value)}
              />
            </Campo>
            <button type="submit" className="secundario">Buscar en el ámbito</button>
          </form>
          {coincidencias ? (
            <p>{coincidencias.returned} de {coincidencias.total}</p>
          ) : null}
          {items.length === 0 && coincidencias ? <p>No hay coincidencias en el ámbito autorizado.</p> : null}
          {items.length > 0 ? (
            <ul>
              {items.map((item) => (
                <li key={item.personId}>
                  <button type="button" className="secundario" onClick={() => SeleccionarPersona(item)}>
                    {item.fullName || 'Sin nombre disponible'} — {item.personId}
                    {item.establishment ? ` — ${TextoTerritorio(item.establishment)}` : ''}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <section className="panel" aria-label="Persona seleccionada">
            <h3>Persona seleccionada</h3>
            <p>Identificación: {formulario.personId || 'Sin selección'}</p>
            <p>Nombre: {persona && persona.fullName ? persona.fullName : 'No disponible'}</p>
            <p>Región: {persona ? TextoTerritorio(persona.region) : 'No disponible'}</p>
            <p>Oficina Local: {persona ? TextoTerritorio(persona.localOffice) : 'No disponible'}</p>
            <p>Establecimiento: {persona ? TextoTerritorio(persona.establishment) : 'No disponible'}</p>
          </section>
          <p>
            Quién realiza la referencia: {identidad}. Proviene de la sesión y no se edita.
          </p>
          <Campo id="fecha-referencia" etiqueta="Fecha de la referencia">
            <input
              id="fecha-referencia"
              type="date"
              required
              value={formulario.referenceDate}
              onChange={(evento) => Actualizar('referenceDate', evento.target.value)}
            />
          </Campo>
          <Campo id="via-referencia" etiqueta="Vía de Atención">
            <select
              id="via-referencia"
              required
              value={formulario.attentionRouteCode}
              onChange={(evento) => Actualizar('attentionRouteCode', evento.target.value)}
            >
              <option value="">Seleccione</option>
              {(catalogos?.attentionRoutes || []).map((item) => (
                <option key={item.code} value={item.code}>{item.label}</option>
              ))}
            </select>
          </Campo>
          <Campo id="origen-referencia" etiqueta="Origen">
            <select
              id="origen-referencia"
              required
              value={formulario.originCode}
              onChange={(evento) => Actualizar('originCode', evento.target.value)}
            >
              <option value="">Seleccione</option>
              {(catalogos?.origins || []).map((item) => (
                <option key={item.code} value={item.code}>{item.label}</option>
              ))}
            </select>
          </Campo>
          <Campo id="consecutivo" etiqueta="Consecutivo institucional">
            <input
              id="consecutivo"
              required
              value={formulario.consecutive}
              onChange={(evento) => Actualizar('consecutive', evento.target.value)}
            />
          </Campo>
        </section>
      ) : null}
      {paso === 1 && catalogos ? (
        <section aria-labelledby="etapa-motivo">
          <h2 id="etapa-motivo">Motivo</h2>
          {GRUPOS.map(([codigo, etiqueta]) => {
            const motivos = MotivosDe(catalogos, codigo);
            return (
              <fieldset key={codigo} className="grupo-motivo">
                <legend>{etiqueta}</legend>
                {motivos.length === 0 ? (
                  <p>
                    {codigo === 'FACTORES_RIESGO' && catalogos.riskFactors
                      ? catalogos.riskFactors.message
                      : 'No hay motivos vigentes en este grupo.'}
                  </p>
                ) : (
                  <div className="opciones-motivo">
                    {motivos.map((motivo) => {
                      const elegido = formulario.motives.find((item) => item.code === motivo.code);
                      return (
                        <div key={motivo.code}>
                          <label>
                            <input
                              type="checkbox"
                              checked={Boolean(elegido)}
                              onChange={() => AlternarMotivo(motivo.code)}
                            />
                            {motivo.label}
                          </label>
                          {elegido ? (
                            <Campo id={`detalle-${motivo.code}`} etiqueta="Detalle del factor (opcional)">
                              <input
                                id={`detalle-${motivo.code}`}
                                value={elegido.specification}
                                onChange={(evento) => Especificar(motivo.code, evento.target.value)}
                              />
                            </Campo>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </fieldset>
            );
          })}
          {sinClasificar.length > 0 ? (
            <fieldset className="grupo-motivo">
              <legend>Sin clasificación confirmada</legend>
              {sinClasificar.map((motivo) => (
                <label key={motivo.code}>
                  <input
                    type="checkbox"
                    checked={formulario.motives.some((item) => item.code === motivo.code)}
                    onChange={() => AlternarMotivo(motivo.code)}
                  />
                  {motivo.label}
                </label>
              ))}
            </fieldset>
          ) : null}
        </section>
      ) : null}
      {paso === 2 ? (
        <section aria-labelledby="etapa-complemento">
          <h2 id="etapa-complemento">
            Información complementaria asociada al motivo de referencia
          </h2>
          <Campo id="acciones-previas" etiqueta="Acciones realizadas previo a la referencia">
            <textarea
              id="acciones-previas"
              value={formulario.previousActions}
              onChange={(evento) => Actualizar('previousActions', evento.target.value)}
            />
          </Campo>
          <Campo id="resultados-previos" etiqueta="Resultados obtenidos previo a la referencia">
            <textarea
              id="resultados-previos"
              value={formulario.previousResults}
              onChange={(evento) => Actualizar('previousResults', evento.target.value)}
            />
          </Campo>
          <Campo
            id="informacion-complementaria"
            etiqueta="Información complementaria asociada al motivo de referencia"
          >
            <textarea
              id="informacion-complementaria"
              value={formulario.complementaryInformation}
              onChange={(evento) => Actualizar('complementaryInformation', evento.target.value)}
            />
          </Campo>
        </section>
      ) : null}
      {paso === 3 ? (
        <section className="panel" aria-labelledby="titulo-revision">
          <h2 id="titulo-revision">Revisar</h2>
          <article className="grupo-motivo">
            <h3>Datos de la persona</h3>
            <p>Identificación: {revisionDatos ? revisionDatos.person.personId : formulario.personId}</p>
            <p>
              Nombre: {revisionDatos
                ? revisionDatos.person.fullName || 'No disponible'
                : (persona && persona.fullName) || 'No disponible'}
            </p>
            {revisionDatos ? (
              <>
                <p>Fecha de nacimiento: {revisionDatos.person.birthDate || 'No disponible'}</p>
                <p>Edad: {revisionDatos.person.ageYears ?? 'No disponible'}</p>
                <p>Sexo: {revisionDatos.person.sex || 'No disponible'}</p>
                <p>Región: {TextoTerritorio(revisionDatos.territory.region)}</p>
                <p>Oficina Local: {TextoTerritorio(revisionDatos.territory.localOffice)}</p>
                <p>Establecimiento: {TextoTerritorio(revisionDatos.territory.establishment)}</p>
              </>
            ) : null}
          </article>
          <article className="grupo-motivo">
            <h3>Trazabilidad</h3>
            <p>Consecutivo: {revisionDatos ? revisionDatos.consecutive : formulario.consecutive}</p>
            <p>Fecha de la referencia: {formulario.referenceDate}</p>
            <p>Quién realiza la referencia: {identidad}. No es editable.</p>
            <p>
              Vía de Atención: {(catalogos?.attentionRoutes || []).find(
                (item) => item.code === formulario.attentionRouteCode
              )?.label || formulario.attentionRouteCode}
            </p>
            <p>
              Origen: {(catalogos?.origins || []).find(
                (item) => item.code === formulario.originCode
              )?.label || formulario.originCode}
            </p>
          </article>
          <article className="grupo-motivo">
            <h3>Motivos y detalle</h3>
            {GRUPOS.map(([codigo, etiqueta]) => {
              const elegidos = formulario.motives.filter((motivo) => (
                MotivosDe(catalogos || { motives: [] }, codigo).some((item) => item.code === motivo.code)
              ));
              if (elegidos.length === 0) {
                return null;
              }
              return (
                <div key={codigo}>
                  <h4>{etiqueta}</h4>
                  <ul>
                    {elegidos.map((motivo) => {
                      const catalogo = (catalogos?.motives || []).find((item) => item.code === motivo.code);
                      return (
                        <li key={motivo.code}>
                          {catalogo ? catalogo.label : motivo.code}
                          {motivo.specification ? ` — ${motivo.specification}` : ''}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </article>
          <article className="grupo-motivo">
            <h3>Información complementaria</h3>
            <p>Acciones realizadas previo a la referencia: {formulario.previousActions || 'No disponible'}</p>
            <p>Resultados obtenidos previo a la referencia: {formulario.previousResults || 'No disponible'}</p>
            <p>
              Información complementaria asociada al motivo de referencia:
              {' '}
              {formulario.complementaryInformation || 'No disponible'}
            </p>
          </article>
          {revision && revision.message ? <Aviso>{revision.message}</Aviso> : null}
          {revision && !revision.message ? <p>La validación no reservó el consecutivo.</p> : null}
          <label>
            <input
              type="checkbox"
              checked={confirmado}
              onChange={(evento) => establecerConfirmado(evento.target.checked)}
            />
            Confirmo el envío de esta referencia.
          </label>
          <div className="acciones">
            <button type="button" className="secundario" onClick={Validar}>
              Validar consecutivo y datos
            </button>
            <button
              type="button"
              disabled={!confirmado || !revision || !revision.valid}
              onClick={Enviar}
            >
              Confirmar y enviar referencia
            </button>
          </div>
        </section>
      ) : null}
      <div className="acciones">
        {paso > 0 ? (
          <button type="button" className="secundario" onClick={Retroceder}>Atrás</button>
        ) : null}
        {paso < ETAPAS.length - 1 ? (
          <button type="button" onClick={Continuar}>Continuar</button>
        ) : null}
        <button type="button" className="secundario" onClick={GuardarBorrador}>Guardar borrador</button>
      </div>
    </>
  );
}

/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-14.
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

export default function FormularioReferencia({
  direccionApi,
  identidad,
  personIdInicial = '',
  solicitarApi = SolicitarApi
}) {
  const [catalogos, establecerCatalogos] = useState(null);
  const [formulario, establecerFormulario] = useState({ ...VACIO, personId: personIdInicial });
  const [revision, establecerRevision] = useState(null);
  const [confirmado, establecerConfirmado] = useState(false);
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

  function Actualizar(campo, valor) {
    establecerRevision(null);
    establecerConfirmado(false);
    establecerFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  function AlternarMotivo(codigo) {
    establecerRevision(null);
    establecerFormulario((actual) => {
      const existe = actual.motives.some((motivo) => motivo.code === codigo);
      return {
        ...actual,
        motives: existe
          ? actual.motives.filter((motivo) => motivo.code !== codigo)
          : [...actual.motives, { code: codigo, specification: '' }]
      };
    });
  }

  async function Validar(evento) {
    evento.preventDefault();
    establecerError('');
    establecerMensaje('');
    try {
      const resultado = await solicitarApi(direccionApi, '/api/references/validation', {
        identidad,
        metodo: 'POST',
        json: Cuerpo(formulario, origenCaptura, versionPlantilla)
      });
      establecerRevision(resultado);
    } catch (fallo) {
      establecerError(fallo.message);
    }
  }

  async function Enviar() {
    establecerError('');
    try {
      const enviado = await solicitarApi(direccionApi, '/api/references', {
        identidad,
        metodo: 'POST',
        json: { ...Cuerpo(formulario, origenCaptura, versionPlantilla), draftId: borradorId }
      });
      establecerMensaje(`Referencia enviada. Consecutivo ${enviado.consecutive}. Quedó pendiente de revisión.`);
      establecerRevision(null);
      establecerConfirmado(false);
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
      establecerFormulario({ ...VACIO, ...precarga.referral, motives: precarga.referral.motives || [] });
      establecerRevision(null);
      establecerConfirmado(false);
      establecerMensaje('Plantilla precargada. Revise los datos y confirme el envío.');
      if (precarga.issues && precarga.issues.length > 0) {
        establecerError(precarga.issues.map((issue) => issue.message).join(' '));
      }
    } catch (fallo) {
      establecerError(fallo.message);
    }
  }

  if (!catalogos && !error) {
    return <Cargando texto="Cargando el formulario." />;
  }
  return (
    <>
      <h1>Nueva referencia</h1>
      {error ? <Aviso>{error}</Aviso> : null}
      {mensaje ? <Aviso tipo="ok">{mensaje}</Aviso> : null}
      <div className="acciones">
        <button type="button" className="secundario" onClick={DescargarPlantilla}>Descargar plantilla Excel</button>
      </div>
      <Campo id="archivo-plantilla" etiqueta="Precargar desde Excel">
        <input id="archivo-plantilla" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={Precargar} />
      </Campo>
      {borradores.length > 0 ? (
        <Campo id="borrador" etiqueta="Recuperar borrador">
          <select id="borrador" value={borradorId || ''} onChange={(evento) => {
            const id = Number(evento.target.value);
            const encontrado = borradores.find((item) => item.draftId === id);
            establecerBorradorId(id || null);
            if (encontrado && encontrado.content) {
              establecerFormulario({ ...VACIO, ...encontrado.content });
              establecerRevision(null);
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
      <form onSubmit={Validar}>
        <Campo id="persona-referencia" etiqueta="Identificación de la persona">
          <input id="persona-referencia" required value={formulario.personId} onChange={(evento) => Actualizar('personId', evento.target.value)} />
        </Campo>
        <Campo id="fecha-referencia" etiqueta="Fecha de la referencia">
          <input id="fecha-referencia" type="date" required value={formulario.referenceDate} onChange={(evento) => Actualizar('referenceDate', evento.target.value)} />
        </Campo>
        <Campo id="via-referencia" etiqueta="Vía de atención">
          <select id="via-referencia" required value={formulario.attentionRouteCode} onChange={(evento) => Actualizar('attentionRouteCode', evento.target.value)}>
            <option value="">Seleccione</option>
            {(catalogos?.attentionRoutes || []).map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
          </select>
        </Campo>
        <Campo id="origen-referencia" etiqueta="Origen">
          <select id="origen-referencia" required value={formulario.originCode} onChange={(evento) => Actualizar('originCode', evento.target.value)}>
            <option value="">Seleccione</option>
            {(catalogos?.origins || []).map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
          </select>
        </Campo>
        <Campo id="consecutivo" etiqueta="Consecutivo institucional">
          <input id="consecutivo" required value={formulario.consecutive} onChange={(evento) => Actualizar('consecutive', evento.target.value)} />
        </Campo>
        <fieldset>
          <legend>Motivos</legend>
          {(catalogos?.motives || []).map((motivo) => (
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
        <Campo id="acciones-previas" etiqueta="Acciones previas">
          <textarea id="acciones-previas" value={formulario.previousActions} onChange={(evento) => Actualizar('previousActions', evento.target.value)} />
        </Campo>
        <Campo id="resultados-previos" etiqueta="Resultados previos">
          <textarea id="resultados-previos" value={formulario.previousResults} onChange={(evento) => Actualizar('previousResults', evento.target.value)} />
        </Campo>
        <Campo id="informacion-complementaria" etiqueta="Información complementaria">
          <textarea id="informacion-complementaria" value={formulario.complementaryInformation} onChange={(evento) => Actualizar('complementaryInformation', evento.target.value)} />
        </Campo>
        <div className="acciones">
          <button type="submit">Validar consecutivo y datos</button>
          <button type="button" className="secundario" onClick={GuardarBorrador}>Guardar borrador</button>
        </div>
      </form>
      {revision ? (
        <section className="panel" aria-labelledby="titulo-revision">
          <h2 id="titulo-revision">Revisión antes del envío</h2>
          {revision.message ? <Aviso>{revision.message}</Aviso> : <p>La validación no reservó el consecutivo.</p>}
          <p>Consecutivo revisado: {revision.review && revision.review.consecutive}</p>
          <label>
            <input type="checkbox" checked={confirmado} onChange={(evento) => establecerConfirmado(evento.target.checked)} />
            Confirmo el envío de esta referencia.
          </label>
          <div className="acciones">
            <button type="button" disabled={!confirmado || !revision.valid} onClick={Enviar}>Enviar referencia</button>
          </div>
        </section>
      ) : null}
    </>
  );
}

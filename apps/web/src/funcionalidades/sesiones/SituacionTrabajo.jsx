/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-14.
 * Valoración, decisión y apertura de una situación. HU-020 a HU-022.
 */
import { useState } from 'react';
import { Aviso, Campo, ClasePrioridad } from '../../componentes/interfaz';
import { SolicitarApi } from '../../servicios/cliente-api';

const APERTURA_VACIA = {
  propositos: '',
  estrategias: [],
  disciplinas: [],
  frecuenciaCodigo: '',
  confirmada: false
};

function Alternar(lista, valor) {
  return lista.includes(valor) ? lista.filter((item) => item !== valor) : [...lista, valor];
}

export default function SituacionTrabajo({
  direccionApi,
  identidad,
  sesionId,
  situacion,
  catalogos,
  solicitarApi = SolicitarApi,
  alInformar
}) {
  const [valoracion, establecerValoracion] = useState({
    categorias: [],
    riesgoCodigo: '',
    proteccionCodigo: ''
  });
  const [prioridad, establecerPrioridad] = useState(null);
  const [resolucion, establecerResolucion] = useState('REQUIERE_AI');
  const [justificacion, establecerJustificacion] = useState('');
  const [apertura, establecerApertura] = useState(APERTURA_VACIA);
  const [error, establecerError] = useState('');
  const instrumento = catalogos && catalogos.instrumento;

  function CambiarCategoria(categoriaId, cambio) {
    establecerPrioridad(null);
    establecerValoracion((actual) => ({
      ...actual,
      categorias: [
        ...actual.categorias.filter((item) => item.categoriaId !== categoriaId),
        { categoriaId, ...cambio }
      ]
    }));
  }

  async function ConsultarPrioridad() {
    establecerError('');
    try {
      establecerPrioridad(await solicitarApi(direccionApi, '/api/proceso/prioridad', {
        identidad,
        metodo: 'POST',
        json: {
          riesgoCodigo: valoracion.riesgoCodigo,
          proteccionCodigo: valoracion.proteccionCodigo
        }
      }));
    } catch (fallo) {
      establecerError(fallo.message);
    }
  }

  async function GuardarValoracion() {
    establecerError('');
    try {
      const guardada = await solicitarApi(direccionApi, '/api/proceso/valoraciones', {
        identidad,
        metodo: 'POST',
        json: { situacionId: situacion.situacionId, ...valoracion }
      });
      establecerValoracion((actual) => ({ ...actual, valoracionId: guardada.valoracionId }));
      alInformar(`Valoración registrada. Prioridad ${guardada.prioridadEtiqueta}.`);
    } catch (fallo) {
      establecerError(fallo.message);
    }
  }

  async function GuardarResolucion() {
    establecerError('');
    try {
      await solicitarApi(direccionApi, '/api/proceso/resoluciones', {
        identidad,
        metodo: 'POST',
        json: {
          referenciaId: situacion.referenciaId,
          sesionId,
          valoracionId: valoracion.valoracionId,
          decision: resolucion,
          justificacion
        }
      });
      alInformar(resolucion === 'NO_REQUIERE_AI'
        ? 'La referencia quedó como No requiere A.I.'
        : 'La decisión quedó registrada. La apertura del caso es un paso aparte.');
    } catch (fallo) {
      establecerError(fallo.message);
    }
  }

  async function AbrirCaso(evento) {
    evento.preventDefault();
    establecerError('');
    try {
      const abierto = await solicitarApi(direccionApi, '/api/proceso/casos', {
        identidad,
        metodo: 'POST',
        json: {
          referenciaId: situacion.referenciaId,
          propositos: apertura.propositos.split('\n').map((linea) => linea.trim()).filter(Boolean),
          estrategias: apertura.estrategias,
          disciplinas: apertura.disciplinas,
          frecuenciaCodigo: apertura.frecuenciaCodigo
        }
      });
      alInformar(`Caso ${abierto.casoId} abierto. Consecutivo ${abierto.consecutivo}.`);
    } catch (fallo) {
      establecerError(fallo.message);
    }
  }

  return (
    <article>
      <h3>{situacion.referenciaId ? `Referencia ${situacion.referenciaId}` : `Caso ${situacion.casoId}`}</h3>
      {error ? <Aviso>{error}</Aviso> : null}
      {instrumento && instrumento.disponibilidad !== 'DISPONIBLE'
        ? <Aviso tipo="pendiente">{instrumento.mensaje}</Aviso>
        : null}
      {instrumento && instrumento.disponibilidad === 'DISPONIBLE'
        ? instrumento.categorias.map((categoria) => {
          const respuesta = valoracion.categorias.find((item) => item.categoriaId === categoria.categoriaId) || {
            respuesta: '',
            factores: []
          };
          return (
            <details key={categoria.categoriaId} className="categoria">
              <summary>{categoria.etiqueta}</summary>
              <div className="categoria-cuerpo">
                <label>
                  <input
                    type="checkbox"
                    checked={respuesta.respuesta === 'NINGUNO'}
                    onChange={(evento) => CambiarCategoria(categoria.categoriaId, {
                      respuesta: evento.target.checked ? 'NINGUNO' : '',
                      factores: []
                    })}
                  />
                  Ninguno
                </label>
                {categoria.factores.map((factor) => {
                  const seleccionado = respuesta.factores.find((item) => item.factorId === factor.factorId);
                  return (
                    <div key={factor.factorId}>
                      <label>
                        <input
                          type="checkbox"
                          checked={Boolean(seleccionado)}
                          onChange={(evento) => {
                            const factores = evento.target.checked
                              ? [...respuesta.factores, { factorId: factor.factorId, especificacion: '' }]
                              : respuesta.factores.filter((item) => item.factorId !== factor.factorId);
                            CambiarCategoria(categoria.categoriaId, {
                              respuesta: factores.length > 0 ? 'FACTORES' : '',
                              factores
                            });
                          }}
                        />
                        {factor.etiqueta}
                      </label>
                      {factor.esAbierto && seleccionado ? (
                        <input
                          aria-label={`Especificación de ${factor.etiqueta}`}
                          value={seleccionado.especificacion || ''}
                          onChange={(evento) => {
                            const factores = respuesta.factores.map((item) => (
                              item.factorId === factor.factorId
                                ? { ...item, especificacion: evento.target.value }
                                : item
                            ));
                            CambiarCategoria(categoria.categoriaId, { respuesta: 'FACTORES', factores });
                          }}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })
        : null}
      <Campo id={`riesgo-${situacion.situacionId}`} etiqueta="Riesgo profesional">
        <select
          id={`riesgo-${situacion.situacionId}`}
          value={valoracion.riesgoCodigo}
          onChange={(evento) => establecerValoracion({ ...valoracion, riesgoCodigo: evento.target.value })}
        >
          <option value="">Seleccione</option>
          <option value="ALTO">Alto</option>
          <option value="MODERADO">Moderado</option>
          <option value="BAJO">Bajo</option>
        </select>
      </Campo>
      <Campo id={`proteccion-${situacion.situacionId}`} etiqueta="Protección profesional">
        <select
          id={`proteccion-${situacion.situacionId}`}
          value={valoracion.proteccionCodigo}
          onChange={(evento) => establecerValoracion({ ...valoracion, proteccionCodigo: evento.target.value })}
        >
          <option value="">Seleccione</option>
          <option value="ALTA">Alta</option>
          <option value="MODERADA">Moderada</option>
          <option value="BAJA">Baja</option>
        </select>
      </Campo>
      <div className="acciones">
        <button type="button" className="secundario" onClick={ConsultarPrioridad}>Calcular prioridad</button>
        <button type="button" onClick={GuardarValoracion}>Registrar valoración</button>
      </div>
      {prioridad ? (
        <p>
          Prioridad calculada:
          {' '}
          <strong className={ClasePrioridad(prioridad.prioridadCodigo)}>{prioridad.prioridadEtiqueta}</strong>
          . No es editable.
        </p>
      ) : null}
      {situacion.referenciaId && valoracion.valoracionId ? (
        <div>
          <Campo id={`decision-${situacion.situacionId}`} etiqueta="Decisión del equipo">
            <select
              id={`decision-${situacion.situacionId}`}
              value={resolucion}
              onChange={(evento) => establecerResolucion(evento.target.value)}
            >
              <option value="REQUIERE_AI">Sí requiere Atención Interdisciplinaria</option>
              <option value="NO_REQUIERE_AI">No requiere Atención Interdisciplinaria</option>
            </select>
          </Campo>
          {resolucion === 'NO_REQUIERE_AI' ? (
            <Campo id={`justificacion-${situacion.situacionId}`} etiqueta="Justificación">
              <textarea
                id={`justificacion-${situacion.situacionId}`}
                value={justificacion}
                onChange={(evento) => establecerJustificacion(evento.target.value)}
              />
            </Campo>
          ) : null}
          <button type="button" onClick={GuardarResolucion}>Registrar decisión</button>
        </div>
      ) : null}
      {situacion.referenciaId && resolucion === 'REQUIERE_AI' && valoracion.valoracionId ? (
        <form onSubmit={AbrirCaso}>
          <h3>Abordaje inicial</h3>
          <Campo id={`propositos-${situacion.situacionId}`} etiqueta="Propósitos, uno por línea">
            <textarea
              id={`propositos-${situacion.situacionId}`}
              value={apertura.propositos}
              onChange={(evento) => establecerApertura({ ...apertura, propositos: evento.target.value })}
            />
          </Campo>
          <fieldset>
            <legend>Estrategias</legend>
            {(catalogos.estrategias.items || []).map((item) => (
              <label key={item.itemId}>
                <input
                  type="checkbox"
                  checked={apertura.estrategias.includes(item.itemId)}
                  onChange={() => establecerApertura({
                    ...apertura,
                    estrategias: Alternar(apertura.estrategias, item.itemId)
                  })}
                />
                {item.etiqueta}
              </label>
            ))}
          </fieldset>
          {catalogos.estrategias.disponibilidad !== 'DISPONIBLE'
            ? <Aviso tipo="pendiente">{catalogos.estrategias.mensaje}</Aviso>
            : null}
          <fieldset>
            <legend>Disciplinas del abordaje</legend>
            {(catalogos.disciplinas.items || []).map((item) => (
              <label key={`plan-${item.itemId}`}>
                <input
                  type="checkbox"
                  checked={apertura.disciplinas.includes(item.itemId)}
                  onChange={() => establecerApertura({
                    ...apertura,
                    disciplinas: Alternar(apertura.disciplinas, item.itemId)
                  })}
                />
                {item.etiqueta}
              </label>
            ))}
          </fieldset>
          <Campo id={`frecuencia-${situacion.situacionId}`} etiqueta="Frecuencia planificada">
            <select
              id={`frecuencia-${situacion.situacionId}`}
              value={apertura.frecuenciaCodigo}
              onChange={(evento) => establecerApertura({ ...apertura, frecuenciaCodigo: evento.target.value })}
            >
              <option value="">Seleccione</option>
              {(catalogos.frecuencias.items || []).map((item) => (
                <option key={item.codigo} value={item.codigo}>{item.etiqueta}</option>
              ))}
            </select>
          </Campo>
          <label>
            <input
              type="checkbox"
              checked={apertura.confirmada}
              onChange={(evento) => establecerApertura({ ...apertura, confirmada: evento.target.checked })}
            />
            Confirmo la apertura del caso de Atención Interdisciplinaria.
          </label>
          <button type="submit" disabled={!apertura.confirmada}>Abrir caso</button>
        </form>
      ) : null}
    </article>
  );
}

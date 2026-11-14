/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-14.
 * HU-005 a HU-009. La búsqueda es contextual; no hay un padrón general.
 */
import { useState } from 'react';
import { Aviso, Cargando, Campo, Vacio } from '../../componentes/interfaz';
import { SolicitarApi } from '../../servicios/cliente-api';

export default function BusquedaContextual({
  direccionApi,
  identidad,
  contexto,
  navegar,
  solicitarApi = SolicitarApi
}) {
  const [criterio, establecerCriterio] = useState('');
  const [resultado, establecerResultado] = useState(null);
  const [persona, establecerPersona] = useState(null);
  const [error, establecerError] = useState('');
  const [cargando, establecerCargando] = useState(false);

  async function Buscar(evento) {
    evento.preventDefault();
    establecerError('');
    establecerPersona(null);
    establecerCargando(true);
    try {
      const datos = await solicitarApi(
        direccionApi,
        `/api/institutional/persons/search?q=${encodeURIComponent(criterio.trim())}`,
        { identidad }
      );
      establecerResultado(datos);
    } catch (fallo) {
      establecerResultado(null);
      establecerError(fallo.message);
    } finally {
      establecerCargando(false);
    }
  }

  async function AbrirPersona(personId) {
    establecerError('');
    establecerCargando(true);
    try {
      const ficha = await solicitarApi(
        direccionApi,
        `/api/institutional/persons/${encodeURIComponent(personId)}`,
        { identidad }
      );
      establecerPersona(ficha);
    } catch (fallo) {
      establecerError(fallo.message);
    } finally {
      establecerCargando(false);
    }
  }

  const items = resultado && resultado.result ? resultado.result.items : [];
  return (
    <>
      <h1>Buscar persona</h1>
      <p>La búsqueda usa identificación o nombre dentro del ámbito autorizado.</p>
      <form onSubmit={Buscar}>
        <Campo id="criterio-persona" etiqueta="Identificación o nombre">
          <input
            id="criterio-persona"
            value={criterio}
            minLength={2}
            required
            onChange={(evento) => establecerCriterio(evento.target.value)}
          />
        </Campo>
        <button type="submit">Buscar</button>
      </form>
      {error ? <Aviso>{error}</Aviso> : null}
      {cargando ? <Cargando /> : null}
      {resultado && resultado.result ? (
        <p>{resultado.result.returned} de {resultado.result.total}</p>
      ) : null}
      {resultado && items.length === 0 ? <Vacio texto={resultado.result.message || 'Sin coincidencias.'} /> : null}
      {items.length > 0 ? (
        <div className="tabla-contenedor">
          <table>
            <caption>Coincidencias del ámbito</caption>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Identificación</th>
                <th>Establecimiento</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.personId}>
                  <td>{item.fullName || 'Sin nombre disponible'}</td>
                  <td>{item.personId}</td>
                  <td>{item.establishment ? item.establishment.name || item.establishment.id : ''}</td>
                  <td>
                    <button type="button" className="secundario" onClick={() => AbrirPersona(item.personId)}>
                      Ver contexto
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {persona ? (
        <section className="panel" aria-labelledby="titulo-contexto">
          <h2 id="titulo-contexto">Contexto autorizado</h2>
          <p>{persona.fullName || 'Sin nombre disponible'}</p>
          <p>Identificación: {persona.personId}</p>
          <p>
            Establecimiento: {persona.establishment
              ? persona.establishment.name || persona.establishment.id
              : 'No disponible'}
          </p>
          {persona.interdisciplinaryAttention ? (
            <p>
              Casos visibles: {persona.interdisciplinaryAttention.visibleCaseCount === null
                ? persona.interdisciplinaryAttention.message
                : persona.interdisciplinaryAttention.visibleCaseCount}
            </p>
          ) : null}
          {contexto.puedeCrearReferencia ? (
            <button type="button" onClick={() => navegar('referencia-nueva', { personId: persona.personId })}>
              Crear referencia
            </button>
          ) : null}
        </section>
      ) : null}
    </>
  );
}

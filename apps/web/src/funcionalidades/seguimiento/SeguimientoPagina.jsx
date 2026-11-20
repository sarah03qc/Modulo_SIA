/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * Modificación: 2026-11-18. Contexto de la vista.
 * HU-048. El período lo elige el equipo. No hay umbral inventado de atraso.
 */
import { useState } from 'react';
import { Aviso, Cargando, Campo, ResumenResultados, Vacio } from '../../componentes/interfaz';
import { SolicitarApi } from '../../servicios/cliente-api';

const TEXTOS = {
  SIN_ATENCION_REGISTRADA: 'Sin atención registrada',
  ATENDIDO_FUERA_DEL_PERIODO: 'Atendido fuera del período'
};

export default function SeguimientoPagina({
  direccionApi,
  identidad,
  navegar,
  solicitarApi = SolicitarApi
}) {
  const [anio, establecerAnio] = useState(String(new Date().getFullYear()));
  const [resultado, establecerResultado] = useState(null);
  const [error, establecerError] = useState('');
  const [cargando, establecerCargando] = useState(false);

  async function Consultar(evento) {
    evento.preventDefault();
    establecerError('');
    establecerCargando(true);
    try {
      establecerResultado(await solicitarApi(
        direccionApi,
        `/api/proceso/seguimiento/sin-atencion?anio=${encodeURIComponent(anio)}`,
        { identidad }
      ));
    } catch (fallo) {
      establecerError(fallo.message);
    } finally {
      establecerCargando(false);
    }
  }

  return (
    <>
      <p className="contexto">Atención y seguimiento</p>
      <h1>Casos sin atención</h1>
      <p className="introduccion">
        Consulte los casos activos que no registran una atención en el año elegido.
      </p>
      <form onSubmit={Consultar}>
        <Campo id="anio-seguimiento" etiqueta="Año a revisar">
          <input
            id="anio-seguimiento"
            inputMode="numeric"
            required
            value={anio}
            onChange={(evento) => establecerAnio(evento.target.value)}
          />
        </Campo>
        <button type="submit">Consultar</button>
      </form>
      {error ? <Aviso>{error}</Aviso> : null}
      {cargando ? <Cargando texto="Revisando atenciones del período." /> : null}
      {resultado && resultado.disponibilidad === 'BLOQUEADO'
        ? <Aviso tipo="pendiente">{resultado.motivo}</Aviso>
        : null}
      {resultado && resultado.disponibilidad === 'DISPONIBLE' ? (
        <>
          <ResumenResultados
            filtrados={resultado.total}
            pagina={resultado.pagina}
            tamano={resultado.tamano}
          />
          <p className="ayuda">Período del {resultado.desde} al {resultado.hasta}.</p>
          {resultado.items.length === 0
            ? <Vacio texto="No hay casos activos sin atención en ese período." />
            : (
              <table>
                <caption>Casos activos del ámbito sin atención efectiva</caption>
                <thead>
                  <tr>
                    <th>Persona</th>
                    <th>Identificación</th>
                    <th>Situación</th>
                    <th>Última atención</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.items.map((item) => (
                    <tr key={item.casoId}>
                      <td>{item.nombre || 'Nombre no disponible'}</td>
                      <td>{item.identificacion}</td>
                      <td>{TEXTOS[item.situacion] || item.situacion}</td>
                      <td>{item.ultimaAtencion || 'Sin atención registrada'}</td>
                      <td>
                        <button
                          type="button"
                          className="secundario"
                          onClick={() => navegar('casos', {
                            identificacion: item.identificacion,
                            casoId: item.casoId
                          })}
                        >
                          Consultar caso
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </>
      ) : null}
    </>
  );
}

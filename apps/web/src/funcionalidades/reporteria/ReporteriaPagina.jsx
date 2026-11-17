/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * HU-038 y HU-039. La pantalla no recalcula indicadores ni elige la oficina.
 */
import { useEffect, useState } from 'react';
import { Aviso, Cargando, Campo, Vacio } from '../../componentes/interfaz';
import { DescargarArchivo, SolicitarApi } from '../../servicios/cliente-api';
import GraficoReporteria from './GraficosReporteria';

const ANIO_ACTUAL = String(new Date().getFullYear());

const FILTROS_INICIALES = {
  anio: ANIO_ACTUAL,
  establecimientoId: '',
  estado: 'TODOS',
  prioridad: '',
  disciplinaId: '',
  profesional: '',
  sexo: '',
  edad: ''
};

function Consulta(filtros) {
  const parametros = new URLSearchParams();
  parametros.set('anio', filtros.anio);
  if (filtros.establecimientoId) {
    parametros.set('establecimientoId', filtros.establecimientoId);
  }
  if (filtros.estado && filtros.estado !== 'TODOS') {
    parametros.set('estado', filtros.estado);
  }
  if (filtros.prioridad) {
    parametros.set('prioridad', filtros.prioridad);
  }
  if (filtros.disciplinaId) {
    parametros.set('disciplinaId', filtros.disciplinaId);
  }
  if (filtros.profesional) {
    parametros.set('profesional', filtros.profesional);
  }
  if (filtros.sexo) {
    parametros.set('sexo', filtros.sexo);
  }
  if (filtros.edad !== '') {
    parametros.set('edad', filtros.edad);
  }
  return parametros.toString();
}

export default function ReporteriaPagina({
  direccionApi,
  identidad,
  contexto,
  solicitarApi = SolicitarApi
}) {
  const [filtros, establecerFiltros] = useState(FILTROS_INICIALES);
  const [resultado, establecerResultado] = useState(null);
  const [error, establecerError] = useState('');
  const [cargando, establecerCargando] = useState(false);
  const [descargando, establecerDescargando] = useState(false);
  const [informeAbierto, establecerInformeAbierto] = useState(false);
  const consulta = Consulta(filtros);

  useEffect(() => {
    let vigente = true;
    establecerCargando(true);
    establecerError('');
    solicitarApi(direccionApi, `/api/reporteria/oficina?${consulta}`, { identidad })
      .then((datos) => {
        if (vigente) {
          establecerResultado(datos);
        }
      })
      .catch((fallo) => {
        if (vigente) {
          establecerResultado(null);
          establecerError(fallo.message);
        }
      })
      .finally(() => {
        if (vigente) {
          establecerCargando(false);
        }
      });
    return () => {
      vigente = false;
    };
  }, [consulta, direccionApi, identidad, solicitarApi]);

  function Cambiar(campo, valor) {
    establecerFiltros((actual) => {
      const siguiente = { ...actual, [campo]: valor };
      if (campo === 'establecimientoId') {
        siguiente.profesional = '';
      }
      return siguiente;
    });
  }

  async function Descargar() {
    establecerError('');
    establecerDescargando(true);
    try {
      const archivo = await solicitarApi(
        direccionApi,
        `/api/reporteria/oficina/consolidacion?${consulta}`,
        { identidad, archivo: true }
      );
      DescargarArchivo(archivo.blob, archivo.nombre);
    } catch (fallo) {
      establecerError(fallo.message);
    } finally {
      establecerDescargando(false);
    }
  }

  const disciplinas = resultado ? resultado.disciplinas : [];
  const opciones = resultado ? resultado.opciones : {
    profesionales: [],
    sexos: [],
    edades: []
  };
  return (
    <section className="reporteria">
      <div className="encabezado-reporteria">
        <div>
          <h1>Reportería de Oficina Local</h1>
          <p>
            El ámbito es el de la sesión. Estas doce visualizaciones no sustituyen
            el juicio profesional.
          </p>
        </div>
        <div className="acciones-reporteria">
          <button type="button" onClick={() => establecerInformeAbierto(true)}>
            Generar reporte
          </button>
          {contexto && contexto.puedeDescargarConsolidacion ? (
            <button
              type="button"
              className="secundario"
              onClick={Descargar}
              disabled={descargando || cargando || !resultado}
            >
              {descargando ? 'Preparando consolidación…' : 'Descargar consolidación'}
            </button>
          ) : null}
        </div>
      </div>

      <form className="panel filtros-reporteria" aria-label="Filtros de reportería">
        <Campo id="anio-reporteria" etiqueta="Año">
          <input
            id="anio-reporteria"
            inputMode="numeric"
            value={filtros.anio}
            onChange={(evento) => Cambiar('anio', evento.target.value)}
          />
        </Campo>
        <Campo id="establecimiento-reporteria" etiqueta="Establecimiento">
          <select
            id="establecimiento-reporteria"
            value={filtros.establecimientoId}
            onChange={(evento) => Cambiar('establecimientoId', evento.target.value)}
          >
            <option value="">Toda la Oficina Local</option>
            {(resultado && resultado.establecimientos ? resultado.establecimientos : [])
              .map((item) => (
                <option key={item.id} value={item.id}>{item.nombre}</option>
              ))}
          </select>
        </Campo>
        <Campo id="estado-reporteria" etiqueta="Estado del caso">
          <select
            id="estado-reporteria"
            value={filtros.estado}
            onChange={(evento) => Cambiar('estado', evento.target.value)}
          >
            <option value="TODOS">Todos</option>
            <option value="ACTIVO">Activo</option>
            <option value="CERRADO">Cerrado</option>
          </select>
        </Campo>
        <Campo id="prioridad-reporteria" etiqueta="Prioridad">
          <select
            id="prioridad-reporteria"
            value={filtros.prioridad}
            onChange={(evento) => Cambiar('prioridad', evento.target.value)}
          >
            <option value="">Todas</option>
            <option value="ALTO">Alto</option>
            <option value="MODERADO">Moderado</option>
            <option value="BAJO">Bajo</option>
          </select>
        </Campo>
        <Campo id="disciplina-reporteria" etiqueta="Disciplina">
          <select
            id="disciplina-reporteria"
            value={filtros.disciplinaId}
            disabled={!disciplinas || disciplinas.length === 0}
            onChange={(evento) => Cambiar('disciplinaId', evento.target.value)}
          >
            <option value="">
              {disciplinas && disciplinas.length > 0 ? 'Todas' : 'Información no disponible'}
            </option>
            {(disciplinas || []).map((item) => (
              <option key={item.itemId} value={item.itemId}>{item.etiqueta}</option>
            ))}
          </select>
        </Campo>
        <Campo id="profesional-reporteria" etiqueta="Profesional">
          <select
            id="profesional-reporteria"
            value={filtros.profesional}
            disabled={opciones.profesionales.length === 0}
            onChange={(evento) => Cambiar('profesional', evento.target.value)}
          >
            <option value="">
              {opciones.profesionales.length > 0
                ? 'Todos'
                : 'Sin profesionales verificables en este corte'}
            </option>
            {opciones.profesionales.map((profesional) => (
              <option key={profesional} value={profesional}>{profesional}</option>
            ))}
          </select>
        </Campo>
        <Campo id="sexo-reporteria" etiqueta="Sexo">
          <select
            id="sexo-reporteria"
            value={filtros.sexo}
            disabled={opciones.sexos.length === 0}
            onChange={(evento) => Cambiar('sexo', evento.target.value)}
          >
            <option value="">Todos</option>
            {opciones.sexos.map((sexo) => (
              <option key={sexo} value={sexo}>{sexo}</option>
            ))}
          </select>
        </Campo>
        <Campo id="edad-reporteria" etiqueta="Edad actual">
          <select
            id="edad-reporteria"
            value={filtros.edad}
            disabled={opciones.edades.length === 0}
            onChange={(evento) => Cambiar('edad', evento.target.value)}
          >
            <option value="">Todas</option>
            {opciones.edades.map((edad) => (
              <option key={edad} value={edad}>{edad} años</option>
            ))}
          </select>
        </Campo>
        <button
          type="button"
          className="secundario"
          onClick={() => establecerFiltros(FILTROS_INICIALES)}
        >
          Restablecer filtros
        </button>
      </form>

      {resultado ? (
        <div className="filtros-activos" aria-live="polite">
          <h2>Filtros activos</h2>
          <ol>
            {resultado.filtrosActivos.map((filtro) => (
              <li key={filtro.codigo}>{filtro.etiqueta}</li>
            ))}
          </ol>
          <details>
            <summary>Alcance de cada filtro</summary>
            <ul>
              {resultado.alcanceFiltros.map((filtro) => (
                <li key={filtro.codigo}>
                  <strong>{filtro.codigo}</strong>
                  {': aplica a '}
                  {filtro.aplicaA.join(', ') || 'ninguna'}
                  .
                  {' '}{filtro.motivo}
                </li>
              ))}
            </ul>
          </details>
        </div>
      ) : null}

      {cargando ? <Cargando texto="Consultando reportería." /> : null}
      {error ? <Aviso>{error}</Aviso> : null}

      {resultado ? (
        <>
          <section className="panel" aria-label="Indicadores complementarios">
            <h2>Indicadores complementarios</h2>
            <p>{resultado.notaPersonas}</p>
            <p>{resultado.notaAtenciones}</p>
            <dl className="cifras">
              <div>
                <dt>Personas únicas atendidas</dt>
                <dd>{resultado.personasUnicas}</dd>
              </div>
              <div>
                <dt>Total de atenciones</dt>
                <dd>{resultado.totalAtenciones}</dd>
              </div>
              <div>
                <dt>Atenciones individuales</dt>
                <dd>{resultado.atencionesIndividuales}</dd>
              </div>
              <div>
                <dt>Atenciones grupales</dt>
                <dd>{resultado.atencionesGrupales}</dd>
              </div>
              <div>
                <dt>Referencias enviadas</dt>
                <dd>{resultado.referencias.enviadas}</dd>
              </div>
              <div>
                <dt>Referencias analizadas</dt>
                <dd>{resultado.referencias.analizadas}</dd>
              </div>
              <div>
                <dt>Admitidas</dt>
                <dd>{resultado.referencias.admitidas}</dd>
              </div>
              <div>
                <dt>No requiere A.I.</dt>
                <dd>{resultado.referencias.noRequiere}</dd>
              </div>
            </dl>
            <p>{resultado.referencias.nota}</p>
            <p className="aviso aviso-info">{resultado.cobertura.texto}</p>
          </section>

          <div className="rejilla-reporteria">
            {resultado.visualizaciones.map((visualizacion) => (
              <article key={visualizacion.numero} className="panel visualizacion">
                <h2>
                  {visualizacion.numero}. {visualizacion.titulo}
                </h2>
                <p>{visualizacion.fechaAplicada}</p>
                <GraficoReporteria visualizacion={visualizacion} />
                {visualizacion.nota ? <p>{visualizacion.nota}</p> : null}
                {visualizacion.totalFrecuencia > visualizacion.serie.length ? (
                  <p>
                    La presentación muestra {visualizacion.serie.length}
                    {' de '}
                    {visualizacion.totalFrecuencia}.
                    La consolidación descarga la frecuencia completa.
                  </p>
                ) : null}
              </article>
            ))}
          </div>

          <section className="panel" aria-label="Casos sin atención">
            <h2>Casos activos sin atención en el año</h2>
            <p>{resultado.casosSinAtencion.nota}</p>
            {resultado.casosSinAtencion.estado === 'SIN_CASOS_ACTIVOS' ? (
              <Vacio texto="Sin casos activos. No aplica." />
            ) : null}
            {resultado.casosSinAtencion.total === 0
              && resultado.casosSinAtencion.estado === 'CON_DATOS' ? (
                <Vacio texto={'No hay casos activos sin atención '
                  + 'efectiva en el año.'}
                />
              ) : null}
            {resultado.casosSinAtencion.muestra.length > 0 ? (
              <table>
                <caption>
                  Se muestran {resultado.casosSinAtencion.muestra.length}
                  {' de '}
                  {resultado.casosSinAtencion.total}.
                  La consolidación incluye el conjunto completo filtrado.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Caso</th>
                    <th scope="col">Establecimiento</th>
                    <th scope="col">Última atención</th>
                    <th scope="col">Situación</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.casosSinAtencion.muestra.map((fila) => (
                    <tr key={fila.casoId}>
                      <td>{fila.casoId}</td>
                      <td>{fila.establecimiento}</td>
                      <td>{fila.ultimaAtencion || 'Sin atención registrada'}</td>
                      <td>{fila.situacion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </section>
        </>
      ) : null}

      {informeAbierto ? (
        <div className="dialogo-fondo">
          <div
            className="dialogo"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-informe"
          >
            <h2 id="titulo-informe">Generar reporte</h2>
            <p>
              {resultado
                ? resultado.informeAnalitico.mensaje
                : 'El asistente del informe analítico todavía no está disponible. '
                  + 'No descarga la consolidación ni el reporte de un caso.'}
            </p>
            <button type="button" onClick={() => establecerInformeAbierto(false)}>
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

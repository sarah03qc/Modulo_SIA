/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * Modificación: 2026-11-18. Título Reportería y contexto analítico.
 * HU-038, HU-039 y HU-040 a HU-043.
 * La pantalla no recalcula indicadores ni elige el ámbito de la sesión.
 */
import { useEffect, useState } from 'react';
import { Aviso, Cargando, Campo, Vacio } from '../../componentes/interfaz';
import { DescargarArchivo, SolicitarApi } from '../../servicios/cliente-api';
import AsistenteInforme from './AsistenteInforme';
import GraficoReporteria from './GraficosReporteria';

const ANIO_ACTUAL = String(new Date().getFullYear());

const FILTROS_INICIALES = {
  anio: ANIO_ACTUAL,
  regionId: '',
  localOfficeId: '',
  establecimientoId: '',
  estado: 'TODOS',
  prioridad: '',
  disciplinaId: '',
  profesional: '',
  sexo: '',
  edad: ''
};

function EsSuperior(contexto) {
  const nivel = contexto && contexto.nivel;
  return nivel === 'REGION' || nivel === 'NACIONAL';
}

function Consulta(filtros, nivel) {
  const parametros = new URLSearchParams();
  parametros.set('anio', filtros.anio);
  if (nivel === 'NACIONAL' && filtros.regionId) {
    parametros.set('regionId', filtros.regionId);
  }
  if ((nivel === 'NACIONAL' || nivel === 'REGION') && filtros.localOfficeId) {
    parametros.set('localOfficeId', filtros.localOfficeId);
  }
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
  const superior = EsSuperior(contexto);
  const nivel = contexto && contexto.nivel;
  const rutaBase = superior ? '/api/reporteria/consulta' : '/api/reporteria/oficina';
  const [filtros, establecerFiltros] = useState(FILTROS_INICIALES);
  const [territorio, establecerTerritorio] = useState(null);
  const [resultado, establecerResultado] = useState(null);
  const [error, establecerError] = useState('');
  const [cargando, establecerCargando] = useState(false);
  const [descargando, establecerDescargando] = useState(false);
  const [informeAbierto, establecerInformeAbierto] = useState(false);
  const [consultaResultado, establecerConsultaResultado] = useState('');
  const consulta = Consulta(filtros, nivel);

  useEffect(() => {
    if (!superior) {
      establecerTerritorio(null);
      return undefined;
    }
    let vigente = true;
    const parametros = new URLSearchParams();
    if (filtros.regionId) {
      parametros.set('regionId', filtros.regionId);
    }
    if (filtros.localOfficeId) {
      parametros.set('localOfficeId', filtros.localOfficeId);
    }
    solicitarApi(
      direccionApi,
      `/api/institutional/territory/options?${parametros.toString()}`,
      { identidad }
    ).then((datos) => {
      if (vigente) {
        establecerTerritorio(datos);
      }
    }).catch(() => {
      if (vigente) {
        establecerTerritorio(null);
      }
    });
    return () => {
      vigente = false;
    };
  }, [
    direccionApi,
    filtros.localOfficeId,
    filtros.regionId,
    identidad,
    solicitarApi,
    superior
  ]);

  useEffect(() => {
    let vigente = true;
    establecerCargando(true);
    establecerError('');
    solicitarApi(direccionApi, `${rutaBase}?${consulta}`, { identidad })
      .then((datos) => {
        if (vigente) {
          establecerResultado(datos);
          establecerConsultaResultado(consulta);
        }
      })
      .catch((fallo) => {
        if (vigente) {
          establecerResultado(null);
          establecerConsultaResultado('');
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
  }, [consulta, direccionApi, identidad, rutaBase, solicitarApi]);

  function Cambiar(campo, valor) {
    establecerFiltros((actual) => {
      const siguiente = { ...actual, [campo]: valor };
      if (campo === 'regionId') {
        siguiente.localOfficeId = '';
        siguiente.establecimientoId = '';
        siguiente.profesional = '';
      }
      if (campo === 'localOfficeId' || campo === 'establecimientoId') {
        siguiente.profesional = '';
      }
      if (campo === 'localOfficeId') {
        siguiente.establecimientoId = '';
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
        `${rutaBase}/consolidacion?${consulta}`,
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
  const alcance = nivel === 'NACIONAL'
    ? 'La consulta es nacional y de solo lectura.'
    : nivel === 'REGION'
      ? 'La consulta es regional y de solo lectura.'
      : 'El ámbito es el de la sesión.';
  const oficinas = territorio && territorio.filters
    ? territorio.filters.localOffice.options
    : [];
  const regiones = territorio && territorio.filters
    ? territorio.filters.region.options
    : [];
  const establecimientos = superior
    ? ((territorio && territorio.filters && territorio.filters.establishment.options) || [])
      .map((item) => ({ id: item.id, nombre: item.name }))
    : (resultado && resultado.establecimientos ? resultado.establecimientos : []);
  const oficinaBloqueada = Boolean(
    territorio && territorio.filters && territorio.filters.localOffice.requiresParent
  );
  const establecimientoBloqueado = superior && (
    !filtros.localOfficeId
    || Boolean(territorio && territorio.filters
      && territorio.filters.establishment.requiresParent)
  );
  return (
    <section className="reporteria">
      <div className="encabezado-reporteria">
        <div>
          <p className="contexto">Analítica operativa</p>
          <h1>Reportería</h1>
          <p>
            {alcance} Estas doce visualizaciones no sustituyen el juicio profesional.
          </p>
          {superior ? (
            <p>
              La consulta es de solo lectura. El asistente HU-050 sigue en Oficina Local.
            </p>
          ) : null}
        </div>
        <div className="acciones-reporteria">
          {superior ? null : (
            <button
              type="button"
              onClick={() => establecerInformeAbierto(true)}
              disabled={!resultado}
            >
              Generar reporte
            </button>
          )}
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
        {nivel === 'NACIONAL' ? (
          <Campo id="region-reporteria" etiqueta="Región">
            <select
              id="region-reporteria"
              value={filtros.regionId}
              onChange={(evento) => Cambiar('regionId', evento.target.value)}
            >
              <option value="">Todas</option>
              {regiones.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </Campo>
        ) : null}
        {nivel === 'REGION' && regiones[0] ? (
          <p>Región: {regiones[0].name}</p>
        ) : null}
        {superior ? (
          <Campo id="oficina-reporteria" etiqueta="Oficina Local">
            <select
              id="oficina-reporteria"
              value={filtros.localOfficeId}
              disabled={oficinaBloqueada}
              onChange={(evento) => Cambiar('localOfficeId', evento.target.value)}
            >
              <option value="">
                {oficinaBloqueada ? 'Seleccione primero una región' : 'Todas'}
              </option>
              {oficinas.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </Campo>
        ) : null}
        <Campo id="establecimiento-reporteria" etiqueta="Establecimiento">
          <select
            id="establecimiento-reporteria"
            value={filtros.establecimientoId}
            disabled={establecimientoBloqueado}
            onChange={(evento) => Cambiar('establecimientoId', evento.target.value)}
          >
            <option value="">
              {superior
                ? (filtros.localOfficeId
                  ? 'Toda la oficina seleccionada'
                  : 'Seleccione primero una Oficina Local')
                : 'Toda la Oficina Local'}
            </option>
            {establecimientos.map((item) => (
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

      <AsistenteInforme
        abierto={informeAbierto && Boolean(resultado)}
        resultado={consultaResultado === consulta ? resultado : null}
        consulta={consulta}
        direccionApi={direccionApi}
        identidad={identidad}
        solicitarApi={solicitarApi}
        alCerrar={() => establecerInformeAbierto(false)}
      />
    </section>
  );
}

/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * Modificación: 2026-11-20. Paleta institucional, detalle paginado
 * y desglose territorial. El porcentaje va en su propia columna.
 * HU-038.
 */
import { useMemo, useState } from 'react';
import { Vacio } from '../../componentes/interfaz';
import { GraficoECharts } from '../../componentes/visualizacion/GraficoECharts';
import { FORMATO_NUMERICO } from '../../componentes/visualizacion/perfil-visual';

const PALETA = ['#663366', '#FF6633', '#009999', '#8f5a86', '#0f6e6e', '#c45c28'];
const COLOR_SERIE = '#663366';
const COLOR_EDAD = '#009999';
const LIMITE_GRAFICO = 12;
const FILAS_PAGINA = 8;

const COLOR_PRIORIDAD = {
  Alto: '#9b202c',
  Moderado: '#FF6633',
  Bajo: '#009999'
};

const COLOR_ESTADO = {
  Activo: '#009999',
  Cerrado: '#4d3f55'
};

const COLOR_CIERRE = {
  'Cierre satisfactorio': '#009999',
  Traslado: '#FF6633',
  Otro: '#663366'
};

const FORMATO_PORCENTAJE = new Intl.NumberFormat('es-CR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});

function Formatear(valor) {
  if (typeof valor !== 'number' || Number.isNaN(valor)) {
    return '';
  }
  return FORMATO_NUMERICO.format(valor);
}

function Presentacion(visualizacion) {
  if (visualizacion.formato === 'KPI_PORCENTAJE'
    || visualizacion.formato === 'KPI_CANTIDAD') {
    return 'kpi';
  }
  if (visualizacion.formato === 'CIRCULAR'
    || visualizacion.codigo === 'CASOS_SEXO'
    || visualizacion.codigo === 'CASOS_ESTADO'
    || visualizacion.codigo === 'MOTIVOS_CIERRE') {
    return 'donut';
  }
  if (visualizacion.codigo === 'CASOS_EDAD'
    || visualizacion.codigo === 'REF_EVOLUCION') {
    return 'barras-verticales';
  }
  if (visualizacion.formato === 'TABLA') {
    return 'tabla';
  }
  if (visualizacion.formato === 'BARRAS'
    || visualizacion.formato === 'DISTRIBUCION'
    || visualizacion.formato === 'NUBE') {
    return 'barras-horizontales';
  }
  return 'tabla';
}

function SerieCompleta(visualizacion) {
  return visualizacion.serieCompleta && visualizacion.serieCompleta.length > 0
    ? visualizacion.serieCompleta
    : (visualizacion.serie || []);
}

function TipoPorcentaje(serie) {
  const fila = serie.find((item) => item.tipoPorcentaje);
  return fila ? fila.tipoPorcentaje : null;
}

function EtiquetaPorcentaje(tipo) {
  if (tipo === 'REFERENCIAS') {
    return '% de referencias';
  }
  if (tipo === 'CANCELACIONES') {
    return '% de actividades canceladas';
  }
  return '% del total';
}

function ColorCategoria(visualizacion, fila, indice) {
  if (visualizacion.codigo === 'CASOS_PRIORIDAD') {
    return COLOR_PRIORIDAD[fila.etiqueta] || COLOR_SERIE;
  }
  if (visualizacion.codigo === 'CASOS_ESTADO') {
    return COLOR_ESTADO[fila.etiqueta] || '#4d3f55';
  }
  if (visualizacion.codigo === 'MOTIVOS_CIERRE') {
    return COLOR_CIERRE[fila.etiqueta] || PALETA[indice % PALETA.length];
  }
  if (visualizacion.codigo === 'CASOS_SEXO'
    || visualizacion.codigo === 'CASOS_ESTADO') {
    return PALETA[indice % PALETA.length];
  }
  if (visualizacion.codigo === 'CASOS_EDAD') {
    return COLOR_EDAD;
  }
  return COLOR_SERIE;
}

function OpcionesBarras(visualizacion, horizontal, serie) {
  const etiquetas = serie.map((fila) => fila.etiqueta);
  const varios = visualizacion.codigo === 'CASOS_PRIORIDAD'
    || visualizacion.codigo === 'CASOS_ESTADO'
    || visualizacion.codigo === 'CASOS_SEXO'
    || visualizacion.codigo === 'MOTIVOS_CIERRE';
  const datos = serie.map((fila, indice) => ({
    value: fila.cantidad,
    name: fila.etiqueta,
    itemStyle: {
      color: varios ? ColorCategoria(visualizacion, fila, indice) : COLOR_SERIE,
      borderRadius: 3
    }
  }));
  const ejes = horizontal
    ? {
      xAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { formatter: (valor) => Formatear(valor) }
      },
      yAxis: {
        type: 'category',
        data: etiquetas,
        inverse: true,
        axisLabel: { width: 160, overflow: 'truncate' }
      }
    }
    : {
      xAxis: {
        type: 'category',
        data: etiquetas,
        axisLabel: { interval: 0, hideOverlap: true, width: 72, overflow: 'truncate' }
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { formatter: (valor) => Formatear(valor) }
      }
    };
  return {
    color: [COLOR_SERIE],
    grid: { left: 8, right: 16, top: 12, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'axis',
      formatter: (parametros) => {
        const item = Array.isArray(parametros) ? parametros[0] : parametros;
        return `${item.name}\n${Formatear(item.value)}`;
      }
    },
    ...ejes,
    series: [{
      type: 'bar',
      name: 'Cantidad',
      data: datos,
      barMaxWidth: 18
    }]
  };
}

function OpcionesDonut(visualizacion) {
  return {
    color: PALETA,
    tooltip: {
      trigger: 'item',
      formatter: (item) => {
        const fila = (visualizacion.serie || []).find((entrada) => (
          entrada.etiqueta === item.name
        ));
        const porcentaje = fila && fila.porcentaje != null
          ? `\n${FORMATO_PORCENTAJE.format(fila.porcentaje)} %`
          : '';
        return `${item.name}\n${Formatear(item.value)}${porcentaje}`;
      }
    },
    legend: {
      type: 'scroll',
      orient: 'horizontal',
      bottom: 0,
      textStyle: { color: '#211b25', fontSize: 12 }
    },
    series: [{
      type: 'pie',
      name: visualizacion.titulo,
      radius: ['48%', '70%'],
      center: ['50%', '44%'],
      label: { show: false },
      data: visualizacion.serie.map((fila, indice) => ({
        name: fila.etiqueta,
        value: fila.cantidad,
        itemStyle: { color: ColorCategoria(visualizacion, fila, indice) }
      }))
    }]
  };
}

function Kpi({ visualizacion }) {
  if (visualizacion.estado === 'SIN_CASOS_ACTIVOS') {
    return <p className="kpi-cifra">{visualizacion.mensaje}</p>;
  }
  if (visualizacion.formato === 'KPI_PORCENTAJE') {
    const porcentaje = Number(visualizacion.porcentaje);
    const ancho = Number.isFinite(porcentaje)
      ? Math.max(0, Math.min(porcentaje, 100))
      : 0;
    return (
      <div className="kpi">
        <p className="kpi-cifra">
          {Formatear(porcentaje)} %
          <span className="kpi-detalle">
            {Formatear(visualizacion.numerador)}
            {' de '}
            {Formatear(visualizacion.denominador)}
            {' personas con caso activo'}
          </span>
        </p>
        <span className="kpi-pista" aria-hidden="true">
          <span style={{ width: `${ancho}%` }} />
        </span>
      </div>
    );
  }
  return (
    <p className="kpi-cifra kpi-cantidad">
      {Formatear(visualizacion.numerador)}
      <span className="kpi-detalle">
        {visualizacion.detalleKpi || 'Personas con caso activo y al menos una atención'}
      </span>
    </p>
  );
}

function TablaDetalle({ visualizacion }) {
  const serie = SerieCompleta(visualizacion);
  const [abierta, establecerAbierta] = useState(false);
  const [pagina, establecerPagina] = useState(0);
  const [busqueda, establecerBusqueda] = useState('');
  const tipo = TipoPorcentaje(serie);
  const maximo = serie.reduce((mayor, fila) => Math.max(mayor, fila.cantidad), 0);
  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase('es');
    if (!texto) {
      return serie;
    }
    return serie.filter((fila) => (
      String(fila.etiqueta).toLocaleLowerCase('es').includes(texto)
    ));
  }, [busqueda, serie]);
  const paginas = Math.max(1, Math.ceil(filtradas.length / FILAS_PAGINA));
  const paginaSegura = Math.min(pagina, paginas - 1);
  const visibles = filtradas.slice(
    paginaSegura * FILAS_PAGINA,
    paginaSegura * FILAS_PAGINA + FILAS_PAGINA
  );
  if (serie.length === 0) {
    return null;
  }
  return (
    <div className="detalle-datos">
      <button
        type="button"
        className="secundario"
        aria-expanded={abierta}
        onClick={() => establecerAbierta((actual) => !actual)}
      >
        Ver datos
      </button>
      {abierta ? (
        <div className="panel-datos">
          {serie.length > FILAS_PAGINA ? (
            <label className="busqueda-datos" htmlFor={`buscar-${visualizacion.numero}`}>
              Buscar
              <input
                id={`buscar-${visualizacion.numero}`}
                value={busqueda}
                onChange={(evento) => {
                  establecerBusqueda(evento.target.value);
                  establecerPagina(0);
                }}
              />
            </label>
          ) : null}
          <table className="tabla-frecuencia">
            <caption>Valores exactos de {visualizacion.titulo}</caption>
            <thead>
              <tr>
                <th scope="col">Categoría</th>
                <th scope="col">Cantidad</th>
                <th scope="col">{tipo ? EtiquetaPorcentaje(tipo) : 'Comparación visual'}</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((fila) => {
                const ancho = tipo
                  ? Math.max(0, Math.min(fila.porcentaje || 0, 100))
                  : (maximo === 0 ? 0 : (fila.cantidad / maximo) * 100);
                return (
                  <tr key={fila.clave || fila.etiqueta}>
                    <th scope="row">{fila.etiqueta}</th>
                    <td className="cantidad">{Formatear(fila.cantidad)}</td>
                    <td className="porcentaje">
                      {fila.porcentaje != null
                        ? `${FORMATO_PORCENTAJE.format(fila.porcentaje)} %`
                        : null}
                      <span className="barra-pista" aria-hidden="true">
                        <span
                          className="relleno-frecuencia"
                          style={{ width: `${ancho}%` }}
                        />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtradas.length > FILAS_PAGINA ? (
            <div className="paginacion-datos">
              <button
                type="button"
                className="secundario"
                disabled={paginaSegura === 0}
                onClick={() => establecerPagina(paginaSegura - 1)}
              >
                Anterior
              </button>
              <span>
                {paginaSegura + 1}
                {' / '}
                {paginas}
              </span>
              <button
                type="button"
                className="secundario"
                disabled={paginaSegura >= paginas - 1}
                onClick={() => establecerPagina(paginaSegura + 1)}
              >
                Siguiente
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function GraficoSerie({ visualizacion, presentacion, alElegir }) {
  const serie = (visualizacion.serie || []).slice(0, LIMITE_GRAFICO);
  const horizontal = presentacion === 'barras-horizontales';
  const opciones = useMemo(
    () => (presentacion === 'donut'
      ? OpcionesDonut({ ...visualizacion, serie })
      : OpcionesBarras(visualizacion, horizontal, serie)),
    [horizontal, presentacion, serie, visualizacion]
  );
  const altura = horizontal
    ? `${Math.min(20, Math.max(8, 3.2 + serie.length * 1.35))}rem`
    : '15rem';
  return (
    <>
      <GraficoECharts
        descripcion={visualizacion.titulo}
        opciones={opciones}
        altura={altura}
        alElegir={alElegir}
      />
      {(visualizacion.serie || []).length > LIMITE_GRAFICO ? (
        <p className="nota-grafico">
          El gráfico muestra las {LIMITE_GRAFICO} categorías con más casos.
          Ver datos incluye todas.
        </p>
      ) : null}
    </>
  );
}

export default function GraficoReporteria({ visualizacion, alDescender }) {
  if (visualizacion.estado !== 'CON_DATOS') {
    const mensaje = visualizacion.mensaje && visualizacion.mensaje.includes('Sin casos activos')
      ? 'No aplica en este corte.'
      : (visualizacion.mensaje || 'Información no disponible.');
    return <Vacio texto={mensaje} />;
  }
  const presentacion = Presentacion(visualizacion);
  const puedeDescender = Boolean(alDescender) && (
    visualizacion.agrupacion === 'REGION'
    || visualizacion.agrupacion === 'OFICINA_LOCAL'
    || visualizacion.agrupacion === 'ESTABLECIMIENTO'
  );
  function Elegir(nombre) {
    if (!puedeDescender) {
      return;
    }
    const fila = (visualizacion.serie || []).find((item) => item.etiqueta === nombre);
    if (fila && fila.identificador && !String(fila.identificador).startsWith('SIN_')) {
      alDescender(visualizacion.agrupacion, fila.identificador);
    }
  }
  return (
    <div>
      {presentacion === 'kpi' ? <Kpi visualizacion={visualizacion} /> : null}
      {presentacion === 'barras-horizontales'
        || presentacion === 'barras-verticales'
        || presentacion === 'donut' ? (
          <GraficoSerie
            visualizacion={visualizacion}
            presentacion={presentacion}
            alElegir={puedeDescender ? Elegir : null}
          />
        ) : null}
      {puedeDescender ? (
        <div className="detalle-territorial">
          <p>
            {visualizacion.agrupacion === 'REGION'
              ? 'Ver detalle por región'
              : 'Ver detalle del ámbito'}
          </p>
          <ul>
            {(visualizacion.serie || []).slice(0, LIMITE_GRAFICO).map((fila) => (
              <li key={fila.clave || fila.etiqueta}>
                <button
                  type="button"
                  className="enlace-detalle"
                  onClick={() => Elegir(fila.etiqueta)}
                >
                  {fila.etiqueta}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {presentacion === 'kpi' ? null : <TablaDetalle visualizacion={visualizacion} />}
    </div>
  );
}

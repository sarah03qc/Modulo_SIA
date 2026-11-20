/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * Modificación: 2026-11-18. Presentación con ECharts según la pregunta
 * de cada visualización. No recalcula el indicador ni altera la serie.
 * HU-038.
 */
import { useMemo } from 'react';
import { Vacio } from '../../componentes/interfaz';
import { GraficoECharts } from '../../componentes/visualizacion/GraficoECharts';
import { FORMATO_NUMERICO } from '../../componentes/visualizacion/perfil-visual';

const COLORES = ['#663366', '#0f6666', '#7a4c0a', '#196244', '#1d4e89', '#9b202c'];

const COLOR_PRIORIDAD = {
  Alto: '#9b202c',
  Moderado: '#7a4c0a',
  Bajo: '#196244'
};

function Formatear(valor) {
  if (typeof valor !== 'number' || Number.isNaN(valor)) {
    return '';
  }
  return FORMATO_NUMERICO.format(valor);
}

function Presentacion(visualizacion) {
  if (visualizacion.formato === 'TABLA') {
    return 'tabla';
  }
  if (visualizacion.formato === 'KPI_PORCENTAJE'
    || visualizacion.formato === 'KPI_CANTIDAD') {
    return 'kpi';
  }
  if (visualizacion.formato === 'CIRCULAR'
    || visualizacion.codigo === 'CASOS_SEXO'
    || visualizacion.codigo === 'CASOS_ESTADO') {
    return 'donut';
  }
  if (visualizacion.codigo === 'CASOS_EDAD') {
    return 'barras-verticales';
  }
  if (visualizacion.formato === 'BARRAS'
    || visualizacion.formato === 'DISTRIBUCION'
    || visualizacion.formato === 'NUBE') {
    return 'barras-horizontales';
  }
  return 'tabla';
}

function Maximo(serie) {
  return serie.reduce((mayor, fila) => Math.max(mayor, fila.cantidad), 0);
}

function TablaSerie({ visualizacion }) {
  if (!visualizacion.serie || visualizacion.serie.length === 0) {
    return null;
  }
  const maximo = Maximo(visualizacion.serie);
  const mostrarBarra = visualizacion.formato === 'TABLA'
    || visualizacion.formato === 'NUBE';
  return (
    <div className="tabla-contenedor">
      <table className="tabla-frecuencia">
        <caption>Valores exactos de {visualizacion.titulo}</caption>
        <thead>
          <tr>
            <th scope="col">Categoría</th>
            <th scope="col">Cantidad</th>
            {mostrarBarra ? <th scope="col">Proporción</th> : null}
          </tr>
        </thead>
        <tbody>
          {visualizacion.serie.map((fila) => (
            <tr key={fila.clave || fila.etiqueta}>
              <th scope="row">{fila.etiqueta}</th>
              <td className="cantidad">{Formatear(fila.cantidad)}</td>
              {mostrarBarra ? (
                <td>
                  <span className="barra-pista" aria-hidden="true">
                    <span
                      className="barra-valor"
                      style={{
                        width: maximo === 0
                          ? '0%'
                          : `${(fila.cantidad / maximo) * 100}%`
                      }}
                    />
                  </span>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OpcionesBarras(visualizacion, horizontal) {
  const etiquetas = visualizacion.serie.map((fila) => fila.etiqueta);
  const datos = visualizacion.serie.map((fila) => {
    const color = visualizacion.codigo === 'CASOS_PRIORIDAD'
      ? COLOR_PRIORIDAD[fila.etiqueta]
      : '#663366';
    return {
      value: fila.cantidad,
      itemStyle: { color: color || '#663366', borderRadius: 4 }
    };
  });
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
        axisLabel: { width: 220, overflow: 'break' }
      }
    }
    : {
      xAxis: {
        type: 'category',
        data: etiquetas,
        axisLabel: { interval: 0, hideOverlap: false, width: 72, overflow: 'break' }
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { formatter: (valor) => Formatear(valor) }
      }
    };
  return {
    color: ['#663366'],
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
      barMaxWidth: 22
    }]
  };
}

function OpcionesDonut(visualizacion) {
  return {
    color: COLORES,
    tooltip: {
      trigger: 'item',
      formatter: (item) => `${item.name}\n${Formatear(item.value)}`
    },
    legend: {
      orient: 'vertical',
      right: 0,
      top: 'middle',
      textStyle: { color: '#211b25', fontSize: 13 }
    },
    series: [{
      type: 'pie',
      name: visualizacion.titulo,
      radius: ['46%', '72%'],
      center: ['34%', '50%'],
      label: {
        formatter: (item) => `${item.name}: ${Formatear(item.value)}`
      },
      data: visualizacion.serie.map((fila) => ({
        name: fila.etiqueta,
        value: fila.cantidad
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
      <span className="kpi-detalle">Personas con caso activo y al menos una atención</span>
    </p>
  );
}

function GraficoSerie({ visualizacion, presentacion }) {
  const horizontal = presentacion === 'barras-horizontales';
  const opciones = useMemo(
    () => (presentacion === 'donut'
      ? OpcionesDonut(visualizacion)
      : OpcionesBarras(visualizacion, horizontal)),
    [horizontal, presentacion, visualizacion]
  );
  const altura = horizontal
    ? `${Math.min(28, 7 + visualizacion.serie.length * 2.1)}rem`
    : '16rem';
  return (
    <GraficoECharts
      descripcion={visualizacion.titulo}
      opciones={opciones}
      altura={altura}
    />
  );
}

export default function GraficoReporteria({ visualizacion }) {
  if (visualizacion.estado !== 'CON_DATOS') {
    const mensaje = visualizacion.mensaje && visualizacion.mensaje.includes('Sin casos activos')
      ? 'No aplica en este corte.'
      : (visualizacion.mensaje || 'Información no disponible.');
    return <Vacio texto={mensaje} />;
  }
  const presentacion = Presentacion(visualizacion);
  return (
    <div>
      {presentacion === 'kpi' ? <Kpi visualizacion={visualizacion} /> : null}
      {presentacion === 'barras-horizontales'
        || presentacion === 'barras-verticales'
        || presentacion === 'donut' ? (
          <GraficoSerie visualizacion={visualizacion} presentacion={presentacion} />
        ) : null}
      {presentacion === 'kpi' ? null : <TablaSerie visualizacion={visualizacion} />}
    </div>
  );
}

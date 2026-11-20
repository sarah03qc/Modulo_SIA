/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-18.
 * Modificación: 2026-11-20. Selección de una categoría del gráfico.
 * Integración modular de ECharts. La tabla equivalente vive fuera del gráfico.
 */
import { useEffect, useRef } from 'react';
import { init, use as registrarECharts } from 'echarts/core';
import { BarChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TooltipComponent
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';

registrarECharts([
  BarChart,
  PieChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  SVGRenderer
]);

export function GraficoECharts({
  descripcion,
  opciones,
  altura = '16rem',
  alElegir = null
}) {
  const contenedor = useRef(null);
  const instancia = useRef(null);

  useEffect(() => {
    const elemento = contenedor.current;
    if (!elemento) {
      return undefined;
    }
    let grafico = null;
    let observador = null;
    try {
      grafico = init(elemento, null, { renderer: 'svg' });
      instancia.current = grafico;
      if (typeof ResizeObserver === 'function') {
        observador = new ResizeObserver(([entrada]) => {
          if (entrada.contentRect.width > 0 && entrada.contentRect.height > 0) {
            grafico.resize();
          }
        });
        observador.observe(elemento);
      }
    } catch {
      instancia.current = null;
      return undefined;
    }
    return () => {
      if (observador) {
        observador.disconnect();
      }
      grafico.dispose();
      instancia.current = null;
    };
  }, []);

  useEffect(() => {
    if (!instancia.current) {
      return;
    }
    try {
      instancia.current.setOption({
        ...opciones,
        animation: false,
        textStyle: { fontFamily: 'Arial, Helvetica, sans-serif' },
        tooltip: { ...opciones.tooltip, renderMode: 'richText' }
      }, { notMerge: true });
      instancia.current.off('click');
      if (alElegir) {
        instancia.current.on('click', (evento) => {
          if (evento && evento.name) {
            alElegir(evento.name);
          }
        });
      }
    } catch {
      /* El gráfico no se dibuja si el entorno no admite SVG. */
    }
  }, [alElegir, opciones]);

  return (
    <div role="img" aria-label={descripcion}>
      <div
        className="sia-visual-grafico grafico-analitico"
        style={{ height: altura }}
        ref={contenedor}
        aria-hidden="true"
      />
    </div>
  );
}

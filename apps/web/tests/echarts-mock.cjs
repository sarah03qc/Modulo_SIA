/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-18.
 * Jest no ejecuta el ESM de ECharts. La tabla equivalente se prueba sin el motor.
 */
'use strict';

function init() {
  return {
    setOption() {},
    resize() {},
    dispose() {}
  };
}

function use() {}

class Grafico {}
class Componente {}
class Renderizador {}

module.exports = {
  init,
  use,
  BarChart: Grafico,
  PieChart: Grafico,
  GridComponent: Componente,
  LegendComponent: Componente,
  TooltipComponent: Componente,
  SVGRenderer: Renderizador
};

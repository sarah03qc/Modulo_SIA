import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GraficoECharts } from '../../src/componentes/visualizacion/GraficoECharts';
import {
  ElegirVistaAnalitica,
  FORMATO_NUMERICO
} from '../../src/componentes/visualizacion/perfil-visual';
import '../../src/estilos/tokens-visuales.css';
import '../../src/estilos/patrones-visuales.css';
import './laboratorio.css';

const FILAS = [
  { etiqueta: 'Grupo A', cantidad: 36 },
  { etiqueta: 'Grupo B', cantidad: 28 },
  { etiqueta: 'Grupo C', cantidad: 20 }
];

const PESTANAS = [
  { id: 'grafico', etiqueta: 'Gráfico' },
  { id: 'tabla', etiqueta: 'Tabla' }
];

const TECLA_A_PESTANA = {
  ArrowLeft: (indice) => (indice + PESTANAS.length - 1) % PESTANAS.length,
  ArrowRight: (indice) => (indice + 1) % PESTANAS.length,
  Home: () => 0,
  End: () => PESTANAS.length - 1
};

function PresentarCantidad(cantidad) {
  return FORMATO_NUMERICO.format(cantidad);
}

function DemostrarBarras() {
  const [opciones, establecerOpciones] = useState(null);

  useEffect(() => {
    const estilos = getComputedStyle(document.body);
    const primerPlano = estilos.getPropertyValue('--sia-texto-secundario').trim();
    const morado = estilos.getPropertyValue('--sia-grafico-primario').trim();
    const blanco = estilos.getPropertyValue('--sia-superficie').trim();
    const borde = estilos.getPropertyValue('--sia-borde').trim();
    const tipografia = estilos.getPropertyValue('--sia-tipografia').trim();

    establecerOpciones({
      color: [morado],
      grid: { left: 76, right: 26, top: 8, bottom: 36 },
      textStyle: { fontFamily: tipografia, fontSize: 14 },
      xAxis: {
        type: 'value',
        minInterval: 1,
        splitNumber: 4,
        axisLabel: { color: primerPlano, formatter: PresentarCantidad },
        splitLine: { lineStyle: { color: borde } }
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: FILAS.map(({ etiqueta }) => etiqueta),
        axisLabel: { color: primerPlano, fontSize: 14 },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      tooltip: { trigger: 'item', confine: true, valueFormatter: PresentarCantidad },
      series: [{
        name: 'Registros',
        type: 'bar',
        data: FILAS.map(({ cantidad }) => cantidad),
        barMaxWidth: 30,
        itemStyle: { borderRadius: [0, 4, 4, 0] },
        label: {
          show: true,
          position: 'insideRight',
          color: blanco,
          fontSize: 14,
          formatter: ({ value }) => PresentarCantidad(value)
        }
      }]
    });
  }, []);

  return opciones && (
    <GraficoECharts
      descripcion="Barras horizontales de registros por grupo. Los valores están en la vista Tabla."
      opciones={opciones}
    />
  );
}

function MostrarTablaSintetica() {
  return (
    <table className="sia-visual-tabla">
      <caption>Datos de demostración</caption>
      <thead>
        <tr>
          <th scope="col">Grupo</th>
          <th scope="col" className="sia-visual-cantidad">Registros</th>
        </tr>
      </thead>
      <tbody>
        {FILAS.map(({ etiqueta, cantidad }) => (
          <tr key={etiqueta}>
            <th scope="row">{etiqueta}</th>
            <td className="sia-visual-cantidad">{PresentarCantidad(cantidad)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const COMPONENTE_DEMO = {
  'barras-horizontales': DemostrarBarras,
  tabla: MostrarTablaSintetica
};
const VistaAnalitica = COMPONENTE_DEMO[ElegirVistaAnalitica('BARRAS')];

function LaboratorioVisual() {
  const [pestanaActiva, establecerPestana] = useState('grafico');

  function NavegarPestanas(evento, indice) {
    if (!Object.hasOwn(TECLA_A_PESTANA, evento.key)) {
      return;
    }
    evento.preventDefault();
    const siguiente = PESTANAS[TECLA_A_PESTANA[evento.key](indice)];
    document.getElementById(`pestana-${siguiente.id}`).focus();
  }

  return (
    <main className="laboratorio-visual">
      <header className="laboratorio-encabezado">
        <h1>Laboratorio de interfaz</h1>
        <p>Comparación de registros por grupo con datos sintéticos.</p>
      </header>
      <section className="sia-visual-panel" aria-labelledby="titulo-visualizacion">
        <div className="laboratorio-resumen">
          <div>
            <h2 id="titulo-visualizacion">Registros por grupo</h2>
            <p>Seleccione Tabla para consultar los valores exactos.</p>
          </div>
          <div className="laboratorio-pestanas" role="tablist" aria-label="Vista de los datos">
            {PESTANAS.map(({ id, etiqueta }, indice) => (
              <button
                key={id}
                className="sia-visual-control"
                id={`pestana-${id}`}
                type="button"
                role="tab"
                aria-selected={pestanaActiva === id}
                aria-controls={`panel-${id}`}
                tabIndex={pestanaActiva === id ? 0 : -1}
                onClick={() => establecerPestana(id)}
                onFocus={() => establecerPestana(id)}
                onKeyDown={(evento) => NavegarPestanas(evento, indice)}
              >
                {etiqueta}
              </button>
            ))}
          </div>
        </div>
        {PESTANAS.map(({ id }) => (
          <div
            key={id}
            className="laboratorio-visualizacion"
            id={`panel-${id}`}
            role="tabpanel"
            aria-labelledby={`pestana-${id}`}
            tabIndex={0}
            hidden={pestanaActiva !== id}
          >
            {pestanaActiva === id && (id === 'grafico' ? (
              <VistaAnalitica />
            ) : (
              <MostrarTablaSintetica />
            ))}
          </div>
        ))}
      </section>
    </main>
  );
}

createRoot(document.getElementById('raiz')).render(
  <StrictMode><LaboratorioVisual /></StrictMode>
);

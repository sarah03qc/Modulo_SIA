/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * HU-038. Presenta el formato de cada visualización sin recalcular el indicador.
 */
import { Vacio } from '../../componentes/interfaz';

const COLORES = ['#663366', '#0f6e6e', '#8a5a2b', '#3f6212', '#1d4e89', '#7a1f3d'];

function Maximo(serie) {
  return serie.reduce((mayor, fila) => Math.max(mayor, fila.cantidad), 0);
}

function ColorCobertura(porcentaje) {
  const tono = Math.round((Number(porcentaje) / 100) * 140);
  return `hsl(${tono} 42% 28%)`;
}

function Gradiente(serie) {
  const total = serie.reduce((suma, fila) => suma + fila.cantidad, 0);
  if (total <= 0) {
    return 'transparent';
  }
  let acumulado = 0;
  const tramos = serie.map((fila, indice) => {
    const inicio = acumulado;
    acumulado += (fila.cantidad / total) * 100;
    const color = COLORES[indice % COLORES.length];
    return `${color} ${inicio}% ${acumulado}%`;
  });
  return `conic-gradient(${tramos.join(', ')})`;
}

function TablaSerie({ visualizacion }) {
  if (visualizacion.serie.length === 0) {
    return null;
  }
  return (
    <table>
      <caption className="solo-lectura">{visualizacion.titulo}</caption>
      <thead>
        <tr>
          <th scope="col">Categoría</th>
          <th scope="col">Cantidad</th>
        </tr>
      </thead>
      <tbody>
        {visualizacion.serie.map((fila) => (
          <tr key={fila.clave || fila.etiqueta}>
            <th scope="row">{fila.etiqueta}</th>
            <td>{fila.cantidad}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Barras({ visualizacion }) {
  const maximo = Maximo(visualizacion.serie);
  return (
    <div>
      <ul className="barras">
        {visualizacion.serie.map((fila) => (
          <li key={fila.clave || fila.etiqueta}>
            <span>{fila.etiqueta}</span>
            <span className="barra-pista" aria-hidden="true">
              <span
                className="barra-valor"
                style={{ width: maximo === 0 ? '0%' : `${(fila.cantidad / maximo) * 100}%` }}
              />
            </span>
            <span>{fila.cantidad}</span>
          </li>
        ))}
      </ul>
      <TablaSerie visualizacion={visualizacion} />
    </div>
  );
}

function Nube({ visualizacion }) {
  const maximo = Maximo(visualizacion.serie);
  return (
    <div>
      <p className="nube" aria-hidden="true">
        {visualizacion.serie.map((fila) => {
          const escala = maximo === 0 ? 1 : 0.85 + (fila.cantidad / maximo) * 1.35;
          return (
            <span key={fila.etiqueta} style={{ fontSize: `${escala}rem` }}>
              {fila.etiqueta}
            </span>
          );
        })}
      </p>
      <TablaSerie visualizacion={visualizacion} />
    </div>
  );
}

function Circular({ visualizacion }) {
  return (
    <div className="circular-bloque">
      <div
        className="circular"
        style={{ background: Gradiente(visualizacion.serie) }}
        role="img"
        aria-label={visualizacion.titulo}
      />
      <ul className="leyenda">
        {visualizacion.serie.map((fila, indice) => (
          <li key={fila.clave || fila.etiqueta}>
            <span
              className="muestra-color"
              style={{ background: COLORES[indice % COLORES.length] }}
              aria-hidden="true"
            />
            {fila.etiqueta}: {fila.cantidad}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Kpi({ visualizacion }) {
  if (visualizacion.estado === 'SIN_CASOS_ACTIVOS') {
    return <p className="kpi-cifra">{visualizacion.mensaje}</p>;
  }
  if (visualizacion.formato === 'KPI_PORCENTAJE') {
    return (
      <p
        className="kpi-cifra"
        style={{ background: ColorCobertura(visualizacion.porcentaje) }}
      >
        {visualizacion.porcentaje} %
        <span className="kpi-detalle">
          {visualizacion.numerador} de {visualizacion.denominador}
        </span>
      </p>
    );
  }
  return (
    <p className="kpi-cifra kpi-cantidad">
      {visualizacion.numerador}
      <span className="kpi-detalle">personas únicas del numerador</span>
    </p>
  );
}

export default function GraficoReporteria({ visualizacion }) {
  if (visualizacion.estado !== 'CON_DATOS') {
    return <Vacio texto={visualizacion.mensaje || 'Información no disponible.'} />;
  }
  if (visualizacion.formato === 'BARRAS' || visualizacion.formato === 'DISTRIBUCION') {
    return <Barras visualizacion={visualizacion} />;
  }
  if (visualizacion.formato === 'TABLA' || visualizacion.formato === 'NUBE') {
    return visualizacion.formato === 'NUBE'
      ? <Nube visualizacion={visualizacion} />
      : <TablaSerie visualizacion={visualizacion} />;
  }
  if (visualizacion.formato === 'CIRCULAR') {
    return <Circular visualizacion={visualizacion} />;
  }
  return <Kpi visualizacion={visualizacion} />;
}

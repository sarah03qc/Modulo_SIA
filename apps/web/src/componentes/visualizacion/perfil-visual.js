// Selección de presentación para una futura integración con HU-038.
// Mantiene cada serie y cada indicador tal como fueron entregados por la API.
const VISTA_POR_FORMATO = Object.freeze({
  BARRAS: 'barras-horizontales',
  DISTRIBUCION: 'barras-verticales',
  TABLA: 'tabla',
  NUBE: 'tabla',
  CIRCULAR: 'donut',
  KPI_PORCENTAJE: 'kpi',
  KPI_CANTIDAD: 'kpi'
});

export const FORMATO_NUMERICO = new Intl.NumberFormat('es-CR');

export function ElegirVistaAnalitica(formato) {
  return Object.hasOwn(VISTA_POR_FORMATO, formato) ? VISTA_POR_FORMATO[formato] : 'tabla';
}

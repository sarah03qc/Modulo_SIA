/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * HU-050. HTML provisional: el formato institucional definitivo sigue pendiente.
 * No es la consolidación tabular de HU-039 ni el reporte individual de HU-030.
 */
'use strict';

const { TEXTO_COBERTURA } = require('./definiciones-analiticas');

function Escapar(valor) {
  return String(valor == null ? '' : valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function SerieVisible(visualizacion) {
  return (visualizacion.serie || []).filter((fila) => (
    !String(fila.etiqueta || '').startsWith('[meta] ')
  ));
}

function Filas(visualizacion) {
  const serie = SerieVisible(visualizacion);
  if (serie.length === 0) {
    return '';
  }
  const maximo = serie.reduce((mayor, fila) => Math.max(mayor, Number(fila.cantidad) || 0), 0);
  const cuerpo = serie.map((fila) => {
    const ancho = maximo === 0 ? 0 : Math.round(((Number(fila.cantidad) || 0) / maximo) * 100);
    return '<tr>'
      + `<th scope="row">${Escapar(fila.etiqueta)}</th>`
      + `<td>${Escapar(fila.cantidad)}</td>`
      + '<td><span class="pista" aria-hidden="true">'
      + `<span class="valor" style="width:${ancho}%"></span></span></td>`
      + '</tr>';
  }).join('');
  return '<table><thead><tr>'
    + '<th scope="col">Categoría</th><th scope="col">Cantidad</th>'
    + '<th scope="col">Proporción</th></tr></thead><tbody>'
    + cuerpo
    + '</tbody></table>';
}

function Indicador(visualizacion) {
  if (visualizacion.formato === 'KPI_PORCENTAJE') {
    if (visualizacion.porcentaje == null) {
      return `<p class="kpi">${Escapar(visualizacion.mensaje || 'No aplica.')}</p>`;
    }
    return `<p class="kpi">${Escapar(visualizacion.porcentaje)} % `
      + `(${Escapar(visualizacion.numerador)} de ${Escapar(visualizacion.denominador)})</p>`;
  }
  if (visualizacion.formato === 'KPI_CANTIDAD') {
    return `<p class="kpi">${Escapar(visualizacion.numerador)} `
      + 'personas únicas del numerador</p>';
  }
  if (visualizacion.estado !== 'CON_DATOS') {
    return `<p>${Escapar(visualizacion.mensaje || 'Sin información para este corte.')}</p>`;
  }
  return Filas(visualizacion);
}

function Persistencia(opciones) {
  if (opciones.historico) {
    return `<p>Registro histórico: ${Escapar(opciones.informeId)}. `
      + 'Este archivo se reconstruyó desde la instantánea conservada. '
      + 'No vuelve a consultar el corte vigente.</p>';
  }
  if (opciones.persistido) {
    const reintento = opciones.reintento
      ? ' Este archivo se regeneró desde la instantánea ya registrada.'
      : '';
    return `<p>Registro histórico: ${Escapar(opciones.informeId)}.${Escapar(reintento)} `
      + 'Un reintento con la misma operación no crea otro informe.</p>';
  }
  const motivo = opciones.persistencia === 'PENDIENTE_TABLA'
    ? 'la tabla del informe no está disponible'
    : opciones.persistencia === 'PENDIENTE_PERMISO'
      ? 'falta el permiso de escritura del informe'
      : 'falta el permiso de escritura o la tabla del informe';
  return '<p>Este archivo contiene la instantánea del corte y los análisis redactados. '
    + `El registro histórico en SIA no quedó guardado: ${motivo}. `
    + 'No se ejecutó un script de permisos.</p>';
}

/**
 * Arma el informe analítico a partir del modelo ya validado.
 *
 * @param {object} modelo Identificación, corte y análisis.
 * @param {object} opciones Estado de la persistencia.
 * @returns {string} Documento HTML autónomo.
 */
function CrearDocumentoInforme(modelo, opciones = {}) {
  const bloques = modelo.visualizaciones.map((item) => (
    '<section>'
    + `<h2>${Escapar(item.numero)}. ${Escapar(item.titulo)}</h2>`
    + `<p>${Escapar(item.fechaAplicada || '')}</p>`
    + `<p>Filtros pertinentes: ${Escapar(item.filtrosTexto || 'Ninguno adicional.')}</p>`
    + (item.nota ? `<p>${Escapar(item.nota)}</p>` : '')
    + Indicador(item)
    + '<h3>Análisis</h3>'
    + `<p class="analisis">${Escapar(item.analisis)}</p>`
    + '</section>'
  )).join('');
  return '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">'
    + '<meta http-equiv="Content-Security-Policy" '
    + 'content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;;">'
    + `<title>${Escapar(modelo.titulo)}</title>`
    + '<style>'
    + 'body{font-family:Segoe UI,sans-serif;color:#1d1a17;margin:2rem;}'
    + 'h1{font-size:1.6rem;} h2{margin-top:2rem;font-size:1.2rem;}'
    + 'table{border-collapse:collapse;width:100%;margin:1rem 0;}'
    + 'th,td{border:1px solid #d9d3cc;padding:.4rem .6rem;text-align:left;}'
    + '.pista{display:block;background:#efeae4;height:.7rem;}'
    + '.valor{display:block;background:#663366;height:.7rem;}'
    + '.kpi{font-size:1.8rem;font-weight:700;}'
    + '.analisis{white-space:pre-wrap;}'
    + '.aviso{border:1px solid #d9d3cc;padding:.8rem;}'
    + '</style></head><body>'
    + `<h1>${Escapar(modelo.titulo)}</h1>`
    + '<p>Informe analítico de HU-050. No es la consolidación tabular de HU-039 '
    + 'ni el reporte individual de un caso de HU-030. '
    + 'El formato institucional definitivo sigue pendiente de confirmación. '
    + 'Esta salida provisional es HTML autónomo.</p>'
    + '<dl>'
    + `<dt>Responsable</dt><dd>${Escapar(modelo.responsable)}</dd>`
    + `<dt>Rol</dt><dd>${Escapar(modelo.rol)}</dd>`
    + `<dt>Unidad</dt><dd>${Escapar(modelo.unidad)}</dd>`
    + `<dt>Ámbito</dt><dd>${Escapar(modelo.ambito)}</dd>`
    + `<dt>Oficina local</dt><dd>${Escapar(modelo.oficinaLocalId)}</dd>`
    + `<dt>Región</dt><dd>${Escapar(modelo.regionId)}</dd>`
    + `<dt>Fecha y hora local</dt><dd>${Escapar(modelo.fechaHoraLocal)}</dd>`
    + `<dt>Fecha calendario del corte</dt><dd>${Escapar(modelo.fechaCalendario)}</dd>`
    + `<dt>Zona horaria</dt><dd>${Escapar(modelo.zonaHoraria)} `
    + `(${Escapar(modelo.estadoZona)})</dd>`
    + `<dt>Período</dt><dd>${Escapar(modelo.anio)}</dd>`
    + `<dt>Filtros</dt><dd>${Escapar(modelo.filtrosVisibles || modelo.filtrosResumen)}</dd>`
    + '</dl>'
    + Persistencia(opciones)
    + '<section class="aviso">'
    + `<p>Personas únicas atendidas: ${Escapar(modelo.personasUnicas)}. `
    + `Total de atenciones: ${Escapar(modelo.totalAtenciones)}. `
    + 'Una persona con varias atenciones cuenta una vez en personas únicas. '
    + 'Una grupal con varias personas sigue siendo una actividad.</p>'
    + `<p>${Escapar(TEXTO_COBERTURA)}</p>`
    + '</section>'
    + bloques
    + '</body></html>';
}

module.exports = { CrearDocumentoInforme, Escapar };

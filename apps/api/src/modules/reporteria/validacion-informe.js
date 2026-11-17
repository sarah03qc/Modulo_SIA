/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * HU-050 y CU-38. El análisis lo redacta la persona. El ámbito no viaja en el cuerpo.
 */
'use strict';

const { ErrorProhibido, ErrorValidacion } = require('../../common/errors');

const CLAVES_CUERPO = ['titulo', 'claveOperacion', 'huellaCorte', 'visualizaciones'];
const CLAVES_VISUALIZACION = ['numero', 'analisis'];
const CLAVE = /^[A-Za-z0-9-]{8,64}$/;
const HUELLA = /^[a-f0-9]{64}$/;
const TITULO_MAXIMO = 300;
const ANALISIS_MAXIMO = 4000;
const MINIMO_VISUALIZACIONES = 5;
const MAXIMO_VISUALIZACIONES = 12;

function Texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function RechazarCampos(origen, permitidas, mensaje) {
  if (!origen || typeof origen !== 'object' || Array.isArray(origen)) {
    throw new ErrorValidacion(mensaje);
  }
  for (const clave of Object.keys(origen)) {
    if (!permitidas.includes(clave)) {
      throw new ErrorValidacion(
        'La identidad, el ámbito y las cifras no se aceptan en el informe.'
      );
    }
  }
}

/**
 * Valida la selección contra el corte del servidor.
 * Una visualización no disponible o no autorizada no cuenta.
 *
 * @param {object} cuerpo Cuerpo JSON ya leído.
 * @param {object[]} visualizaciones Catálogo devuelto por la consulta.
 * @returns {object} Pedido listo para armar el documento.
 */
function AfirmarClaveInforme(cuerpo) {
  RechazarCampos(cuerpo, CLAVES_CUERPO, 'El informe no es válido.');
  const claveOperacion = Texto(cuerpo.claveOperacion);
  if (!CLAVE.test(claveOperacion)) {
    throw new ErrorValidacion('La clave de operación del informe no es válida.');
  }
  return claveOperacion;
}

function LeerPedidoInforme(cuerpo, visualizaciones) {
  AfirmarClaveInforme(cuerpo);
  const titulo = Texto(cuerpo.titulo);
  if (titulo.length === 0) {
    throw new ErrorValidacion('El título del informe es obligatorio.');
  }
  if (titulo.length > TITULO_MAXIMO) {
    throw new ErrorValidacion('El título del informe excede la longitud permitida.');
  }
  const claveOperacion = Texto(cuerpo.claveOperacion);
  const huellaCorte = Texto(cuerpo.huellaCorte);
  if (!HUELLA.test(huellaCorte)) {
    throw new ErrorValidacion('La huella del corte no es válida.');
  }
  if (!Array.isArray(cuerpo.visualizaciones)) {
    throw new ErrorValidacion('La selección de visualizaciones no es válida.');
  }
  const catalogo = new Map((visualizaciones || []).map((item) => [item.numero, item]));
  const disponibles = [...catalogo.values()].filter((item) => (
    item.autorizada !== false && item.estado !== 'NO_DISPONIBLE'
  ));
  if (disponibles.length < MINIMO_VISUALIZACIONES) {
    throw new ErrorValidacion(
      'Hay menos de cinco visualizaciones disponibles. No se puede generar el informe.'
    );
  }
  if (
    cuerpo.visualizaciones.length < MINIMO_VISUALIZACIONES
    || cuerpo.visualizaciones.length > MAXIMO_VISUALIZACIONES
  ) {
    throw new ErrorValidacion(
      'Seleccione entre cinco y doce visualizaciones disponibles.'
    );
  }
  const vistas = new Set();
  const seleccion = cuerpo.visualizaciones.map((item) => {
    RechazarCampos(item, CLAVES_VISUALIZACION, 'Una visualización del informe no es válida.');
    const numero = item.numero;
    if (!Number.isInteger(numero) || numero < 1 || numero > 12 || vistas.has(numero)) {
      throw new ErrorValidacion('La selección de visualizaciones no es válida.');
    }
    vistas.add(numero);
    const origen = catalogo.get(numero);
    if (!origen || origen.autorizada === false) {
      throw new ErrorProhibido('Una visualización seleccionada no está autorizada.');
    }
    if (origen.estado === 'NO_DISPONIBLE') {
      throw new ErrorValidacion(
        'Una visualización no disponible no cuenta para el informe.'
      );
    }
    const analisis = Texto(item.analisis);
    if (analisis.length === 0) {
      throw new ErrorValidacion(
        'Cada visualización requiere un análisis redactado. No se genera automáticamente.'
      );
    }
    if (analisis.length > ANALISIS_MAXIMO) {
      throw new ErrorValidacion('Un análisis excede la longitud permitida.');
    }
    return { numero, analisis, origen };
  });
  seleccion.sort((a, b) => a.numero - b.numero);
  return { titulo, claveOperacion, huellaCorte, seleccion };
}

module.exports = {
  MINIMO_VISUALIZACIONES,
  AfirmarClaveInforme,
  LeerPedidoInforme
};

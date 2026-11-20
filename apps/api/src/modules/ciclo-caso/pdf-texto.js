/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-18.
 * PDF de texto para la exportación del expediente, sin una dependencia nueva.
 * No incrusta archivos adjuntos: el inventario va como texto.
 */
'use strict';

const WINANSI = Object.freeze({
  á: 0xE1, é: 0xE9, í: 0xED, ó: 0xF3, ú: 0xFA, ñ: 0xF1, ü: 0xFC,
  Á: 0xC1, É: 0xC9, Í: 0xCD, Ó: 0xD3, Ú: 0xDA, Ñ: 0xD1, Ü: 0xDC,
  '¿': 0xBF, '¡': 0xA1, '«': 0xAB, '»': 0xBB, '–': 0x96, '—': 0x97
});

function Escapar(texto) {
  const bytes = [];
  for (const caracter of String(texto || '')) {
    const especial = WINANSI[caracter];
    const punto = caracter.codePointAt(0);
    const codigo = especial || (punto >= 32 && punto <= 126 ? punto : 0x3F);
    if (codigo === 0x5C || codigo === 0x28 || codigo === 0x29) {
      bytes.push(0x5C);
    }
    bytes.push(codigo);
  }
  return Buffer.from(bytes).toString('latin1');
}

function Partir(texto, ancho) {
  const palabras = String(texto || '').split(/\s+/).filter(Boolean);
  const lineas = [];
  let actual = '';
  for (const palabra of palabras) {
    const candidata = actual ? `${actual} ${palabra}` : palabra;
    if (candidata.length > ancho && actual) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = candidata;
    }
  }
  if (actual) {
    lineas.push(actual);
  }
  return lineas.length > 0 ? lineas : [''];
}

/**
 * Arma un PDF de varias páginas con las secciones autorizadas.
 *
 * @param {object} documento Título, fecha y secciones de texto.
 * @returns {Buffer} Archivo PDF.
 */
function CrearPdfTexto(documento) {
  const lineas = [
    documento.titulo,
    `Generado: ${documento.generadoEn}`,
    'Dirección Nacional de CEN-CINAI — Atención Interdisciplinaria',
    'Documento de consulta. No modifica el caso.',
    ''
  ];
  for (const seccion of documento.secciones || []) {
    lineas.push(seccion.titulo);
    for (const parrafo of seccion.parrafos || []) {
      lineas.push(...Partir(parrafo, 90));
    }
    lineas.push('');
  }
  const porPagina = 44;
  const paginas = [];
  for (let indice = 0; indice < lineas.length; indice += porPagina) {
    paginas.push(lineas.slice(indice, indice + porPagina));
  }
  if (paginas.length === 0) {
    paginas.push(['Sin contenido autorizado.']);
  }
  const idsPagina = paginas.map((_, indice) => 4 + indice * 2);
  const hijos = idsPagina.map((id) => `${id} 0 R`).join(' ');
  const cuerpos = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    `2 0 obj\n<< /Type /Pages /Count ${paginas.length} /Kids [${hijos}] >>\nendobj\n`,
    '3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica'
      + ' /Encoding /WinAnsiEncoding >>\nendobj\n'
  ];
  paginas.forEach((bloque, indice) => {
    const pagina = idsPagina[indice];
    const contenido = pagina + 1;
    const marca = `Página ${indice + 1} de ${paginas.length}`;
    const comandos = ['BT', '/F1 11 Tf', '54 740 Td', '14 TL'];
    bloque.forEach((linea, numero) => {
      if (numero > 0) {
        comandos.push('T*');
      }
      comandos.push(`(${Escapar(linea)}) Tj`);
    });
    comandos.push('ET', 'BT', '/F1 9 Tf', '54 36 Td', `(${Escapar(marca)}) Tj`, 'ET');
    const flujo = comandos.join('\n');
    cuerpos.push(
      `${pagina} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]`
      + ` /Contents ${contenido} 0 R /Resources << /Font << /F1 3 0 R >> >> >>\nendobj\n`
    );
    cuerpos.push(
      `${contenido} 0 obj\n<< /Length ${Buffer.byteLength(flujo, 'latin1')} >>\nstream\n`
      + `${flujo}\nendstream\nendobj\n`
    );
  });
  const partes = [Buffer.from('%PDF-1.4\n', 'latin1')];
  const offsets = [0];
  let cursor = partes[0].length;
  for (const cuerpo of cuerpos) {
    offsets.push(cursor);
    const binario = Buffer.from(cuerpo, 'latin1');
    partes.push(binario);
    cursor += binario.length;
  }
  let xref = `xref\n0 ${cuerpos.length + 1}\n0000000000 65535 f \n`;
  for (let indice = 1; indice < offsets.length; indice += 1) {
    xref += `${String(offsets[indice]).padStart(10, '0')} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${cuerpos.length + 1} /Root 1 0 R >>\n`;
  xref += `startxref\n${cursor}\n%%EOF`;
  partes.push(Buffer.from(xref, 'latin1'));
  return Buffer.concat(partes);
}

module.exports = { CrearPdfTexto };

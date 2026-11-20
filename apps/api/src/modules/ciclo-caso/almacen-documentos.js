/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-18.
 * Guarda el binario fuera del directorio público de la interfaz.
 * La base solo conserva la clave, nunca la ruta absoluta.
 */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const EXTENSIONES = Object.freeze(new Set(['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx']));
const TAMANO_MAXIMO = 5 * 1024 * 1024;
const TIPOS = Object.freeze({
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
});

function Extension(nombre) {
  const base = path.basename(String(nombre || ''));
  const punto = base.lastIndexOf('.');
  if (punto < 1) {
    return '';
  }
  return base.slice(punto + 1).toLowerCase();
}

function CrearAlmacenDocumentos(directorio) {
  const raiz = path.resolve(directorio);

  function RutaSegura(clave) {
    if (!/^[0-9]+\/[a-f0-9]{64}\.[a-z0-9]+$/.test(clave)) {
      throw new Error('La clave de almacenamiento no es válida.');
    }
    const destino = path.resolve(raiz, clave);
    if (!destino.startsWith(`${raiz}${path.sep}`)) {
      throw new Error('La clave de almacenamiento no es válida.');
    }
    return destino;
  }

  return {
    extensionPermitida: Extension,
    Guardar(casoId, nombre, contenido) {
      const extension = Extension(nombre);
      if (!EXTENSIONES.has(extension)) {
        const error = new Error('El tipo de archivo no está permitido.');
        error.code = 'VALIDACION';
        throw error;
      }
      if (!Buffer.isBuffer(contenido) || contenido.length === 0
        || contenido.length > TAMANO_MAXIMO) {
        const error = new Error('El archivo está vacío o supera el tamaño permitido.');
        error.code = 'VALIDACION';
        throw error;
      }
      const hash = crypto.createHash('sha256').update(contenido).digest('hex');
      const clave = `${casoId}/${hash}.${extension}`;
      const destino = RutaSegura(clave);
      fs.mkdirSync(path.dirname(destino), { recursive: true });
      const yaExistia = fs.existsSync(destino);
      if (!yaExistia) {
        const temporal = `${destino}.parcial`;
        fs.writeFileSync(temporal, contenido);
        fs.renameSync(temporal, destino);
      }
      return {
        clave,
        hash,
        tamano: contenido.length,
        duplicadoEnDisco: yaExistia,
        nombre: path.basename(String(nombre))
      };
    },
    Leer(clave) {
      return fs.readFileSync(RutaSegura(clave));
    },
    Eliminar(clave) {
      const destino = RutaSegura(clave);
      if (fs.existsSync(destino)) {
        fs.unlinkSync(destino);
      }
    },
    Tipo(clave) {
      const extension = Extension(clave);
      return TIPOS[extension] || 'application/octet-stream';
    }
  };
}

module.exports = {
  CrearAlmacenDocumentos,
  EXTENSIONES,
  TAMANO_MAXIMO
};

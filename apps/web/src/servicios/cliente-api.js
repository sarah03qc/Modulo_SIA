/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-14.
 * El navegador solo habla con la API. No consulta SQL Server.
 */

export class ErrorDeApi extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.name = 'ErrorDeApi';
    this.estado = estado;
  }
}

/**
 * Llama a la API con la identidad sintética de desarrollo.
 * Devuelve JSON, null o un archivo, según la opción.
 */
export async function SolicitarApi(direccionApi, ruta, opciones = {}) {
  const encabezados = new Headers(opciones.encabezados || {});
  if (opciones.identidad) {
    encabezados.set('Authorization', `Bearer ${opciones.identidad}`);
  }
  let cuerpo = opciones.cuerpo;
  if (opciones.json !== undefined) {
    encabezados.set('Content-Type', 'application/json');
    cuerpo = JSON.stringify(opciones.json);
  }
  let respuesta;
  try {
    respuesta = await fetch(`${direccionApi}${ruta}`, {
      method: opciones.metodo || 'GET',
      headers: encabezados,
      body: cuerpo
    });
  } catch {
    throw new ErrorDeApi('No fue posible comunicarse con la API.', 0);
  }
  if (opciones.archivo) {
    if (!respuesta.ok) {
      const textoError = await respuesta.text();
      let mensaje = 'No fue posible obtener el archivo.';
      try {
        const datosError = JSON.parse(textoError);
        if (datosError && datosError.error && datosError.error.message) {
          mensaje = datosError.error.message;
        }
      } catch {
        mensaje = 'No fue posible obtener el archivo.';
      }
      throw new ErrorDeApi(mensaje, respuesta.status);
    }
    return {
      blob: await respuesta.blob(),
      nombre: NombreDeArchivo(respuesta.headers.get('Content-Disposition')),
      persistencia: respuesta.headers.get('X-Persistencia-Informe'),
      informeId: respuesta.headers.get('X-Informe-Id')
    };
  }
  if (respuesta.status === 204) {
    return null;
  }
  const texto = await respuesta.text();
  let datos = null;
  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      throw new ErrorDeApi('La respuesta no pudo interpretarse.', respuesta.status);
    }
  }
  if (!respuesta.ok) {
    const mensaje = datos && datos.error && datos.error.message
      ? datos.error.message
      : 'La solicitud no se completó.';
    throw new ErrorDeApi(mensaje, respuesta.status);
  }
  return datos;
}

export function DescargarArchivo(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre || 'archivo';
  enlace.click();
  URL.revokeObjectURL(url);
}

function NombreDeArchivo(disposicion) {
  if (typeof disposicion !== 'string') {
    return 'archivo';
  }
  const coincidencia = /filename="([^"]+)"/.exec(disposicion);
  return coincidencia ? coincidencia[1] : 'archivo';
}

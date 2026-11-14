/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Primer registro del archivo en Git: 2026-11-06 (5fabddc).
 * Modificación del 2026-11-14: exclusión de rutas con datos de solicitudes en el registro.
 */
'use strict';

const { ErrorNoEncontrado } = require('./errors');

/**
 * Obtiene el patrón registrado en Express para el diagnóstico.
 * Una solicitud sin ruta reconocida se registra con un valor fijo.
 *
 * @param {object} req Solicitud de Express.
 * @returns {string} Patrón declarado por el servidor, sin valores de la solicitud.
 */
/**
 * Descarta los bytes crudos y luego continúa.
 * No interpreta JSON ni el libro. Esperar el fin evita cortar la respuesta.
 *
 * @param {object} req Solicitud de Express.
 * @param {Function} alTerminar Continuación, normalmente next con el error.
 * @returns {void}
 */
function DescartarCuerpoNoProcesado(req, alTerminar) {
  const continuar = typeof alTerminar === 'function' ? alTerminar : () => {};
  if (!req || req.readableEnded || typeof req.resume !== 'function') {
    continuar();
    return;
  }
  let cerrado = false;
  const finalizar = () => {
    if (cerrado) {
      return;
    }
    cerrado = true;
    continuar();
  };
  req.on('end', finalizar);
  req.on('error', finalizar);
  req.resume();
}

function ObtenerPatronRuta(req) {
  const patron = req.route?.path;
  return typeof patron === 'string' ? patron : 'SIN_RUTA';
}

/**
 * Convierte una ruta desconocida en el error de recurso no encontrado.
 */
function ResponderRutaNoEncontrada(req, res, next) {
  next(new ErrorNoEncontrado());
}

/**
 * Responde los errores sin filtrar detalles internos.
 *
 * Si el error está marcado para mostrarse, usa su código y su mensaje.
 * En cualquier otro caso responde con un mensaje genérico.
 * Un archivo demasiado grande o un JSON inválido se tratan como error de validación.
 *
 * @param {object} registro Registro con operaciones info y error.
 * @returns {Function} Middleware de errores de Express.
 */
function CrearControlErrores(registro) {
  return function ControlarError(err, req, res, next) {
    if (res.headersSent) {
      next(err);
      return;
    }

    if (err && err.type === 'entity.too.large') {
      registro.info('Solicitud rechazada', {
        code: 'VALIDATION_ERROR',
        status: 413,
        path: ObtenerPatronRuta(req)
      });
      res.status(413).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'El archivo supera el tamaño permitido.'
        }
      });
      return;
    }

    if (err instanceof SyntaxError && err.status === 400) {
      registro.info('Solicitud rechazada', {
        code: 'VALIDATION_ERROR',
        status: 400,
        path: ObtenerPatronRuta(req)
      });
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'El cuerpo de la solicitud no es JSON válido.'
        }
      });
      return;
    }

    const exposed = Boolean(err && err.expose === true && err.status && err.code);
    const status = exposed ? err.status : 500;
    const code = exposed ? err.code : 'INTERNAL_ERROR';
    const message = exposed ? err.message : 'Ocurrió un error interno.';
    const registrar = status >= 500 ? registro.error.bind(registro) : registro.info.bind(registro);
    registrar('Solicitud fallida', { code, status, path: ObtenerPatronRuta(req) });
    res.status(status).json({ error: { code, message } });
  };
}

module.exports = {
  DescartarCuerpoNoProcesado,
  ResponderRutaNoEncontrada,
  CrearControlErrores
};

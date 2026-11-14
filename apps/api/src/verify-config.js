'use strict';

/*
  Comprueba la configuración y escribe un resumen sin secretos.
  Un fallo deja un código de salida distinto de cero.
*/

const { CargarConfiguracion, ResumenPublicoConfiguracion } = require('./config/load-config');

try {
  const summary = ResumenPublicoConfiguracion(CargarConfiguracion(process.env));
  console.log(JSON.stringify({ status: 'ok', summary }));
} catch (error) {
  const message = error instanceof Error ? error.message : 'Configuración inválida.';
  console.error(JSON.stringify({
    status: 'error',
    code: 'INVALID_CONFIGURATION',
    message
  }));
  process.exitCode = 1;
}

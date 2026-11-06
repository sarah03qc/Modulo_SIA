'use strict';

const { loadConfig, publicConfigSummary } = require('./config/load-config');

try {
  const summary = publicConfigSummary(loadConfig(process.env));
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

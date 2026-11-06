'use strict';

const base = (process.env.API_BASE_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');

async function readJson(pathname) {
  const response = await globalThis.fetch(`${base}${pathname}`, {
    signal: AbortSignal.timeout(5000)
  });
  const body = await response.json();
  return { path: pathname, status: response.status, body };
}

function serializeReport(report) {
  const serialized = JSON.stringify(report);
  if (/password|secret|connectionstring/i.test(serialized)) {
    throw new Error('La comprobación de salud iba a imprimir material sensible.');
  }
  return serialized;
}

async function main() {
  const health = await readJson('/health');
  const ready = await readJson('/ready');
  console.log(serializeReport({ health, ready }));
  if (health.status !== 200 || health.body.status !== 'ok') {
    process.exitCode = 1;
    return;
  }
  if (ready.status !== 200 || ready.body.status !== 'ready') {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: 'error',
    message: error instanceof Error ? error.message : 'No se pudo comprobar la API.'
  }));
  process.exitCode = 1;
});

'use strict';

const { spawn } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const children = [];
const logs = [];

function start(script) {
  const child = spawn(`npm run ${script}`, {
    cwd: root,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  const record = (chunk) => {
    logs.push(String(chunk));
    if (logs.join('').length > 20000) {
      logs.shift();
    }
  };
  child.stdout.on('data', record);
  child.stderr.on('data', record);
  children.push(child);
  return child;
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function stop() {
  await Promise.all(children.map((child) => new Promise((resolve) => {
    if (!child.pid) {
      resolve();
      return;
    }
    const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    killer.on('exit', () => resolve());
    killer.on('error', () => resolve());
  })));
}

async function readWhenReady(url, accept, timeoutMs) {
  const started = Date.now();
  let lastError = 'sin respuesta';
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      const text = await response.text();
      let body = text;
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
      if (accept(response, body)) {
        return { status: response.status, body };
      }
      lastError = `respuesta no aceptada (${response.status})`;
    } catch (error) {
      const cause = error && error.cause && error.cause.code ? error.cause.code : '';
      lastError = `${error instanceof Error ? error.name : 'error de red'}${cause ? ` ${cause}` : ''}`;
    }
    await delay(500);
  }
  throw new Error(`Tiempo agotado al consultar ${url}: ${lastError}`);
}

async function main() {
  start('dev:api');
  start('dev:web');

  const health = await readWhenReady(
    'http://127.0.0.1:3001/health',
    (response, body) => response.status === 200 && body.status === 'ok',
    30000
  );
  const ready = await readWhenReady(
    'http://127.0.0.1:3001/ready',
    (response, body) => response.status === 200 && body.status === 'ready',
    30000
  );
  const web = await readWhenReady(
    'http://127.0.0.1:5174/',
    (response, body) => response.status === 200 && String(body).includes('SIA-CENCINAI'),
    90000
  );
  const corsResponse = await fetch('http://127.0.0.1:3001/health', {
    headers: { Origin: 'http://127.0.0.1:5174' }
  });
  if (corsResponse.headers.get('access-control-allow-origin') !== 'http://127.0.0.1:5174') {
    throw new Error('CORS no refleja el origen de la web.');
  }

  const report = {
    health,
    ready,
    web: { status: web.status, titlePresent: true },
    corsOrigin: corsResponse.headers.get('access-control-allow-origin')
  };
  const serialized = JSON.stringify(report);
  if (/password|secret|connectionstring/i.test(serialized)) {
    throw new Error('La comprobación iba a imprimir material sensible.');
  }
  console.log(serialized);
}

function safeLogTail() {
  const text = logs.join('').slice(-4000);
  if (/password|secret|connectionstring/i.test(text)) {
    return 'Registro omitido porque contenía material sensible.';
  }
  return text;
}

main()
  .catch((error) => {
    console.error(JSON.stringify({
      status: 'error',
      message: error instanceof Error ? error.message : 'Fallo de arranque.',
      logTail: safeLogTail()
    }));
    process.exitCode = 1;
  })
  .finally(stop);

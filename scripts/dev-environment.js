'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pidFile = path.join(root, '.local', 'dev-processes.json');
const envFile = path.join(root, 'apps', 'api', '.env');

function readPids() {
  if (!fs.existsSync(pidFile)) {
    return [];
  }
  try {
    const data = JSON.parse(fs.readFileSync(pidFile, 'utf8'));
    return Array.isArray(data.pids) ? data.pids : [];
  } catch {
    return [];
  }
}

function killPid(pid) {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      try {
        process.kill(pid, 'SIGTERM');
      } catch {
        // El proceso ya no existe.
      }
      resolve();
      return;
    }
    const killer = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
    killer.on('exit', () => resolve());
    killer.on('error', () => resolve());
  });
}

async function stop() {
  const pids = readPids();
  await Promise.all(pids.map(killPid));
  if (fs.existsSync(pidFile)) {
    fs.rmSync(pidFile, { force: true });
  }
  console.log(JSON.stringify({ status: 'stopped', count: pids.length }));
}

function start() {
  if (!fs.existsSync(envFile)) {
    console.error('Falta apps/api/.env. Copie apps/api/.env.example y complete los valores locales.');
    process.exitCode = 1;
    return;
  }

  stop().then(() => {
    fs.mkdirSync(path.dirname(pidFile), { recursive: true });
    const pids = [];
    for (const script of ['dev:api', 'dev:web']) {
      const child = spawn(`npm run ${script}`, {
        cwd: root,
        stdio: 'inherit',
        shell: true
      });
      if (child.pid) {
        pids.push(child.pid);
      }
    }
    fs.writeFileSync(pidFile, JSON.stringify({ pids }));
    console.log(JSON.stringify({ status: 'started', pids }));

    const shutdown = () => {
      stop().finally(() => process.exit(0));
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }).catch((error) => {
    console.error(JSON.stringify({
      status: 'error',
      message: error instanceof Error ? error.message : 'No se pudo iniciar el entorno.'
    }));
    process.exitCode = 1;
  });
}

const command = process.argv[2];
if (command === 'start') {
  start();
} else if (command === 'stop') {
  stop();
} else {
  console.error('Uso: node scripts/dev-environment.js <start|stop>');
  process.exitCode = 1;
}

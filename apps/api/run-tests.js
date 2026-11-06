'use strict';

const { spawnSync } = require('child_process');

const jestBin = require.resolve('jest/bin/jest');
const result = spawnSync(process.execPath, [jestBin, '--runInBand', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: process.env,
  cwd: __dirname
});

process.exit(result.status === null ? 1 : result.status);

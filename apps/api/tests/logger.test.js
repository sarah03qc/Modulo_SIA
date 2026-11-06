'use strict';

const { createLogger } = require('../src/common/logger');

describe('logger', () => {
  test('redacta secretos y no imprime el valor', () => {
    const lines = [];
    const original = console.error;
    console.error = (line) => lines.push(line);
    try {
      createLogger('error').error('fallo de acceso', {
        password: 'sia-secret-value',
        driverCode: 'ELOGIN'
      });
    } finally {
      console.error = original;
    }

    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('[redacted]');
    expect(lines[0]).toContain('ELOGIN');
    expect(lines[0]).not.toContain('sia-secret-value');
  });
});

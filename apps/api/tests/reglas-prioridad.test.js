'use strict';

const { CalcularPrioridadRn009, MATRIZ_RN009 } = require(
  '../src/modules/proceso-interdisciplinario/reglas-prioridad'
);

describe('RN-009', () => {
  test('calcula las nueve combinaciones confirmadas y ninguna otra', () => {
    expect(CalcularPrioridadRn009('ALTO', 'BAJA')).toBe('ALTO');
    expect(CalcularPrioridadRn009('ALTO', 'MODERADA')).toBe('ALTO');
    expect(CalcularPrioridadRn009('ALTO', 'ALTA')).toBe('MODERADO');
    expect(CalcularPrioridadRn009('MODERADO', 'BAJA')).toBe('ALTO');
    expect(CalcularPrioridadRn009('MODERADO', 'MODERADA')).toBe('MODERADO');
    expect(CalcularPrioridadRn009('MODERADO', 'ALTA')).toBe('MODERADO');
    expect(CalcularPrioridadRn009('BAJO', 'BAJA')).toBe('MODERADO');
    expect(CalcularPrioridadRn009('BAJO', 'MODERADA')).toBe('BAJO');
    expect(CalcularPrioridadRn009('BAJO', 'ALTA')).toBe('BAJO');
    expect(Object.keys(MATRIZ_RN009)).toHaveLength(9);
    expect(CalcularPrioridadRn009('ALTO', 'MEDIA')).toBeNull();
  });
});

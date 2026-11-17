'use strict';

const {
  FechaCalendarioLocal,
  FechaHoraLocal
} = require('../src/common/fecha-local');

describe('fecha calendario de Costa Rica', () => {
  test('antes de la medianoche local no usa el día UTC siguiente', () => {
    const instante = new Date('2026-11-17T05:59:59.000Z');
    expect(FechaCalendarioLocal(instante)).toBe('2026-11-16');
    expect(FechaHoraLocal(instante)).toBe('2026-11-16T23:59:59');
  });

  test('la medianoche local abre el día nuevo y no conserva la hora 24', () => {
    const instante = new Date('2026-11-17T06:00:00.000Z');
    expect(FechaCalendarioLocal(instante)).toBe('2026-11-17');
    expect(FechaHoraLocal(instante)).toBe('2026-11-17T00:00:00');
  });

  test('el mediodía local permanece en el mismo calendario', () => {
    const instante = new Date('2026-11-16T18:00:00.000Z');
    expect(FechaCalendarioLocal(instante)).toBe('2026-11-16');
    expect(FechaHoraLocal(instante)).toBe('2026-11-16T12:00:00');
  });
});

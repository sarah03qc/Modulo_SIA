'use strict';

const request = require('supertest');
const { CrearAplicacion } = require('../src/app');
const { CargarConfiguracion } = require('../src/config/load-config');
const { EntornoValido } = require('./env-fixture');

function Aplicacion(proceso) {
  const config = CargarConfiguracion(EntornoValido());
  return CrearAplicacion({
    config,
    databases: { sia: { Sondear: jest.fn() } },
    adapter: { ComprobarDisponibilidad: jest.fn(async () => ({ available: true, readOnly: true })) },
    references: {
      ListarCatalogos: jest.fn(),
      DescargarPlantilla: jest.fn(),
      PrecargarPlantilla: jest.fn(),
      ValidarReferencia: jest.fn(),
      EnviarReferencia: jest.fn(),
      ListarReferencias: jest.fn(),
      ObtenerReferencia: jest.fn(),
      ImprimirReferencia: jest.fn(),
      GuardarBorrador: jest.fn(),
      ListarBorradores: jest.fn(),
      EliminarBorrador: jest.fn()
    },
    proceso,
    logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() }
  });
}

describe('HTTP del proceso interdisciplinario', () => {
  test('exige sesión y niega la sesión al establecimiento', async () => {
    const proceso = { CrearSesion: jest.fn() };
    const app = Aplicacion(proceso);
    expect((await request(app).post('/api/proceso/sesiones').send({})).status).toBe(401);
    const respuesta = await request(app)
      .post('/api/proceso/sesiones')
      .set('Authorization', 'Bearer dev-establecimiento-unico')
      .send({ fecha: '2026-11-20', horaInicio: '08:00', horaFin: '09:00', disciplinas: [] });
    expect(respuesta.status).toBe(403);
    expect(proceso.CrearSesion).not.toHaveBeenCalled();
  });

  test('rechaza una prioridad enviada por el cliente', async () => {
    const proceso = { CalcularPrioridad: jest.fn() };
    const app = Aplicacion(proceso);
    const respuesta = await request(app)
      .post('/api/proceso/prioridad')
      .set('Authorization', 'Bearer dev-oficina-hatillo')
      .send({ riesgoCodigo: 'ALTO', proteccionCodigo: 'BAJA', prioridadCodigo: 'BAJO' });
    expect(respuesta.status).toBe(400);
    expect(proceso.CalcularPrioridad).not.toHaveBeenCalled();
  });

  test('la oficina calcula la prioridad y el establecimiento no exporta casos', async () => {
    const proceso = {
      CalcularPrioridad: jest.fn(async () => ({
        prioridadCodigo: 'ALTO',
        prioridadEtiqueta: 'Alto',
        editable: false
      })),
      ExportarCasos: jest.fn()
    };
    const app = Aplicacion(proceso);
    const prioridad = await request(app)
      .post('/api/proceso/prioridad')
      .set('Authorization', 'Bearer dev-oficina-hatillo')
      .send({ riesgoCodigo: 'ALTO', proteccionCodigo: 'BAJA' });
    expect(prioridad.status).toBe(200);
    expect(prioridad.body.editable).toBe(false);
    const exportacion = await request(app)
      .get('/api/proceso/casos/exportacion')
      .set('Authorization', 'Bearer dev-establecimiento-unico');
    expect(exportacion.status).toBe(403);
    expect(proceso.ExportarCasos).not.toHaveBeenCalled();
  });
});

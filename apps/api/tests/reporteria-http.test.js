'use strict';

const request = require('supertest');
const { CrearAplicacion } = require('../src/app');
const { CargarConfiguracion } = require('../src/config/load-config');
const { EntornoValido } = require('./env-fixture');

function Aplicacion(reporteria) {
  const config = CargarConfiguracion(EntornoValido());
  return CrearAplicacion({
    config,
    databases: { sia: { Sondear: jest.fn() } },
    adapter: {
      ComprobarDisponibilidad: jest.fn(async () => ({ available: true, readOnly: true }))
    },
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
    proceso: { ObtenerContexto: jest.fn() },
    reporteria,
    logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() }
  });
}

describe('HTTP de reportería', () => {
  test('exige sesión y niega el establecimiento', async () => {
    const reporteria = { ConsultarOficina: jest.fn() };
    const app = Aplicacion(reporteria);
    expect((await request(app).get('/api/reporteria/oficina')).status).toBe(401);
    const respuesta = await request(app)
      .get('/api/reporteria/oficina')
      .set('Authorization', 'Bearer dev-establecimiento-unico');
    expect(respuesta.status).toBe(403);
    expect(reporteria.ConsultarOficina).not.toHaveBeenCalled();
  });

  test('rechaza una oficina enviada en la consulta', async () => {
    const reporteria = { ConsultarOficina: jest.fn(async () => ({ visualizaciones: [] })) };
    const app = Aplicacion(reporteria);
    const respuesta = await request(app)
      .get('/api/reporteria/oficina?anio=2026&oficinaLocalId=999')
      .set('Authorization', 'Bearer dev-oficina-hatillo');
    expect(respuesta.status).toBe(400);
    expect(reporteria.ConsultarOficina).not.toHaveBeenCalled();
  });

  test('la oficina consulta y la descarga no es el informe analítico', async () => {
    const reporteria = {
      ConsultarOficina: jest.fn(async () => ({ visualizaciones: [] })),
      DescargarConsolidacion: jest.fn(async () => Buffer.from('libro'))
    };
    const app = Aplicacion(reporteria);
    const consulta = await request(app)
      .get('/api/reporteria/oficina?anio=2026&estado=ACTIVO')
      .set('Authorization', 'Bearer dev-oficina-hatillo');
    expect(consulta.status).toBe(200);
    expect(reporteria.ConsultarOficina).toHaveBeenCalledWith(
      expect.objectContaining({ localOfficeId: 101, regionId: 1 }),
      expect.objectContaining({ anio: 2026, estado: 'ACTIVO', establecimientoId: null })
    );
    const archivo = await request(app)
      .get('/api/reporteria/oficina/consolidacion?anio=2026')
      .set('Authorization', 'Bearer dev-oficina-hatillo');
    expect(archivo.status).toBe(200);
    expect(archivo.headers['content-disposition']).toMatch(/consolidacion-oficina-local.xlsx/);
    expect(reporteria.DescargarConsolidacion).toHaveBeenCalled();
  });
});

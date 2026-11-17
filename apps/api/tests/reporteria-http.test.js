'use strict';

const request = require('supertest');
const { ErrorNoEncontrado } = require('../src/common/errors');
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

  test('el informe analítico no sustituye la consolidación y niega el establecimiento', async () => {
    const reporteria = {
      GenerarInforme: jest.fn(async () => ({
        contenido: Buffer.from('<html>informe</html>'),
        persistencia: 'REGISTRADO',
        informeId: 7
      })),
      ConsultarInformeHistorico: jest.fn(async (acceso) => {
        if (acceso.localOfficeId !== 101) {
          throw new ErrorNoEncontrado('El informe no está disponible en este ámbito.');
        }
        return {
          contenido: Buffer.from('<html>instantanea</html>'),
          persistencia: 'REGISTRADO',
          informeId: 10005,
          historico: true
        };
      })
    };
    const app = Aplicacion(reporteria);
    const negado = await request(app)
      .post('/api/reporteria/oficina/informe')
      .set('Authorization', 'Bearer dev-establecimiento-unico')
      .send({ titulo: 'Informe' });
    expect(negado.status).toBe(403);
    expect(reporteria.GenerarInforme).not.toHaveBeenCalled();
    const ajena = await request(app)
      .post('/api/reporteria/oficina/informe?oficinaLocalId=501')
      .set('Authorization', 'Bearer dev-oficina-hatillo')
      .send({ titulo: 'Informe' });
    expect(ajena.status).toBe(400);
    const archivo = await request(app)
      .post('/api/reporteria/oficina/informe?anio=2026')
      .set('Authorization', 'Bearer dev-oficina-hatillo')
      .send({ titulo: 'Informe', claveOperacion: 'informe-prueba-01' });
    expect(archivo.status).toBe(200);
    expect(archivo.headers['content-type']).toMatch(/text\/html/);
    expect(archivo.headers['content-disposition']).toMatch(/informe-analitico-oficina-local.html/);
    expect(archivo.headers['x-persistencia-informe']).toBe('REGISTRADO');
    expect(archivo.text).toContain('informe');
    expect(archivo.headers['content-disposition']).not.toMatch(/consolidacion/);
    const historico = await request(app)
      .get('/api/reporteria/oficina/informe/10005')
      .set('Authorization', 'Bearer dev-oficina-hatillo');
    expect(historico.status).toBe(200);
    expect(historico.headers['x-origen-informe']).toBe('INSTANTANEA');
    expect(historico.headers['x-persistencia-informe']).toBe('REGISTRADO');
    const ajeno = await request(app)
      .get('/api/reporteria/oficina/informe/10005')
      .set('Authorization', 'Bearer dev-oficina-perez-zeledon');
    expect(ajeno.status).toBe(404);
    const negadoHistorico = await request(app)
      .get('/api/reporteria/oficina/informe/10005')
      .set('Authorization', 'Bearer dev-establecimiento-unico');
    expect(negadoHistorico.status).toBe(403);
    expect(reporteria.GenerarInforme).toHaveBeenCalledWith(
      expect.objectContaining({ localOfficeId: 101 }),
      expect.objectContaining({ anio: 2026 }),
      expect.objectContaining({
        titulo: 'Informe',
        claveOperacion: 'informe-prueba-01'
      })
    );
  });
});

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

  test('Regional consulta y exporta sin heredar un rol enviado por el cliente', async () => {
    const proceso = {
      ListarCasos: jest.fn(async () => ({ total: 0, devueltos: 0, items: [] })),
      ExportarCasos: jest.fn(async () => ({ contenido: 'identificacion\n', total: 0 })),
      ObtenerConsultaCaso: jest.fn(async () => ({ modo: 'CONSULTA', soloLectura: true })),
      ObtenerCaso: jest.fn(),
      AbrirCaso: jest.fn()
    };
    const app = Aplicacion(proceso);
    const lista = await request(app)
      .get('/api/proceso/casos')
      .set('Authorization', 'Bearer dev-region-central-sur')
      .set('X-Rol', 'NACIONAL');
    expect(lista.status).toBe(200);
    expect(proceso.ListarCasos.mock.calls[0][0].accessLevel).toBe('REGION');
    expect(proceso.ListarCasos.mock.calls[0][0].regionId).toBe(1);
    const exportacion = await request(app)
      .get('/api/proceso/casos/exportacion?regionId=5')
      .set('Authorization', 'Bearer dev-region-brunca');
    expect(exportacion.status).toBe(200);
    expect(proceso.ExportarCasos.mock.calls[0][0].accessLevel).toBe('REGION');
    expect(proceso.ExportarCasos.mock.calls[0][0].regionId).toBe(5);
    expect(proceso.ExportarCasos.mock.calls[0][1].regionId).toBe(5);
    const detalle = await request(app)
      .get('/api/proceso/casos/4')
      .set('Authorization', 'Bearer dev-nacional');
    expect(detalle.status).toBe(200);
    expect(proceso.ObtenerConsultaCaso).toHaveBeenCalled();
    expect(proceso.ObtenerCaso).not.toHaveBeenCalled();
    const apertura = await request(app)
      .post('/api/proceso/casos')
      .set('Authorization', 'Bearer dev-nacional')
      .send({ referenciaId: 1 });
    expect(apertura.status).toBe(403);
    expect(proceso.AbrirCaso).not.toHaveBeenCalled();
    const atencion = await request(app)
      .post('/api/atenciones/individuales')
      .set('Authorization', 'Bearer dev-region-central-sur')
      .send({});
    expect(atencion.status).toBe(403);
    const cierre = await request(app)
      .post('/api/ciclo/cierres')
      .set('Authorization', 'Bearer dev-nacional')
      .send({});
    expect(cierre.status).toBe(403);
    const directo = await request(app).get('/api/proceso/casos');
    expect(directo.status).toBe(401);
  });
});

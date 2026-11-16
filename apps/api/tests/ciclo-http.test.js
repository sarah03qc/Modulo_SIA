'use strict';

const request = require('supertest');
const { CrearAplicacion } = require('../src/app');
const { CargarConfiguracion } = require('../src/config/load-config');
const { EntornoValido } = require('./env-fixture');

function Aplicacion(ciclo) {
  const config = CargarConfiguracion(EntornoValido());
  return CrearAplicacion({
    config,
    databases: { sia: { Sondear: jest.fn() } },
    adapter: { ComprobarDisponibilidad: jest.fn(async () => ({ available: true, readOnly: true })) },
    proceso: { ObtenerCaso: jest.fn() },
    ciclo,
    logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() }
  });
}

describe('HTTP del ciclo del caso', () => {
  test('exige sesión y niega el cierre al establecimiento', async () => {
    const ciclo = { CerrarCaso: jest.fn() };
    const app = Aplicacion(ciclo);
    expect((await request(app).post('/api/ciclo/cierres').send({})).status).toBe(401);
    const respuesta = await request(app)
      .post('/api/ciclo/cierres')
      .set('Authorization', 'Bearer dev-establecimiento-unico')
      .send({
        casoId: 40,
        motivoItemId: 1,
        fechaCierre: '2026-11-16',
        claveOperacion: 'clave-cierre-01'
      });
    expect(respuesta.status).toBe(403);
    expect(ciclo.CerrarCaso).not.toHaveBeenCalled();
  });

  test('rechaza la coordinación inválida y conserva la válida', async () => {
    const ciclo = {
      RegistrarCoordinacion: jest.fn(async () => ({
        repetida: false,
        estadoCaso: 'ACTIVO',
        coordinacion: { coordinacionId: 9 }
      }))
    };
    const app = Aplicacion(ciclo);
    const invalida = await request(app)
      .post('/api/ciclo/coordinaciones')
      .set('Authorization', 'Bearer dev-oficina-hatillo')
      .send({ casoId: 40, fecha: '2026-11-16' });
    expect(invalida.status).toBe(400);
    const valida = await request(app)
      .post('/api/ciclo/coordinaciones')
      .set('Authorization', 'Bearer dev-oficina-hatillo')
      .send({
        casoId: 40,
        institucionTexto: 'Centro de salud',
        fecha: '2026-11-16',
        motivo: 'Consulta conjunta',
        estadoTexto: 'Realizada',
        claveOperacion: 'clave-coord-01'
      });
    expect(valida.status).toBe(201);
    expect(valida.body.coordinacion.coordinacionId).toBe(9);
    expect(ciclo.RegistrarCoordinacion).toHaveBeenCalledTimes(1);
  });

  test('un reintento de cierre responde 200 con el mismo efecto', async () => {
    const ciclo = {
      CerrarCaso: jest.fn(async () => ({
        repetida: true,
        efecto: 'CIERRE',
        casoDestinoCreado: false,
        estadoCaso: 'CERRADO',
        mensaje: 'El caso quedó cerrado. Generar un reporte no era requisito.',
        cierre: { motivoCodigo: 'CIERRE_SATISFACTORIO' }
      }))
    };
    const app = Aplicacion(ciclo);
    const respuesta = await request(app)
      .post('/api/ciclo/cierres')
      .set('Authorization', 'Bearer dev-oficina-hatillo')
      .send({
        casoId: 40,
        motivoItemId: 1,
        fechaCierre: '2026-11-16',
        claveOperacion: 'clave-cierre-01'
      });
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.casoDestinoCreado).toBe(false);
  });
});

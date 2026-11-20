'use strict';

const { CargarConfiguracion } = require('../src/config/load-config');
const { CrearPasarelaBases } = require('../src/infrastructure/database/sql-client');
const { CrearAdaptadorSidinacc } = require('../src/infrastructure/integrations/sidinacc-adapter');
const { CrearContextoUsuario } = require('../src/infrastructure/auth/user-context');
const { CrearRepositorioReporteria } = require('../src/modules/reporteria/repositorio-reporteria');
const { CrearServicioReporteria } = require('../src/modules/reporteria/servicio-reporteria');

const FILTROS = {
  anio: 2026,
  establecimientoId: null,
  estado: 'TODOS',
  prioridad: null,
  disciplinaId: null,
  profesional: null,
  sexo: null,
  edad: null
};

function Acceso() {
  return CrearContextoUsuario({
    source: 'SYNTHETIC_DEVELOPMENT',
    principalId: 'dev-oficina-hatillo',
    grants: [{ role: 'OFICINA_LOCAL', regionId: 1, localOfficeId: 101 }]
  });
}

describe('reportería contra SQL Server local', () => {
  let bases;
  let servicio;

  beforeAll(async () => {
    if (!process.env.SIA_DB_SERVER) {
      return;
    }
    const config = CargarConfiguracion(process.env);
    bases = CrearPasarelaBases(config);
    servicio = CrearServicioReporteria({
      repositorio: CrearRepositorioReporteria(bases.sia),
      adaptador: CrearAdaptadorSidinacc(bases.sidinacc)
    });
  });

  afterAll(async () => {
    if (bases) {
      await bases.close();
    }
  });

  test('las cifras coinciden con consultas independientes y el estado no cambia D', async () => {
    if (!bases) {
      return;
    }
    const respuesta = await servicio.ConsultarOficina(Acceso(), FILTROS);
    const cerrado = await servicio.ConsultarOficina(Acceso(), { ...FILTROS, estado: 'CERRADO' });
    const sql = await bases.sia.query(`
SELECT
  (
    SELECT COUNT(DISTINCT caso.per_id_persona)
    FROM dbo.caso_ai AS caso
    WHERE caso.oficina_local_id = 101
      AND caso.region_id = 1
      AND caso.estado = N'ACTIVO'
  ) AS denominador,
  (
    SELECT COUNT(*)
    FROM (
      SELECT activo.per_id_persona
      FROM dbo.caso_ai AS activo
      INNER JOIN dbo.ate_individual AS individual
        ON individual.caso_id = activo.caso_id
       AND individual.fecha_atencion >= '20260101'
       AND individual.fecha_atencion < '20270101'
      WHERE activo.oficina_local_id = 101
        AND activo.region_id = 1
        AND activo.estado = N'ACTIVO'
      UNION
      SELECT activo.per_id_persona
      FROM dbo.caso_ai AS activo
      INNER JOIN dbo.ate_grupal_participante AS participante
        ON participante.caso_id = activo.caso_id
       AND participante.asistio = 1
      INNER JOIN dbo.ate_grupal AS grupal
        ON grupal.atencion_grupal_id = participante.atencion_grupal_id
       AND grupal.fecha_atencion >= '20260101'
       AND grupal.fecha_atencion < '20270101'
      WHERE activo.oficina_local_id = 101
        AND activo.region_id = 1
        AND activo.estado = N'ACTIVO'
    ) AS numerador
  ) AS numerador,
  (
    SELECT COUNT(*)
    FROM dbo.ate_individual AS individual
    INNER JOIN dbo.caso_ai AS caso
      ON caso.caso_id = individual.caso_id
    WHERE caso.oficina_local_id = 101
      AND caso.region_id = 1
      AND individual.fecha_atencion >= '20260101'
      AND individual.fecha_atencion < '20270101'
  ) AS individuales,
  (
    SELECT COUNT(*)
    FROM dbo.ate_grupal AS grupal
    WHERE grupal.oficina_local_id = 101
      AND grupal.fecha_atencion >= '20260101'
      AND grupal.fecha_atencion < '20270101'
  ) AS grupales,
  (
    SELECT COUNT(*)
    FROM (
      SELECT individual.per_id_persona
      FROM dbo.ate_individual AS individual
      INNER JOIN dbo.caso_ai AS caso
        ON caso.caso_id = individual.caso_id
      WHERE caso.oficina_local_id = 101
        AND caso.region_id = 1
        AND individual.fecha_atencion >= '20260101'
        AND individual.fecha_atencion < '20270101'
      UNION
      SELECT participante.per_id_persona
      FROM dbo.ate_grupal_participante AS participante
      INNER JOIN dbo.ate_grupal AS grupal
        ON grupal.atencion_grupal_id = participante.atencion_grupal_id
      WHERE grupal.oficina_local_id = 101
        AND grupal.fecha_atencion >= '20260101'
        AND grupal.fecha_atencion < '20270101'
        AND participante.asistio = 1
    ) AS personas
  ) AS personas,
  (
    SELECT COUNT(*)
    FROM dbo.ref_referencia AS referencia
    WHERE referencia.oficina_local_id = 101
      AND referencia.region_id = 1
      AND referencia.fecha_referencia >= '20260101'
      AND referencia.fecha_referencia < '20270101'
  ) AS referencias
`);
    const fila = sql[0];
    expect(respuesta.visualizaciones).toHaveLength(12);
    expect(respuesta.cobertura.denominador).toBe(Number(fila.denominador));
    expect(respuesta.cobertura.numerador).toBe(Number(fila.numerador));
    expect(cerrado.cobertura.denominador).toBe(respuesta.cobertura.denominador);
    expect(cerrado.cobertura.numerador).toBe(respuesta.cobertura.numerador);
    expect(respuesta.atencionesIndividuales).toBe(Number(fila.individuales));
    expect(respuesta.atencionesGrupales).toBe(Number(fila.grupales));
    expect(respuesta.totalAtenciones).toBe(Number(fila.individuales) + Number(fila.grupales));
    expect(respuesta.personasUnicas).toBe(Number(fila.personas));
    expect(respuesta.referencias.enviadas).toBe(Number(fila.referencias));
    expect(respuesta.cobertura.texto).toMatch(/provisional/);
    expect(respuesta.cobertura.texto).not.toMatch(/Alina/);
    const ajena = await bases.sia.query(`
SELECT TOP (1) establecimiento_id AS id
FROM dbo.caso_ai
WHERE oficina_local_id <> 101
`);
    if (ajena[0]) {
      await expect(servicio.ConsultarOficina(Acceso(), {
        ...FILTROS,
        establecimientoId: Number(ajena[0].id)
      })).rejects.toMatchObject({ status: expect.any(Number) });
    }
  }, 40000);

  test('Regional y Nacional calculan cobertura sobre su universo, no sumando porcentajes', async () => {
    if (!bases) {
      return;
    }
    const regional = await servicio.ConsultarAmbito(CrearContextoUsuario({
      source: 'SYNTHETIC_DEVELOPMENT',
      principalId: 'dev-region-central-sur',
      grants: [{ role: 'REGION', regionId: 1 }]
    }), FILTROS);
    const nacional = await servicio.ConsultarAmbito(CrearContextoUsuario({
      source: 'SYNTHETIC_DEVELOPMENT',
      principalId: 'dev-nacional',
      grants: [{ role: 'NACIONAL' }]
    }), FILTROS);
    const otra = await servicio.ConsultarAmbito(CrearContextoUsuario({
      source: 'SYNTHETIC_DEVELOPMENT',
      principalId: 'dev-region-brunca',
      grants: [{ role: 'REGION', regionId: 5 }]
    }), FILTROS);
    const sql = await bases.sia.query(`
SELECT
  (
    SELECT COUNT(DISTINCT caso.per_id_persona)
    FROM dbo.caso_ai AS caso
    WHERE caso.region_id = 1 AND caso.estado = N'ACTIVO'
  ) AS denominadorRegion,
  (
    SELECT COUNT(DISTINCT caso.per_id_persona)
    FROM dbo.caso_ai AS caso
    WHERE caso.region_id = 5 AND caso.estado = N'ACTIVO'
  ) AS denominadorOtra,
  (
    SELECT COUNT(DISTINCT caso.per_id_persona)
    FROM dbo.caso_ai AS caso
    WHERE caso.estado = N'ACTIVO'
  ) AS denominadorNacional
`);
    const fila = sql[0];
    expect(regional.visualizaciones).toHaveLength(12);
    expect(regional.cobertura.denominador).toBe(Number(fila.denominadorRegion));
    expect(otra.cobertura.denominador).toBe(Number(fila.denominadorOtra));
    expect(nacional.cobertura.denominador).toBe(Number(fila.denominadorNacional));
    expect(nacional.cobertura.denominador).toBeGreaterThan(regional.cobertura.denominador);
    expect(regional.informeAnalitico.disponible).toBe(false);
    const libro = await servicio.DescargarConsolidacionAmbito(CrearContextoUsuario({
      source: 'SYNTHETIC_DEVELOPMENT',
      principalId: 'dev-region-central-sur',
      grants: [{ role: 'REGION', regionId: 1 }]
    }), FILTROS);
    expect(Buffer.isBuffer(libro)).toBe(true);
    expect(libro.length).toBeGreaterThan(100);
  }, 60000);
});

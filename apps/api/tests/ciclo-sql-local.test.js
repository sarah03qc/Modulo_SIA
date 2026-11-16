'use strict';

const sql = require('mssql');
const { CargarConfiguracion } = require('../src/config/load-config');
const { CrearPasarelaBases } = require('../src/infrastructure/database/sql-client');
const { CrearAdaptadorSidinacc } = require('../src/infrastructure/integrations/sidinacc-adapter');
const { CrearContextoUsuario } = require('../src/infrastructure/auth/user-context');
const { CrearModuloProceso } = require(
  '../src/modules/proceso-interdisciplinario/crear-modulo-proceso'
);
const { CrearModuloCiclo } = require('../src/modules/ciclo-caso/crear-modulo-ciclo');

const placeholder = !process.env.SIA_DB_PASSWORD
  || !process.env.SIDINACC_DB_PASSWORD
  || process.env.SIA_DB_PASSWORD === 'CHANGE_ME'
  || process.env.SIDINACC_DB_PASSWORD === 'CHANGE_ME'
  || !process.env.SIDINACC_PERIOD_ID;

const describeLive = placeholder ? describe.skip : describe;
const CASOS_DEMO = [1304, 1305, 1435, 1775, 1776, 1817, 10089];

function Oficina() {
  return CrearContextoUsuario({
    source: 'SYNTHETIC_DEVELOPMENT',
    principalId: 'dev-oficina-hatillo',
    grants: [{ role: 'OFICINA_LOCAL', regionId: 1, localOfficeId: 101 }]
  });
}

function OtraOficina() {
  return CrearContextoUsuario({
    source: 'SYNTHETIC_DEVELOPMENT',
    principalId: 'dev-oficina-perez-zeledon',
    grants: [{ role: 'OFICINA_LOCAL', regionId: 5, localOfficeId: 501 }]
  });
}

function Establecimiento() {
  return CrearContextoUsuario({
    source: 'SYNTHETIC_DEVELOPMENT',
    principalId: 'dev-establecimiento-unico',
    grants: [{ role: 'ESTABLECIMIENTO', establishmentIds: [1100102] }]
  });
}

describeLive('ciclo del caso contra SQL Server local', () => {
  jest.setTimeout(60000);

  let gateway;
  let servicio;
  let caso;

  beforeAll(async () => {
    const config = CargarConfiguracion(process.env);
    gateway = CrearPasarelaBases(config);
    const adaptador = CrearAdaptadorSidinacc(gateway.sidinacc);
    const proceso = CrearModuloProceso({
      periodId: config.sidinaccPeriodId,
      adapter: adaptador,
      sia: gateway.sia
    });
    servicio = CrearModuloCiclo({
      adapter: adaptador,
      sia: gateway.sia,
      proceso
    });
    const filas = await gateway.sia.query(`
SELECT TOP (1) caso_id, estado
FROM dbo.caso_ai
WHERE oficina_local_id = 101
  AND region_id = 1
  AND estado = N'ACTIVO'
  AND caso_id NOT IN (1304, 1305, 1435, 1775, 1776, 1817, 10089)
ORDER BY caso_id DESC
`);
    caso = filas[0];
  });

  afterAll(async () => {
    if (gateway) {
      await gateway.close();
    }
  });

  test('hay un solo caso activo por persona y el índice nacional existe', async () => {
    const indice = await gateway.sia.query(`
SELECT i.name AS nombre
FROM sys.indexes AS i
INNER JOIN sys.tables AS t
  ON t.object_id = i.object_id
WHERE i.name = N'UX_caso_activo'
  AND t.name = N'caso_ai'
`);
    const duplicados = await gateway.sia.query(`
SELECT COUNT(*) AS total
FROM (
  SELECT per_id_persona
  FROM dbo.caso_ai
  WHERE estado = N'ACTIVO'
  GROUP BY per_id_persona
  HAVING COUNT(*) > 1
) AS repetidos
`);
    expect(indice).toHaveLength(1);
    expect(Number(duplicados[0].total)).toBe(0);
    expect(CASOS_DEMO).not.toContain(Number(caso.caso_id));
  });

  test('una transacción interrumpida no conserva la auditoría de prueba', async () => {
    const marca = 'INTERRUPCION-CICLO-20261116';
    await expect(gateway.sia.EnTransaccion(async (transaccion) => {
      await transaccion.query(`
INSERT INTO dbo.aud_evento (
  ocurrido_en, usuario, rol, accion, entidad, entidad_id, ambito, codigo_cambio
)
VALUES (
  CAST(SYSUTCDATETIME() AS datetime2(0)),
  N'dev-oficina-hatillo', N'OFICINA_LOCAL', N'PRUEBA', N'prueba_interrupcion',
  N'0', N'prueba', @marca
)
`, { marca: { type: sql.NVarChar(80), value: marca } });
      throw new Error('corte de prueba');
    })).rejects.toBeTruthy();
    const filas = await gateway.sia.query(`
SELECT COUNT(*) AS total
FROM dbo.aud_evento
WHERE entidad = N'prueba_interrupcion'
  AND codigo_cambio = @marca
`, { marca: { type: sql.NVarChar(80), value: marca } });
    expect(Number(filas[0].total)).toBe(0);
  });

  test('sin el permiso preparado, coordinación, reporte y cierre no cambian el caso', async () => {
    expect(caso).toBeTruthy();
    const casoId = Number(caso.caso_id);
    const permisos = await gateway.sia.query(`
SELECT
  CONVERT(int, HAS_PERMS_BY_NAME(N'dbo.doc_coordinacion', N'OBJECT', N'INSERT'))
    AS insertar_coordinacion,
  CONVERT(int, HAS_PERMS_BY_NAME(N'dbo.doc_reporte_caso', N'OBJECT', N'SELECT'))
    AS leer_reporte,
  CONVERT(int, HAS_PERMS_BY_NAME(N'ops.cerrar_caso', N'OBJECT', N'EXECUTE'))
    AS ejecutar_cierre
`);
    const permiso = permisos[0];
    const antes = await gateway.sia.query(`
SELECT
  caso.estado,
  (SELECT COUNT(*) FROM dbo.doc_coordinacion WHERE caso_id = caso.caso_id) AS coordinaciones
FROM dbo.caso_ai AS caso
WHERE caso.caso_id = @casoId
`, { casoId: { type: sql.BigInt, value: casoId } });
    const catalogos = await servicio.ListarCatalogos(Oficina());
    const satisfactorio = catalogos.motivosCierre.items.find(
      (item) => item.codigo === 'CIERRE_SATISFACTORIO'
    );
    expect(satisfactorio).toBeTruthy();

    await expect(servicio.RegistrarCoordinacion(Establecimiento(), {
      casoId,
      institucionItemId: null,
      institucionTexto: 'Centro de salud',
      profesional: null,
      fecha: '2026-11-16',
      motivo: 'Consulta de prueba',
      estadoItemId: null,
      estadoTexto: 'Realizada',
      claveOperacion: 'ciclo-prueba-coord-01'
    })).rejects.toMatchObject({ status: 403 });

    await expect(servicio.CerrarCaso(OtraOficina(), {
      casoId,
      motivoItemId: satisfactorio.itemId,
      explicacion: null,
      fechaCierre: '2026-11-16',
      destinoEstablecimientoId: null,
      destinoNombre: null,
      claveOperacion: 'ciclo-prueba-cierre-ajeno'
    })).rejects.toMatchObject({ status: 404 });

    if (permiso.insertar_coordinacion !== 1) {
      await expect(servicio.RegistrarCoordinacion(Oficina(), {
        casoId,
        institucionItemId: null,
        institucionTexto: 'Centro de salud',
        profesional: 'Profesional declarado',
        fecha: '2026-11-16',
        motivo: 'Consulta de prueba',
        estadoItemId: null,
        estadoTexto: 'Realizada',
        claveOperacion: 'ciclo-prueba-coord-02'
      })).rejects.toMatchObject({ status: 503 });
    }

    if (permiso.leer_reporte !== 1) {
      await expect(servicio.RegistrarReporte(Oficina(), {
        casoId,
        tipoProposito: 'Informe de avance',
        motivo: null,
        claveOperacion: 'ciclo-prueba-reporte-01'
      })).rejects.toMatchObject({ status: 503 });
    }

    if (permiso.ejecutar_cierre !== 1) {
      await expect(servicio.CerrarCaso(Oficina(), {
        casoId,
        motivoItemId: satisfactorio.itemId,
        explicacion: null,
        fechaCierre: '2026-11-16',
        destinoEstablecimientoId: null,
        destinoNombre: null,
        claveOperacion: 'ciclo-prueba-cierre-01'
      })).rejects.toMatchObject({ status: 503 });
    }

    const despues = await gateway.sia.query(`
SELECT
  caso.estado,
  (SELECT COUNT(*) FROM dbo.doc_coordinacion WHERE caso_id = caso.caso_id) AS coordinaciones
FROM dbo.caso_ai AS caso
WHERE caso.caso_id = @casoId
`, { casoId: { type: sql.BigInt, value: casoId } });
    expect(despues[0].estado).toBe(antes[0].estado);
    expect(Number(despues[0].coordinaciones)).toBe(Number(antes[0].coordinaciones));
  });
});

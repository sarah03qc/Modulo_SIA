'use strict';

/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-18.
 * Recorre referencias, evaluación, caso, coordinación y cierre contra SQL Server
 * de desarrollo. Se omite si no hay credenciales locales.
 */

const request = require('supertest');
const { CrearAplicacion } = require('../src/app');
const { CargarConfiguracion } = require('../src/config/load-config');
const { CrearPasarelaBases } = require('../src/infrastructure/database/sql-client');
const { CrearAdaptadorSidinacc } = require('../src/infrastructure/integrations/sidinacc-adapter');

const placeholder = !process.env.SIA_DB_PASSWORD
  || !process.env.SIDINACC_DB_PASSWORD
  || process.env.SIA_DB_PASSWORD === 'CHANGE_ME'
  || process.env.SIDINACC_DB_PASSWORD === 'CHANGE_ME'
  || !process.env.SIDINACC_PERIOD_ID;

const describeLive = placeholder ? describe.skip : describe;

function CuerpoReferencia(persona, consecutivo) {
  return {
    personId: persona,
    referenceDate: '2026-11-18',
    attentionRouteCode: 'NO_INMEDIATA',
    originCode: 'VIGILANCIA_TAMIZAJE',
    consecutive: consecutivo,
    motives: [{ code: 'CONDICION_MALNUTRICION' }],
    previousActions: 'Observación en el establecimiento.',
    previousResults: 'Se mantiene el hallazgo.',
    complementaryInformation: 'Dato sintético de la prueba de integración.',
    captureOrigin: 'MANUAL'
  };
}

describeLive('referencias de desarrollo contra SQL Server', () => {
  jest.setTimeout(120000);

  let app;
  let gateway;
  let personasHatillo;
  let personaBrunca;
  let catalogo;

  beforeAll(async () => {
    const config = CargarConfiguracion(process.env);
    gateway = CrearPasarelaBases(config);
    app = CrearAplicacion({
      config,
      databases: gateway,
      adapter: CrearAdaptadorSidinacc(gateway.sidinacc),
      logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() }
    });
    const activas = new Set((await gateway.sia.query(`
      SELECT per_id_persona
      FROM dbo.caso_ai
      WHERE estado = N'ACTIVO'
    `)).map((fila) => fila.per_id_persona));
    async function Personas(establecimiento) {
      const filas = await gateway.sidinacc.query(`
        SELECT TOP 8 person.PER_idPersona AS persona
        FROM dbo.CAF_PERSONA AS person
        INNER JOIN dbo.CAF_FAMILIA_DETALLE AS detalle
          ON detalle.FAM_idFamilia = person.FAM_idFamilia
         AND detalle.RCS_idPeriodo = ${config.sidinaccPeriodId}
        INNER JOIN dbo.RCS_ESTABLECIMIENTO AS establecimiento
          ON establecimiento.EST_idEstablecimiento = detalle.EST_idEstablecimientoActual
        WHERE establecimiento.EST_idEstablecimiento = ${establecimiento}
          AND person.PER_idPersona LIKE N'SYN-%'
          AND person.PER_fechaNacimiento IS NOT NULL
          AND DATEADD(YEAR, 18, CONVERT(date, person.PER_fechaNacimiento))
            > CONVERT(date, '20261105')
        ORDER BY person.PER_idPersona
      `);
      return filas.map((fila) => fila.persona).filter((persona) => !activas.has(persona));
    }
    personasHatillo = await Personas(1100102);
    const brunca = await Personas(6080404);
    personaBrunca = brunca[0] || null;
    const items = await gateway.sia.query(`
      SELECT i.cat_item_id, i.codigo, i.codigo_catalogo
      FROM dbo.cat_item AS i
      INNER JOIN dbo.cat_version AS v
        ON v.cat_version_id = i.cat_version_id AND v.vigente = 1
      WHERE i.activo = 1
        AND i.codigo_catalogo IN (
          N'DISCIPLINA', N'ESTRATEGIA', N'FRECUENCIA',
          N'MODALIDAD_COORDINACION', N'ESTADO_COORDINACION',
          N'INSTITUCION_COORDINACION', N'MOTIVO_CIERRE'
        )
    `);
    catalogo = {
      nutricion: Numero(items, 'DISCIPLINA', 'NUTRICION'),
      estrategia: Numero(items, 'ESTRATEGIA', 'ATENCION_INDIVIDUALIZADA'),
      frecuencia: Codigo(items, 'FRECUENCIA'),
      llamada: Numero(items, 'MODALIDAD_COORDINACION', 'LLAMADA'),
      seguimiento: Numero(items, 'ESTADO_COORDINACION', 'EN_SEGUIMIENTO'),
      ccss: Numero(items, 'INSTITUCION_COORDINACION', 'CCSS'),
      satisfactorio: Numero(items, 'MOTIVO_CIERRE', 'CIERRE_SATISFACTORIO'),
      traslado: Numero(items, 'MOTIVO_CIERRE', 'TRASLADO')
    };
  });

  afterAll(async () => {
    if (gateway) {
      await gateway.close();
    }
  });

  function Autorizada(identidad) {
    const encabezado = { Authorization: `Bearer ${identidad}` };
    return {
      get(ruta) {
        return request(app).get(ruta).set(encabezado);
      },
      post(ruta) {
        return request(app).post(ruta).set(encabezado);
      }
    };
  }

  test('envía, enruta, evalúa y cierra sin mezclar oficinas', async () => {
    expect(personasHatillo.length).toBeGreaterThanOrEqual(3);
    expect(personaBrunca).toBeTruthy();
    const [personaAdmitida, personaTraslado, personaOficina] = personasHatillo;
    const admitida = await Enviar(
      'dev-establecimiento-unico',
      personaAdmitida,
      'DNCC-DRCS-OL101-1100102-REF-980-2026'
    );
    const enHatillo = await Autorizada('dev-oficina-hatillo')
      .get('/api/references')
      .query({ consecutive: admitida.consecutive, status: 'PENDIENTE_REVISION' });
    expect(enHatillo.status).toBe(200);
    expect(enHatillo.body.result.total).toBe(1);
    expect(enHatillo.body.result.items[0].establishment.id).toBe(1100102);
    const enOtra = await Autorizada('dev-oficina-504')
      .get('/api/references')
      .query({ consecutive: admitida.consecutive });
    expect(enOtra.status).toBe(200);
    expect(enOtra.body.result.total).toBe(0);
    const ajena = await Autorizada('dev-oficina-504')
      .get(`/api/references/${admitida.referenceId}`);
    expect(ajena.status).toBeGreaterThanOrEqual(400);

    const caso = await EvaluarYAbrir('dev-oficina-hatillo', admitida.referenceId);
    const yaNoPendiente = await Autorizada('dev-oficina-hatillo')
      .get('/api/references')
      .query({ consecutive: admitida.consecutive, status: 'PENDIENTE_REVISION' });
    expect(yaNoPendiente.body.result.total).toBe(0);
    const historial = await Autorizada('dev-oficina-hatillo')
      .get('/api/references')
      .query({ consecutive: admitida.consecutive, status: 'ADMITIDA_AI' });
    expect(historial.body.result.total).toBe(1);

    const coordinacion = await Autorizada('dev-oficina-hatillo')
      .post('/api/ciclo/coordinaciones')
      .send({
        casoId: caso.casoId,
        institucionItemId: catalogo.ccss,
        modalidadItemId: catalogo.llamada,
        fecha: '2026-11-18',
        motivo: 'Consulta de seguimiento sintético.',
        observaciones: 'La familia confirma la cita.',
        estadoItemId: catalogo.seguimiento,
        claveOperacion: 'coord-en-vivo-980'
      });
    expect(coordinacion.status).toBe(201);
    expect(coordinacion.body.coordinacion.modalidad).toBe('Llamada telefónica');
    expect(coordinacion.body.coordinacion.observaciones)
      .toBe('La familia confirma la cita.');
    expect(coordinacion.body.coordinacion.motivo)
      .toBe('Consulta de seguimiento sintético.');
    const guardada = await gateway.sia.query(`
      SELECT modalidad_item_id, observaciones, motivo
      FROM dbo.doc_coordinacion
      WHERE coordinacion_id = ${coordinacion.body.coordinacion.coordinacionId}
    `);
    expect(Number(guardada[0].modalidad_item_id)).toBe(catalogo.llamada);
    expect(guardada[0].observaciones).toBe('La familia confirma la cita.');
    expect(guardada[0].motivo).not.toContain('Modalidad:');

    const archivo = Buffer.from('%PDF-1.4 sintetico').toString('base64');
    const documento = await Autorizada('dev-oficina-hatillo')
      .post(`/api/ciclo/casos/${caso.casoId}/documentos`)
      .send({
        nombre: 'nota-sintetica.pdf',
        tipoTexto: 'Documento asociado',
        contenidoBase64: archivo,
        claveOperacion: 'doc-en-vivo-980'
      });
    expect(documento.status).toBe(201);
    const descarga = await Autorizada('dev-oficina-hatillo')
      .get(`/api/ciclo/casos/${caso.casoId}/documentos/${documento.body.documentoId}`)
      .buffer(true)
      .parse((respuesta, devolver) => {
        const partes = [];
        respuesta.on('data', (parte) => partes.push(parte));
        respuesta.on('end', () => devolver(null, Buffer.concat(partes)));
      });
    expect(descarga.status).toBe(200);
    expect(descarga.body.slice(0, 5).toString()).toBe('%PDF-');
    const pdf = await Autorizada('dev-oficina-hatillo')
      .get(`/api/ciclo/casos/${caso.casoId}/exportacion`)
      .buffer(true)
      .parse((respuesta, devolver) => {
        const partes = [];
        respuesta.on('data', (parte) => partes.push(parte));
        respuesta.on('end', () => devolver(null, Buffer.concat(partes)));
      });
    expect(pdf.status).toBe(200);
    const texto = pdf.body.toString('latin1');
    expect(texto.startsWith('%PDF-')).toBe(true);
    expect(texto).toContain('nota-sintetica.pdf');

    const cierre = await Autorizada('dev-oficina-hatillo')
      .post('/api/ciclo/cierres')
      .send({
        casoId: caso.casoId,
        motivoItemId: catalogo.satisfactorio,
        fechaCierre: '2026-11-18',
        claveOperacion: 'cierre-en-vivo-980'
      });
    expect(cierre.status).toBe(201);
    const repetirCierre = await Autorizada('dev-oficina-hatillo')
      .post('/api/ciclo/cierres')
      .send({
        casoId: caso.casoId,
        motivoItemId: catalogo.satisfactorio,
        fechaCierre: '2026-11-18',
        claveOperacion: 'cierre-en-vivo-981'
      });
    expect(repetirCierre.status).toBeGreaterThanOrEqual(400);

    const noRequiere = await Enviar(
      'dev-establecimiento-6080404',
      personaBrunca,
      'DNCC-DRBR-OL504-6080404-REF-980-2026'
    );
    const enBrunca = await Autorizada('dev-oficina-504')
      .get('/api/references')
      .query({ consecutive: noRequiere.consecutive, status: 'PENDIENTE_REVISION' });
    expect(enBrunca.body.result.total).toBe(1);
    const noEnHatillo = await Autorizada('dev-oficina-hatillo')
      .get('/api/references')
      .query({ consecutive: noRequiere.consecutive });
    expect(noEnHatillo.body.result.total).toBe(0);
    const decisionAjena = await Autorizada('dev-oficina-hatillo')
      .post('/api/proceso/resoluciones')
      .send({
        referenciaId: noRequiere.referenceId,
        sesionId: 1,
        valoracionId: 1,
        decision: 'NO_REQUIERE_AI',
        justificacion: 'Intento fuera de ámbito.'
      });
    expect(decisionAjena.status).toBeGreaterThanOrEqual(400);
    await EvaluarSinCaso('dev-oficina-504', noRequiere.referenceId);
    const resuelta = await gateway.sia.query(`
      SELECT estado
      FROM dbo.ref_referencia
      WHERE referencia_id = ${noRequiere.referenceId}
    `);
    expect(resuelta[0].estado).toBe('NO_REQUIERE_AI');
    const sinCaso = await gateway.sia.query(`
      SELECT caso_id
      FROM dbo.caso_ai
      WHERE per_id_persona = N'${personaBrunca}' AND estado = N'ACTIVO'
    `);
    expect(sinCaso).toHaveLength(0);

    const deOficina = await Enviar(
      'dev-oficina-hatillo',
      personaOficina,
      'DNCC-DRCS-OL101-1100102-REF-981-2026'
    );
    expect(deOficina.status).toBe('PENDIENTE_REVISION');
    const duplicada = await Autorizada('dev-oficina-hatillo')
      .post('/api/references')
      .send(CuerpoReferencia(personaOficina, 'DNCC-DRCS-OL101-1100102-REF-981-2026'));
    expect(duplicada.status).toBeGreaterThanOrEqual(400);
    const conteo = await gateway.sia.query(`
      SELECT COUNT(*) AS total
      FROM dbo.ref_referencia
      WHERE consecutivo = N'DNCC-DRCS-OL101-1100102-REF-981-2026'
    `);
    expect(Number(conteo[0].total)).toBe(1);
    const sinPermiso = await Autorizada('dev-sin-capacidades')
      .post('/api/references')
      .send(CuerpoReferencia(personaTraslado, 'DNCC-DRCS-OL101-1100102-REF-982-2026'));
    expect(sinPermiso.status).toBe(403);

    const trasladado = await EvaluarYAbrir(
      'dev-oficina-hatillo',
      (await Enviar(
        'dev-establecimiento-unico',
        personaTraslado,
        'DNCC-DRCS-OL101-1100102-REF-982-2026'
      )).referenceId
    );
    const traslado = await Autorizada('dev-oficina-hatillo')
      .post('/api/ciclo/cierres')
      .send({
        casoId: trasladado.casoId,
        motivoItemId: catalogo.traslado,
        explicacion: 'La familia cambia de domicilio.',
        fechaCierre: '2026-11-18',
        destinoEstablecimientoId: 6080404,
        claveOperacion: 'traslado-en-vivo-982'
      });
    expect(traslado.status).toBe(201);
    const origen = await gateway.sia.query(`
      SELECT caso.estado, motivo.codigo
      FROM dbo.caso_ai AS caso
      INNER JOIN dbo.caso_cierre AS cierre ON cierre.caso_id = caso.caso_id
      INNER JOIN dbo.cat_item AS motivo ON motivo.cat_item_id = cierre.motivo_item_id
      WHERE caso.caso_id = ${trasladado.casoId}
    `);
    expect(origen[0].estado).toBe('CERRADO');
    expect(origen[0].codigo).toBe('TRASLADO');
    const activos = await gateway.sia.query(`
      SELECT caso_id
      FROM dbo.caso_ai
      WHERE per_id_persona = N'${personaTraslado}' AND estado = N'ACTIVO'
    `);
    expect(activos).toHaveLength(0);
  });

  async function Enviar(identidad, persona, consecutivo) {
    const respuesta = await Autorizada(identidad)
      .post('/api/references')
      .send(CuerpoReferencia(persona, consecutivo));
    expect(respuesta.status).toBe(201);
    expect(respuesta.body.status).toBe('PENDIENTE_REVISION');
    return respuesta.body;
  }

  async function EvaluarYAbrir(identidad, referenciaId) {
    const evaluada = await Evaluar(identidad, referenciaId, 'REQUIERE_AI', null);
    const apertura = await Autorizada(identidad)
      .post('/api/proceso/casos')
      .send({
        referenciaId,
        propositos: ['Acompañar la situación identificada en la referencia.'],
        estrategias: [catalogo.estrategia],
        disciplinas: [catalogo.nutricion],
        frecuenciaCodigo: catalogo.frecuencia
      });
    expect(apertura.status).toBe(201);
    expect(apertura.body.estado).toBe('ACTIVO');
    expect(evaluada.valoracionId).toBeGreaterThan(0);
    return apertura.body;
  }

  async function EvaluarSinCaso(identidad, referenciaId) {
    await Evaluar(
      identidad,
      referenciaId,
      'NO_REQUIERE_AI',
      'La situación se atiende en el establecimiento y no requiere A.I.'
    );
  }

  async function Evaluar(identidad, referenciaId, decision, justificacion) {
    const sesion = await Autorizada(identidad)
      .post('/api/proceso/sesiones')
      .send({
        fecha: '2026-11-18',
        horaInicio: '08:00',
        horaFin: '09:00',
        lugar: 'Sala sintética',
        disciplinas: [catalogo.nutricion]
      });
    expect(sesion.status).toBe(201);
    const situacion = await Autorizada(identidad)
      .post(`/api/proceso/sesiones/${sesion.body.sesionId}/situaciones`)
      .send({ referenciaId });
    expect(situacion.status).toBe(201);
    const categorias = [3, 4, 5, 6, 7, 8, 9, 10, 11].map((categoriaId) => ({
      categoriaId,
      respuesta: 'NINGUNO',
      factores: []
    }));
    const valoracion = await Autorizada(identidad)
      .post('/api/proceso/valoraciones')
      .send({
        situacionId: situacion.body.situacionId,
        categorias,
        riesgoCodigo: 'BAJO',
        proteccionCodigo: 'MODERADA'
      });
    expect(valoracion.status).toBe(201);
    const resolucion = await Autorizada(identidad)
      .post('/api/proceso/resoluciones')
      .send({
        referenciaId,
        sesionId: sesion.body.sesionId,
        valoracionId: valoracion.body.valoracionId,
        decision,
        justificacion
      });
    expect(resolucion.status).toBe(201);
    return valoracion.body;
  }
});

function Numero(items, catalogoCodigo, codigo) {
  const fila = items.find((item) => item.codigo_catalogo === catalogoCodigo
    && item.codigo === codigo);
  if (!fila) {
    throw new Error(`Falta ${catalogoCodigo} ${codigo}.`);
  }
  return Number(fila.cat_item_id);
}

function Codigo(items, catalogoCodigo) {
  const fila = items.find((item) => item.codigo_catalogo === catalogoCodigo);
  if (!fila) {
    throw new Error(`Falta ${catalogoCodigo}.`);
  }
  return fila.codigo;
}

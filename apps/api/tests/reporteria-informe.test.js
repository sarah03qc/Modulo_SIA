'use strict';

const { CrearContextoUsuario } = require('../src/infrastructure/auth/user-context');
const { CrearDocumentoInforme } = require('../src/modules/reporteria/documento-informe');
const { CrearServicioReporteria } = require('../src/modules/reporteria/servicio-reporteria');
const { LeerPedidoInforme } = require('../src/modules/reporteria/validacion-informe');

function Acceso(rol, extra) {
  return CrearContextoUsuario({
    source: 'SYNTHETIC_DEVELOPMENT',
    principalId: 'dev-oficina-hatillo',
    grants: [{ role: rol, regionId: 1, localOfficeId: 101, ...extra }]
  });
}

function Hechos() {
  return {
    casos: [],
    referencias: [],
    motivosReferencia: [],
    individuales: [],
    grupales: [],
    disciplinasGrupales: [],
    profesionalesGrupales: [],
    participantes: [],
    cancelaciones: [],
    cierres: [],
    ultimasAtenciones: [],
    catalogoTipos: [],
    catalogoDisciplinas: []
  };
}

function Filtros() {
  return {
    anio: 2026,
    establecimientoId: null,
    estado: 'TODOS',
    prioridad: null,
    disciplinaId: null,
    profesional: null,
    sexo: null,
    edad: null
  };
}

function Servicio(informes = {}) {
  return CrearServicioReporteria({
    repositorio: {
      ConsultarHechos: jest.fn(async () => Hechos()),
      BuscarInformePorClave: informes.buscar || jest.fn(async () => null),
      GuardarInforme: informes.guardar || jest.fn(async () => 41)
    },
    adaptador: {
      BuscarEstablecimiento: jest.fn(),
      ListarEstablecimientos: jest.fn(async () => []),
      LeerSexoYNacimiento: jest.fn(async () => [])
    }
  });
}

function Pedido(respuesta, cantidad, extra = {}) {
  return {
    titulo: 'Informe de prueba',
    claveOperacion: 'informe-prueba-01',
    huellaCorte: respuesta.huellaCorte,
    visualizaciones: respuesta.visualizaciones.slice(0, cantidad).map((item, indice) => ({
      numero: item.numero,
      analisis: extra.analisis || `Análisis profesional ${indice + 1}.`
    })),
    ...extra.pedido
  };
}

describe('informe analítico HU-050', () => {
  test('bloquea cuatro visualizaciones y permite de cinco a doce', async () => {
    const servicio = Servicio();
    const acceso = Acceso('OFICINA_LOCAL');
    const respuesta = await servicio.ConsultarOficina(acceso, Filtros());
    const pocas = Pedido(respuesta, 4);
    expect(() => LeerPedidoInforme(pocas, respuesta.visualizaciones))
      .toThrow(/entre cinco y doce/);
    expect(LeerPedidoInforme(Pedido(respuesta, 5), respuesta.visualizaciones).seleccion)
      .toHaveLength(5);
    expect(LeerPedidoInforme(Pedido(respuesta, 12), respuesta.visualizaciones).seleccion)
      .toHaveLength(12);
  });

  test('una no disponible no cuenta y el análisis vacío se rechaza', () => {
    const visualizaciones = [1, 2, 3, 4, 5, 6, 7].map((numero) => ({
      numero,
      estado: numero === 2 ? 'NO_DISPONIBLE' : 'CON_DATOS',
      autorizada: numero !== 7,
      titulo: `Título ${numero}`,
      serie: []
    }));
    const base = {
      titulo: 'Informe',
      claveOperacion: 'informe-prueba-01',
      huellaCorte: 'a'.repeat(64)
    };
    expect(() => LeerPedidoInforme({
      ...base,
      visualizaciones: [1, 2, 3, 4, 5].map((numero) => ({
        numero,
        analisis: 'Texto de análisis'
      }))
    }, visualizaciones)).toThrow(/no disponible/);
    expect(() => LeerPedidoInforme({
      ...base,
      visualizaciones: [1, 3, 4, 5, 7].map((numero) => ({
        numero,
        analisis: 'Texto de análisis'
      }))
    }, visualizaciones)).toThrow(/no está autorizada/);
    expect(() => LeerPedidoInforme({
      ...base,
      titulo: '   ',
      visualizaciones: [1, 3, 4, 5, 6].map((numero) => ({
        numero,
        analisis: '   '
      }))
    }, visualizaciones)).toThrow(/título/);
    expect(() => LeerPedidoInforme({
      ...base,
      visualizaciones: [1, 3, 4, 5, 6].map((numero) => ({
        numero,
        analisis: '   '
      }))
    }, visualizaciones)).toThrow(/análisis redactado/);
    const pocas = visualizaciones.filter((item) => item.numero <= 4);
    expect(() => LeerPedidoInforme({
      ...base,
      visualizaciones: [1, 3, 4].map((numero) => ({
        numero,
        analisis: 'Texto de análisis'
      }))
    }, pocas)).toThrow(/menos de cinco visualizaciones disponibles/);
  });

  test('el documento escapa el análisis y conserva la cobertura sin casos', async () => {
    const servicio = Servicio();
    const acceso = Acceso('OFICINA_LOCAL');
    const respuesta = await servicio.ConsultarOficina(acceso, Filtros());
    const pedido = Pedido(respuesta, 5, {
      analisis: '<script>alert(1)</script>'
    });
    pedido.visualizaciones[0].numero = 11;
    const archivo = await servicio.GenerarInforme(acceso, Filtros(), {
      ...pedido,
      visualizaciones: [11, 6, 7, 9, 10].map((numero) => ({
        numero,
        analisis: numero === 11 ? '<script>alert(1)</script>' : 'Análisis con datos.'
      }))
    });
    const html = archivo.contenido.toString('utf8');
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('Sin casos activos. No aplica.');
    expect(html).toContain('No hay registros en el año seleccionado.');
    expect(html).toContain('HU-050');
    expect(html).not.toContain('consolidacion-oficina-local');
    expect(archivo.persistencia).toBe('REGISTRADO');
  });

  test('el reintento devuelve la instantánea y no vuelve a guardar', async () => {
    const guardado = {
      informeId: 41,
      titulo: 'Informe de prueba',
      responsable: 'dev-oficina-hatillo',
      rol: 'OFICINA_LOCAL',
      unidad: 'Oficina Local',
      ambito: 'OFICINA_LOCAL',
      regionId: 1,
      oficinaLocalId: 101,
      anio: 2026,
      fechaHoraLocal: '2026-11-16T18:30:00',
      fechaCalendario: '2026-11-16',
      zonaHoraria: 'America/Costa_Rica',
      estadoZona: 'NEEDS_VALIDATION',
      filtrosVisibles: 'Año 2026',
      personasUnicas: 0,
      totalAtenciones: 0,
      visualizaciones: [1, 2, 3, 4, 5].map((numero) => ({
        numero,
        titulo: `Título ${numero}`,
        formato: 'TABLA',
        fechaAplicada: 'Fecha',
        estado: 'SIN_INFORMACION',
        mensaje: 'No hay casos en este corte.',
        filtrosTexto: 'Año 2026',
        analisis: `Texto conservado ${numero}`,
        serie: []
      }))
    };
    const buscar = jest.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValue(guardado);
    const guardar = jest.fn(async () => 41);
    const servicio = Servicio({ buscar, guardar });
    const acceso = Acceso('OFICINA_LOCAL');
    const respuesta = await servicio.ConsultarOficina(acceso, Filtros());
    const cuerpo = Pedido(respuesta, 5);
    const primero = await servicio.GenerarInforme(acceso, Filtros(), cuerpo);
    const segundo = await servicio.GenerarInforme(acceso, Filtros(), {
      ...cuerpo,
      visualizaciones: cuerpo.visualizaciones.map((item) => ({
        ...item,
        analisis: 'Texto distinto que no debe reemplazar el primero.'
      }))
    });
    expect(guardar).toHaveBeenCalledTimes(1);
    expect(primero.informeId).toBe(41);
    expect(segundo.reintento).toBe(true);
    expect(segundo.contenido.toString('utf8')).toContain('Texto conservado 1');
    expect(segundo.contenido.toString('utf8')).not.toContain('Texto distinto');
  });

  test('sin permiso entrega el archivo y no lo declara registrado', async () => {
    const guardar = jest.fn(async () => {
      const error = new Error('permiso');
      error.code = 'PERMISO';
      error.domain = true;
      throw error;
    });
    const servicio = Servicio({ guardar });
    const acceso = Acceso('OFICINA_LOCAL');
    const respuesta = await servicio.ConsultarOficina(acceso, Filtros());
    const archivo = await servicio.GenerarInforme(acceso, Filtros(), Pedido(respuesta, 5));
    expect(archivo.persistencia).toBe('PENDIENTE_PERMISO');
    expect(archivo.contenido.toString('utf8')).toContain('no quedó guardado');
  });

  test('rechaza identidad enviada, establecimiento y otra oficina en la huella', async () => {
    const servicio = Servicio();
    await expect(servicio.GenerarInforme(
      Acceso('ESTABLECIMIENTO', { establishmentIds: [1100102], localOfficeId: undefined }),
      Filtros(),
      {}
    )).rejects.toMatchObject({ status: 403 });
    const acceso = Acceso('OFICINA_LOCAL');
    await expect(servicio.GenerarInforme(acceso, Filtros(), {
      titulo: 'Informe',
      claveOperacion: 'informe-prueba-01',
      huellaCorte: 'b'.repeat(64),
      oficinaLocalId: 501,
      visualizaciones: []
    })).rejects.toMatchObject({ status: 400 });
    const respuesta = await servicio.ConsultarOficina(acceso, Filtros());
    await expect(servicio.GenerarInforme(acceso, Filtros(), {
      ...Pedido(respuesta, 5),
      huellaCorte: 'c'.repeat(64)
    })).rejects.toMatchObject({ status: 409 });
  });

  test('la salida provisional no interpreta el análisis', () => {
    const html = CrearDocumentoInforme({
      titulo: 'Corte',
      responsable: 'dev-oficina-hatillo',
      rol: 'OFICINA_LOCAL',
      unidad: 'Oficina Local',
      ambito: 'OFICINA_LOCAL',
      oficinaLocalId: 101,
      regionId: 1,
      fechaHoraLocal: '2026-11-16T18:00:00',
      fechaCalendario: '2026-11-16',
      zonaHoraria: 'America/Costa_Rica',
      estadoZona: 'NEEDS_VALIDATION',
      anio: 2026,
      filtrosVisibles: 'Año 2026',
      personasUnicas: 0,
      totalAtenciones: 0,
      visualizaciones: [{
        numero: 1,
        titulo: 'Casos por establecimiento',
        formato: 'BARRAS',
        fechaAplicada: 'Corte',
        estado: 'CON_DATOS',
        filtrosTexto: 'Año 2026',
        analisis: 'Lectura profesional del gráfico.',
        serie: [{ etiqueta: 'Centro', cantidad: 2, clave: '10' }]
      }]
    }, { persistido: false, persistencia: 'PENDIENTE_PERMISO' });
    expect(html).toContain('Lectura profesional del gráfico.');
    expect(html).toContain('Centro');
    expect(html).toContain('formato institucional definitivo');
  });
});

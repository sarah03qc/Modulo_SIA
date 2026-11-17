'use strict';

const { EnsamblarCorte } = require('../src/modules/reporteria/ensamblar-corte');
const { PorcentajeCobertura } = require('../src/modules/reporteria/definiciones-analiticas');
const {
  TextoCelda,
  AfirmarExportacionCompleta,
  CrearLibroConsolidacion
} = require('../src/modules/reporteria/exportacion-consolidacion');
const { LeerFiltrosReporteria } = require('../src/modules/reporteria/validacion-reporteria');

function Hechos(extra = {}) {
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
    catalogoTipos: [{ itemId: 7, etiqueta: 'Taller', codigo: 'TALLER' }],
    catalogoDisciplinas: [{ itemId: 3, etiqueta: 'Trabajo social', codigo: 'TS' }],
    ...extra
  };
}

function Filtros(extra = {}) {
  return {
    anio: 2026,
    fechaConsulta: '2026-11-16',
    oficinaLocalId: 101,
    regionId: 1,
    establecimientoId: null,
    estado: 'TODOS',
    prioridad: null,
    disciplinaId: null,
    profesional: null,
    sexo: null,
    edad: null,
    catalogoDisciplinas: [{ itemId: 3, etiqueta: 'Trabajo social' }],
    ...extra
  };
}

function Caso(casoId, personaId, extra = {}) {
  return {
    casoId,
    personaId,
    establecimientoId: 10,
    estado: 'ACTIVO',
    prioridad: 'MODERADO',
    ...extra
  };
}

function Individual(atencionId, casoId, personaId, extra = {}) {
  return {
    atencionId,
    casoId,
    personaId,
    establecimientoId: 10,
    disciplinaId: 3,
    profesional: 'prof-1',
    estadoCaso: 'ACTIVO',
    ...extra
  };
}

function Visualizacion(corte, numero) {
  return corte.visualizaciones.find((item) => item.numero === numero);
}

describe('definiciones analíticas de reportería', () => {
  test('una persona con varias atenciones cuenta una vez y cada atención cuenta', () => {
    const corte = EnsamblarCorte(Hechos({
      casos: [Caso(1, 'p1')],
      individuales: [
        Individual(1, 1, 'p1'),
        Individual(2, 1, 'p1')
      ]
    }), Filtros(), new Map(), new Map());
    expect(corte.personasUnicas).toBe(1);
    expect(corte.totalAtenciones).toBe(2);
    expect(corte.atencionesIndividuales).toBe(2);
    expect(corte.cobertura.numerador).toBe(1);
    expect(corte.cobertura.denominador).toBe(1);
  });

  test('la grupal cuenta una vez y solo la asistencia efectiva suma personas', () => {
    const corte = EnsamblarCorte(Hechos({
      casos: [Caso(1, 'p1'), Caso(2, 'p2'), Caso(3, 'p3'), Caso(4, 'p4')],
      grupales: [{ atencionId: 8, establecimientoId: 10, tipoId: 7, tipoEtiqueta: 'Taller' }],
      participantes: [
        { atencionId: 8, personaId: 'p1', casoId: 1, asistio: true },
        { atencionId: 8, personaId: 'p2', casoId: 2, asistio: 1 },
        { atencionId: 8, personaId: 'p3', casoId: 3, asistio: false },
        { atencionId: 8, personaId: 'p4', casoId: 4, asistio: null }
      ]
    }), Filtros(), new Map(), new Map());
    expect(corte.atencionesGrupales).toBe(1);
    expect(corte.totalAtenciones).toBe(1);
    expect(corte.personasUnicas).toBe(2);
    expect(corte.cobertura.numerador).toBe(2);
    expect(corte.cobertura.denominador).toBe(4);
    expect(Visualizacion(corte, 8).serie.some((fila) => fila.etiqueta === 'Taller')).toBe(true);
  });

  test('la atención de un caso cerrado no entra al numerador del caso activo', () => {
    const corte = EnsamblarCorte(Hechos({
      casos: [
        Caso(2, 'q', { estado: 'ACTIVO' }),
        Caso(9, 'q', { estado: 'CERRADO' })
      ],
      individuales: [Individual(1, 9, 'q', { estadoCaso: 'CERRADO' })]
    }), Filtros(), new Map(), new Map());
    expect(corte.cobertura.denominador).toBe(1);
    expect(corte.cobertura.numerador).toBe(0);
    expect(corte.personasUnicas).toBe(1);
    expect(corte.cobertura.porcentaje).toBe(0);
  });

  test('el ejemplo 10 de 25 produce 40 por ciento', () => {
    const casos = [];
    const individuales = [];
    for (let indice = 1; indice <= 25; indice += 1) {
      casos.push(Caso(indice, `n${indice}`));
      if (indice <= 10) {
        individuales.push(Individual(indice, indice, `n${indice}`));
      }
    }
    const corte = EnsamblarCorte(
      Hechos({ casos, individuales }),
      Filtros(),
      new Map(),
      new Map()
    );
    expect(corte.cobertura.denominador).toBe(25);
    expect(corte.cobertura.numerador).toBe(10);
    expect(corte.cobertura.porcentaje).toBe(40);
    expect(PorcentajeCobertura(10, 25)).toBe(40);
    expect(PorcentajeCobertura(1, 0)).toBeNull();
  });

  test('sin casos activos no divide y no informa un porcentaje cero', () => {
    const corte = EnsamblarCorte(Hechos({
      casos: [Caso(1, 'p1', { estado: 'CERRADO' })]
    }), Filtros(), new Map(), new Map());
    expect(corte.cobertura.denominador).toBe(0);
    expect(corte.cobertura.porcentaje).toBeNull();
    expect(corte.cobertura.estado).toBe('SIN_CASOS_ACTIVOS');
    expect(corte.cobertura.mensaje).toMatch(/Sin casos activos/);
    expect(corte.cobertura.mensaje).toMatch(/No aplica/);
    expect(Visualizacion(corte, 11).porcentaje).toBeNull();
  });

  test('el filtro de estado no cambia el denominador de cobertura', () => {
    const hechos = Hechos({
      casos: [
        Caso(1, 'a', { estado: 'ACTIVO', prioridad: 'ALTO' }),
        Caso(2, 'b', { estado: 'CERRADO', prioridad: 'BAJO' })
      ],
      individuales: [Individual(1, 1, 'a')]
    });
    const todos = EnsamblarCorte(hechos, Filtros(), new Map(), new Map());
    const cerrados = EnsamblarCorte(
      hechos,
      Filtros({ estado: 'CERRADO' }),
      new Map(),
      new Map()
    );
    expect(cerrados.cobertura.denominador).toBe(todos.cobertura.denominador);
    expect(cerrados.cobertura.numerador).toBe(todos.cobertura.numerador);
    expect(Visualizacion(cerrados, 5).serie.map((fila) => fila.clave)).toEqual(['CERRADO']);
    expect(Visualizacion(todos, 4).serie.map((fila) => fila.clave)).toEqual([
      'ALTO', 'MODERADO', 'BAJO'
    ]);
  });

  test('prioridad y establecimiento no cambian la cobertura por prioridad', () => {
    const corte = EnsamblarCorte(Hechos({
      casos: [
        Caso(1, 'a', { establecimientoId: 10, prioridad: 'ALTO' }),
        Caso(2, 'b', { establecimientoId: 20, prioridad: 'BAJO' })
      ]
    }), Filtros({ establecimientoId: 20, prioridad: 'ALTO' }), new Map(), new Map());
    expect(Visualizacion(corte, 1).estado).toBe('SIN_INFORMACION');
    expect(corte.cobertura.denominador).toBe(1);
    expect(corte.cobertura.numerador).toBe(0);
  });

  test('un año sin atenciones no vacía la distribución actual de casos', () => {
    const corte = EnsamblarCorte(Hechos({
      casos: [Caso(1, 'a')]
    }), Filtros({ anio: 2000 }), new Map(), new Map());
    expect(Visualizacion(corte, 1).estado).toBe('CON_DATOS');
    expect(Visualizacion(corte, 8).estado).toBe('SIN_INFORMACION');
    expect(corte.totalAtenciones).toBe(0);
    expect(Visualizacion(corte, 8).serie).toEqual([]);
  });

  test('un establecimiento sin casos deja la cobertura sin aplicar', () => {
    const corte = EnsamblarCorte(Hechos({
      casos: [Caso(1, 'a', { establecimientoId: 10 })]
    }), Filtros({ establecimientoId: 99 }), new Map(), new Map());
    expect(corte.cobertura.estado).toBe('SIN_CASOS_ACTIVOS');
    expect(corte.personasUnicas).toBe(0);
    expect(corte.totalAtenciones).toBe(0);
  });

  test('los motivos de referencia no son excluyentes', () => {
    const corte = EnsamblarCorte(Hechos({
      referencias: [
        { referenciaId: 1, personaId: 'a', establecimientoId: 10, estado: 'ADMITIDA_AI' },
        { referenciaId: 2, personaId: 'b', establecimientoId: 10, estado: 'PENDIENTE_REVISION' }
      ],
      motivosReferencia: [
        { referenciaId: 1, etiqueta: 'Salud' },
        { referenciaId: 1, etiqueta: 'Desarrollo' },
        { referenciaId: 2, etiqueta: 'Salud' }
      ]
    }), Filtros(), new Map(), new Map());
    const motivos = Visualizacion(corte, 7);
    const suma = motivos.frecuenciaCompleta.reduce((total, fila) => total + fila.cantidad, 0);
    expect(corte.referencias.enviadas).toBe(2);
    expect(corte.referencias.analizadas).toBe(1);
    expect(corte.referencias.admitidas).toBe(1);
    expect(suma).toBe(3);
    expect(suma).toBeGreaterThan(corte.referencias.enviadas);
  });

  test('separa cierre, traslado y palabras de otro, y conserva la frecuencia completa', () => {
    const corte = EnsamblarCorte(Hechos({
      cierres: [
        {
          casoId: 1,
          establecimientoId: 10,
          codigo: 'CIERRE_SATISFACTORIO',
          etiqueta: 'Cierre satisfactorio',
          requiereTexto: false,
          explicacion: null
        },
        {
          casoId: 2,
          establecimientoId: 10,
          codigo: 'TRASLADO',
          etiqueta: 'Traslado',
          requiereTexto: false,
          explicacion: null
        },
        {
          casoId: 3,
          establecimientoId: 10,
          codigo: 'OTRO',
          etiqueta: 'Otro',
          requiereTexto: true,
          explicacion: 'Requirió apoyo familiar continuo'
        }
      ],
      cancelaciones: Array.from({ length: 11 }, (_, indice) => ({
        actividadId: indice + 1,
        establecimientoId: 10,
        motivo: indice === 0 ? '=1+1' : `Motivo ${indice + 1}`
      }))
    }), Filtros(), new Map(), new Map());
    const cierres = Visualizacion(corte, 9).serie;
    expect(cierres.find((fila) => fila.clave === 'CIERRE_SATISFACTORIO').cantidad).toBe(1);
    expect(cierres.find((fila) => fila.clave === 'TRASLADO').cantidad).toBe(1);
    expect(cierres.find((fila) => fila.clave === 'OTRO').cantidad).toBe(1);
    expect(Visualizacion(corte, 10).serie.map((fila) => fila.etiqueta)).toEqual(
      expect.arrayContaining(['apoyo', 'familiar', 'continuo'])
    );
    expect(Visualizacion(corte, 6).serie).toHaveLength(10);
    expect(Visualizacion(corte, 6).frecuenciaCompleta).toHaveLength(11);
  });

  test('sexo y edad no convierten el total de atenciones y sí la cobertura', () => {
    const demografia = new Map([
      ['a', { sexo: 'Femenino', edad: 4 }],
      ['b', { sexo: 'Masculino', edad: 6 }]
    ]);
    const hechos = Hechos({
      casos: [Caso(1, 'a'), Caso(2, 'b')],
      individuales: [Individual(1, 1, 'a'), Individual(2, 2, 'b', { disciplinaId: 9 })]
    });
    const porSexo = EnsamblarCorte(hechos, Filtros({ sexo: 'Femenino' }), demografia, new Map());
    expect(porSexo.personasUnicas).toBe(1);
    expect(porSexo.totalAtenciones).toBe(2);
    expect(porSexo.cobertura.denominador).toBe(1);
    expect(porSexo.cobertura.numerador).toBe(1);
    const porDisciplina = EnsamblarCorte(
      hechos,
      Filtros({ disciplinaId: 3 }),
      demografia,
      new Map()
    );
    expect(porDisciplina.totalAtenciones).toBe(1);
    expect(porDisciplina.cobertura.denominador).toBe(2);
    expect(Visualizacion(porDisciplina, 2).estado).toBe('CON_DATOS');
  });

  test('sin demografía no inventa sexo ni edad en cero', () => {
    const corte = EnsamblarCorte(Hechos({
      casos: [Caso(1, 'a')]
    }), Filtros(), null, new Map());
    expect(Visualizacion(corte, 2).estado).toBe('NO_DISPONIBLE');
    expect(Visualizacion(corte, 3).estado).toBe('NO_DISPONIBLE');
    expect(Visualizacion(corte, 2).serie).toEqual([]);
    expect(corte.cobertura.denominador).toBe(1);
  });

  test('la atención individual no se disfraza de un tipo grupal', () => {
    const corte = EnsamblarCorte(Hechos({
      individuales: [Individual(1, 1, 'a'), Individual(2, 1, 'a')]
    }), Filtros(), new Map(), new Map());
    expect(Visualizacion(corte, 8).estado).toBe('NO_DISPONIBLE');
    expect(Visualizacion(corte, 8).serie).toEqual([]);
    expect(corte.totalAtenciones).toBe(2);
  });

  test('rechaza un ámbito enviado en la consulta y protege la celda', async () => {
    expect(() => LeerFiltrosReporteria({ oficinaLocalId: 999 }, 2026)).toThrow(/sesión/);
    expect(LeerFiltrosReporteria({ anio: '2026', estado: 'activo' }, 2026)).toMatchObject({
      anio: 2026,
      estado: 'ACTIVO'
    });
    expect(TextoCelda('=1+1')).toBe("'=1+1");
    expect(TextoCelda(4)).toBe(4);
    expect(() => AfirmarExportacionCompleta(2001)).toThrow(/parcial/);
    const corte = EnsamblarCorte(Hechos({
      casos: [Caso(1, 'a')],
      individuales: [Individual(1, 1, 'a')]
    }), Filtros(), new Map(), new Map([[10, 'Centro norte']]));
    corte.visualizaciones[5].frecuenciaCompleta = [{ etiqueta: '=1+1', cantidad: 2 }];
    const libro = await CrearLibroConsolidacion(corte);
    const ExcelJS = require('exceljs');
    const abierto = new ExcelJS.Workbook();
    await abierto.xlsx.load(libro);
    const indicadores = abierto.getWorksheet('Indicadores');
    expect(indicadores.getRow(2).getCell(2).value).toBe(1);
    const motivos = abierto.worksheets.find((hoja) => hoja.name.startsWith('06'));
    const textos = [];
    motivos.eachRow((fila) => textos.push(String(fila.getCell(1).value)));
    expect(textos).toContain("'=1+1");
    expect(corte.visualizaciones).toHaveLength(12);
  });
});

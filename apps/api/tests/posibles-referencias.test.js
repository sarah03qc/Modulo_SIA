'use strict';

const { AfirmarLecturaInstitucional } = require(
  '../src/infrastructure/database/institutional-read'
);
const { CrearContextoUsuario } = require('../src/infrastructure/auth/user-context');
const { LECTURA_SQL, CONTEO_SQL } = require(
  '../src/modules/posibles-referencias/lector-evaluaciones'
);
const { InterpretarCampo, EdadEnEvaluacion, AplicabilidadPorEdad } = require(
  '../src/modules/posibles-referencias/interprete-nutricional'
);
const { EvaluarReglas } = require('../src/modules/posibles-referencias/reglas-nutricion');
const { Conciliar, SeleccionarVigentes } = require(
  '../src/modules/posibles-referencias/conciliacion-posible'
);
const { CrearServicioPosibles } = require(
  '../src/modules/posibles-referencias/servicio-posibles'
);

function AccesoOficina() {
  return CrearContextoUsuario({
    source: 'SYNTHETIC_DEVELOPMENT',
    principalId: 'dev-oficina-hatillo',
    grants: [{ role: 'OFICINA_LOCAL', regionId: 1, localOfficeId: 101 }]
  });
}

function Indicador(campo, codigo, modo) {
  return InterpretarCampo({ campo, codigo, modo });
}

describe('intérprete nutricional', () => {
  test('reconoce el código sintético 9 y el normal 1 sin tratarlos como clínica', () => {
    const senal = Indicador('PE', 9, 'SINTETICO');
    const normal = Indicador('PT', 1, 'SINTETICO');
    expect(senal.estado).toBe('RECONOCIDO');
    expect(senal.clasificacion).toBe('SENAL_DEMOSTRACION');
    expect(senal.estadoValidacion).toBe('SINTETICO');
    expect(normal.clasificacion).toBe('NORMAL');
  });

  test('un código desconocido, el cero y el nulo no se vuelven alteración ni normal', () => {
    expect(Indicador('PE', 4, 'SINTETICO').estado).toBe('DESCONOCIDO');
    expect(Indicador('PE', 4, 'SINTETICO').clasificacion).toBeNull();
    expect(Indicador('PE', 0, 'SINTETICO').estado).toBe('DESCONOCIDO');
    expect(Indicador('IMC', null, 'SINTETICO').estado).toBe('NULO');
  });

  test('el mapeo institucional no validado no clasifica', () => {
    const resultado = Indicador('PE', 9, 'INSTITUCIONAL');
    expect(resultado.estado).toBe('MAPEO_NO_VALIDADO');
    expect(resultado.clasificacion).toBeNull();
  });

  test('separa la edad aplicable de peso, talla e IMC', () => {
    expect(AplicabilidadPorEdad('PE', 4)).toBe('APLICABLE');
    expect(AplicabilidadPorEdad('PE', 5)).toBe('NO_APLICABLE');
    expect(AplicabilidadPorEdad('IMC', 5)).toBe('APLICABLE');
    expect(AplicabilidadPorEdad('IMC', 4)).toBe('NO_APLICABLE');
    expect(AplicabilidadPorEdad('TE', null)).toBe('EDAD_DESCONOCIDA');
    expect(EdadEnEvaluacion('2019-11-18', '2024-11-18')).toBe(5);
    expect(EdadEnEvaluacion('2019-11-19', '2024-11-18')).toBe(4);
  });

  test('la lectura de la réplica sigue siendo una consulta', () => {
    expect(() => AfirmarLecturaInstitucional(LECTURA_SQL)).not.toThrow();
    expect(() => AfirmarLecturaInstitucional(CONTEO_SQL)).not.toThrow();
  });
});

describe('reglas nutricionales', () => {
  test('cada alerta conocida se detecta y lo normal no', () => {
    const alerta = EvaluarReglas({
      modo: 'SINTETICO',
      edadAnios: 3,
      indicadores: [{ campo: 'PE', estado: 'RECONOCIDO', clasificacion: 'BAJO_PESO' }]
    });
    const normal = EvaluarReglas({
      modo: 'SINTETICO',
      edadAnios: 3,
      indicadores: [{ campo: 'PE', estado: 'RECONOCIDO', clasificacion: 'NORMAL' }]
    });
    expect(alerta.detectar).toBe(true);
    expect(alerta.criterioCodigo).toBe('NUTRICION_CAH');
    expect(normal.detectar).toBe(false);
  });

  test('alto y muy alto de talla no son malnutrición', () => {
    const resultado = EvaluarReglas({
      modo: 'SINTETICO',
      edadAnios: 6,
      indicadores: [
        { campo: 'TE', estado: 'RECONOCIDO', clasificacion: 'ALTO' },
        { campo: 'TE', estado: 'RECONOCIDO', clasificacion: 'MUY_ALTO' }
      ]
    });
    expect(resultado.detectar).toBe(false);
  });

  test('varias alteraciones de una evaluación forman una sola candidata', () => {
    const resultado = EvaluarReglas({
      modo: 'SINTETICO',
      edadAnios: 2,
      indicadores: [
        { campo: 'PT', estado: 'RECONOCIDO', clasificacion: 'DESNUTRICION' },
        { campo: 'TE', estado: 'RECONOCIDO', clasificacion: 'BAJA_TALLA_SEVERA' }
      ]
    });
    expect(resultado.evidencias).toHaveLength(2);
    expect(resultado.criterioCodigo).toBe('NUTRICION_CAH');
  });

  test('respeta el umbral de cinco años y no alerta sin edad', () => {
    const mayor = EvaluarReglas({
      modo: 'SINTETICO',
      edadAnios: 5,
      indicadores: [{ campo: 'PE', estado: 'RECONOCIDO', clasificacion: 'PESO_ALTO' }]
    });
    const imc = EvaluarReglas({
      modo: 'SINTETICO',
      edadAnios: 5,
      indicadores: [{ campo: 'IMC', estado: 'RECONOCIDO', clasificacion: 'OBESIDAD' }]
    });
    const sinEdad = EvaluarReglas({
      modo: 'SINTETICO',
      edadAnios: null,
      indicadores: [{ campo: 'IMC', estado: 'RECONOCIDO', clasificacion: 'OBESIDAD' }]
    });
    expect(mayor.detectar).toBe(false);
    expect(imc.detectar).toBe(true);
    expect(sinEdad.detectar).toBe(false);
  });

  test('la señal de demostración no se presenta como clasificación clínica', () => {
    const resultado = EvaluarReglas({
      modo: 'SINTETICO',
      edadAnios: 8,
      indicadores: [Indicador('PE', 9, 'SINTETICO')]
    });
    expect(resultado.demostracion).toBe(true);
    expect(resultado.criterioCodigo).toBe('NUTRICION_DEMO');
  });

  test('el modo institucional no genera sugerencias', () => {
    const resultado = EvaluarReglas({
      modo: 'INSTITUCIONAL',
      edadAnios: 2,
      indicadores: [{ campo: 'PE', estado: 'RECONOCIDO', clasificacion: 'BAJO_PESO_SEVERO' }]
    });
    expect(resultado.estado).toBe('CODIGOS_NO_VALIDADOS');
    expect(resultado.detectar).toBe(false);
  });
});

describe('conciliación', () => {
  test('elige la evaluación reciente y conserva la anterior como histórica', () => {
    const seleccion = SeleccionarVigentes([
      { personId: 'SYN-A', fechaEvaluacion: '2026-01-01', evaluacionId: 1 },
      { personId: 'SYN-A', fechaEvaluacion: '2026-08-01', evaluacionId: 2 },
      { personId: 'SYN-B', fechaEvaluacion: '2026-02-01', evaluacionId: 3 }
    ]);
    expect(seleccion.historicas).toBe(1);
    expect(seleccion.vigentes.map((fila) => fila.evaluacionId).sort()).toEqual([2, 3]);
  });

  test('omite caso activo, duplicado, pendiente, gestión previa y recurrencia', () => {
    expect(Conciliar({ fechaEvaluacion: '2026-01-01', casoActivo: true }).motivo).toBe('CASO_ACTIVO');
    expect(Conciliar({
      fechaEvaluacion: '2026-01-01',
      idExterno: 'EVM-1',
      pendiente: { idExterno: 'EVM-1' }
    }).motivo).toBe('DUPLICADO');
    expect(Conciliar({
      fechaEvaluacion: '2026-01-01',
      idExterno: 'EVM-2',
      pendiente: { idExterno: 'EVM-1' }
    }).motivo).toBe('PENDIENTE_EXISTENTE');
    expect(Conciliar({
      fechaEvaluacion: '2026-01-01',
      resueltaMismaEvaluacion: true
    }).motivo).toBe('YA_GESTIONADA');
    expect(Conciliar({
      fechaEvaluacion: '2026-01-01',
      resueltaMismoCriterio: true
    }).motivo).toBe('RECURRENCIA');
    expect(Conciliar({ fechaEvaluacion: '2026-01-01' }).accion).toBe('CREAR');
    expect(Conciliar({ fechaEvaluacion: '' }).motivo).toBe('SIN_FECHA');
  });
});

describe('detección del servicio', () => {
  test('una evaluación sintética vigente crea una sugerencia y la segunda corrida no la duplica', async () => {
    const insertadas = [];
    const repositorio = {
      PersonasConCasoActivo: jest.fn(async () => new Set()),
      HechosNutricion: jest.fn(async () => []),
      InsertarPendiente: jest.fn(async (sugerencia) => {
        insertadas.push(sugerencia);
        return 'CREADA';
      }),
      RegistrarEjecucion: jest.fn(async () => undefined)
    };
    const adaptador = {
      ListarEvaluacionesNutricionales: jest.fn(async () => ({
        eliminadas: 1,
        filas: [
          {
            evaluacion_id: 1,
            person_id: 'SYN-LIBRE',
            fecha_evaluacion: '2026-03-15',
            birth_date: '2022-01-01',
            codigo_pe: 9,
            codigo_pt: 1,
            codigo_te: 1,
            codigo_imc: 1,
            establishment_id: 1100102,
            local_office_id: 101,
            region_id: 1,
            location_count: 1
          },
          {
            evaluacion_id: 2,
            person_id: 'SYN-LIBRE',
            fecha_evaluacion: '2026-01-01',
            birth_date: '2022-01-01',
            codigo_pe: 9,
            codigo_pt: 9,
            codigo_te: 1,
            codigo_imc: 1,
            establishment_id: 1100102,
            local_office_id: 101,
            region_id: 1,
            location_count: 1
          }
        ]
      }))
    };
    const servicio = CrearServicioPosibles({
      periodId: 2026,
      modo: 'SINTETICO',
      adaptador,
      repositorio
    });
    const primero = await servicio.Ejecutar(AccesoOficina());
    expect(primero.sugerenciasNuevas).toBe(1);
    expect(insertadas[0].criterioCodigo).toBe('NUTRICION_DEMO');
    expect(insertadas[0].idExterno).toBe('EVM-1');
    repositorio.HechosNutricion.mockResolvedValue([{
      per_id_persona: 'SYN-LIBRE',
      establecimiento_id: 1100102,
      criterio_codigo: 'NUTRICION_DEMO',
      id_externo: 'EVM-1',
      estado: 'PENDIENTE'
    }]);
    repositorio.InsertarPendiente.mockClear();
    const segundo = await servicio.Ejecutar(AccesoOficina());
    expect(segundo.sugerenciasNuevas).toBe(0);
    expect(repositorio.InsertarPendiente).not.toHaveBeenCalled();
  });

  test('una segunda detección simultánea se rechaza', async () => {
    let liberar;
    const espera = new Promise((resolver) => {
      liberar = resolver;
    });
    const adaptador = {
      ListarEvaluacionesNutricionales: jest.fn(() => espera.then(() => ({ filas: [] })))
    };
    const repositorio = {
      PersonasConCasoActivo: jest.fn(async () => new Set()),
      HechosNutricion: jest.fn(async () => []),
      InsertarPendiente: jest.fn(),
      RegistrarEjecucion: jest.fn(async () => undefined)
    };
    const servicio = CrearServicioPosibles({
      periodId: 2026,
      modo: 'SINTETICO',
      adaptador,
      repositorio
    });
    const primera = servicio.Ejecutar(AccesoOficina());
    await new Promise((resolver) => setImmediate(resolver));
    await expect(servicio.Ejecutar(AccesoOficina())).rejects.toThrow(
      'Ya hay una detección en curso.'
    );
    liberar();
    await primera;
  });

  test('el modo institucional no lee evaluaciones ni inserta', async () => {
    const adaptador = { ListarEvaluacionesNutricionales: jest.fn() };
    const repositorio = { InsertarPendiente: jest.fn() };
    const servicio = CrearServicioPosibles({
      periodId: 2026,
      modo: 'INSTITUCIONAL',
      adaptador,
      repositorio
    });
    const resultado = await servicio.Ejecutar(AccesoOficina());
    expect(resultado.estado).toBe('CODIGOS_NO_VALIDADOS');
    expect(adaptador.ListarEvaluacionesNutricionales).not.toHaveBeenCalled();
    expect(repositorio.InsertarPendiente).not.toHaveBeenCalled();
  });
});

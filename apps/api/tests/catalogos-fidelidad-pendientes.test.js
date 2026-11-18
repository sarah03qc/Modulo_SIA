/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-18.
 * Contrasta los scripts 100 y 101 con la guía y con las reglas ya
 * implementadas. No abre SQL Server ni activa catálogos.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { ErrorValidacion } = require('../src/common/errors');
const { NormalizarMotivos } = require('../src/modules/references/reference-rules');
const { GenerarDocumentoReferencia } = require('../src/modules/references/reference-document');
const { LeerValoracion } = require('../src/modules/proceso-interdisciplinario/validacion-proceso');
const { CalcularPrioridadRn009 } = require('../src/modules/proceso-interdisciplinario/reglas-prioridad');

const RAIZ = path.resolve(__dirname, '../../..');
const GUIA = path.join(
  RAIZ,
  'docs/quality/GUIA_AJUSTE_FIDELIDAD_VISTAS_SIA_CENCINAI.md'
);
const SCRIPT_100 = path.join(
  RAIZ,
  'database/sia-cencinai/pending/100_motivos_factor_riesgo.sql'
);
const SCRIPT_101 = path.join(
  RAIZ,
  'database/sia-cencinai/pending/101_instrumento_valoracion_v2.sql'
);
const SCRIPT_102 = path.join(
  RAIZ,
  'database/sia-cencinai/pending/102_motivos_salud_completos.sql'
);

const CLAVES = [
  ['INDIVIDUAL', 'PROTECTOR'],
  ['INDIVIDUAL', 'RIESGO'],
  ['INDIVIDUAL', 'SIGNO_ALERTA'],
  ['HOGAR_FAMILIAR', 'PROTECTOR'],
  ['HOGAR_FAMILIAR', 'RIESGO'],
  ['HOGAR_FAMILIAR', 'SIGNO_ALERTA'],
  ['COMUNITARIO', 'PROTECTOR'],
  ['COMUNITARIO', 'RIESGO'],
  ['COMUNITARIO', 'SIGNO_ALERTA']
];

function SeccionesDeLaGuia() {
  const guia = fs.readFileSync(GUIA, 'utf8');
  const inicio = guia.indexOf('### 5.1');
  const fin = guia.indexOf('### 5.4');
  const secciones = [];
  let actual = null;
  for (const linea of guia.slice(inicio, fin).split(/\r?\n/)) {
    if (/^\*\*(Factores protectores|Factores de riesgo|Signos de alerta)/.test(linea)) {
      actual = [];
      secciones.push(actual);
      continue;
    }
    const item = linea.match(/^\d+\.\s+(.+)$/);
    if (item && actual) {
      actual.push(item[1].trim());
    }
  }
  return secciones;
}

function FactoresDelScript() {
  const sql = fs.readFileSync(SCRIPT_101, 'utf8');
  const patron = new RegExp(
    "\\(N'(PROTECTOR|RIESGO|SIGNO_ALERTA)', "
    + "N'(INDIVIDUAL|HOGAR_FAMILIAR|COMUNITARIO)', "
    + "N'([A-Z0-9_]+)', N'([^']+)', ([01]), (\\d+)\\)",
    'g'
  );
  return [...sql.matchAll(patron)].map((fila) => ({
    eje: fila[1],
    ambito: fila[2],
    codigo: fila[3],
    etiqueta: fila[4],
    abierto: fila[5] === '1',
    orden: Number(fila[6])
  }));
}

describe('scripts pendientes de catálogo, sin activarlos', () => {
  test('el script 100 inserta solo los tres motivos de RF-024', () => {
    const sql = fs.readFileSync(SCRIPT_100, 'utf8');
    expect(sql).toMatch(/DECLARE @permitir bit = 0;/);
    expect(sql).not.toMatch(/\bUPDATE\b/i);
    expect(sql).not.toMatch(/\bDELETE\b/i);
    expect(sql).toContain('BEGIN TRANSACTION');
    expect(sql).toContain('ROLLBACK TRANSACTION');
    expect(sql).toContain(
      "(N'FACTOR_RIESGO_INDIVIDUAL', N'Factor de riesgo individual', 18, N'INDIVIDUAL')"
    );
    expect(sql).toContain(
      "(N'FACTOR_RIESGO_HOGAR_FAMILIAR', N'Factor de riesgo hogar-familiar', "
      + "19, N'HOGAR_FAMILIAR')"
    );
    expect(sql).toContain(
      "(N'FACTOR_RIESGO_COMUNITARIO', N'Factor de riesgo comunitario', 20, N'COMUNITARIO')"
    );
    expect(sql).not.toContain('Otro factor de riesgo');
  });

  test('el script 102 completa Salud sin borrar historial', () => {
    const sql = fs.readFileSync(SCRIPT_102, 'utf8');
    const etiquetas = [
      'Alteración visual',
      'Alteración auditiva',
      'Alteración del lenguaje',
      'Alteración motora',
      'Alteración de salud oral',
      'Alergia alimentaria',
      'Enfermedad crónica',
      'Lactancia materna / alimentación complementaria',
      'Trastorno específico del aprendizaje',
      'Sospecha o diagnóstico de trastorno del neurodesarrollo',
      'Alteraciones emocionales',
      'Alteraciones conductuales',
      'Otra condición de salud'
    ];
    expect(sql).toMatch(/DECLARE @permitir bit = 0;/);
    expect(sql).not.toMatch(/\bDELETE\b/i);
    expect(sql).not.toMatch(/ref_motivo/i);
    expect(sql).toContain('BEGIN TRANSACTION');
    expect(sql).toContain('ROLLBACK TRANSACTION');
    expect(sql).toContain('<> 20');
    etiquetas.forEach((etiqueta) => {
      expect(sql).toContain(etiqueta);
    });
  });

  test('los 74 factores coinciden en etiqueta, orden y factor abierto', () => {
    const sql = fs.readFileSync(SCRIPT_101, 'utf8');
    const secciones = SeccionesDeLaGuia();
    const factores = FactoresDelScript();
    expect(sql).toMatch(/DECLARE @permitir bit = 0;/);
    expect(sql).not.toMatch(/\bDELETE\b/i);
    expect(sql).not.toMatch(/ses_valoracion/i);
    expect(sql).toContain('UPDATE dbo.cat_instrumento_version');
    expect(sql).toContain('BEGIN TRANSACTION');
    expect(sql).toContain('ROLLBACK TRANSACTION');
    expect(secciones).toHaveLength(9);
    expect(factores).toHaveLength(74);

    const codigos = new Set();
    CLAVES.forEach(([ambito, eje], indice) => {
      const grupo = factores
        .filter((factor) => factor.ambito === ambito && factor.eje === eje)
        .sort((a, b) => a.orden - b.orden);
      expect(grupo.map((factor) => factor.etiqueta)).toEqual(secciones[indice]);
      grupo.forEach((factor, posicion) => {
        expect(factor.orden).toBe(posicion + 1);
        expect(factor.abierto).toBe(factor.etiqueta.startsWith('Otro '));
        expect(factor.codigo.length).toBeLessThanOrEqual(80);
        expect(factor.etiqueta.length).toBeLessThanOrEqual(300);
        expect(codigos.has(factor.codigo)).toBe(false);
        codigos.add(factor.codigo);
      });
    });
  });

  test('la referencia acepta los tres motivos con especificación propia', () => {
    const catalogo = new Map([
      ['FACTOR_RIESGO_INDIVIDUAL', {
        itemId: 31,
        code: 'FACTOR_RIESGO_INDIVIDUAL',
        label: 'Factor de riesgo individual'
      }],
      ['FACTOR_RIESGO_HOGAR_FAMILIAR', {
        itemId: 32,
        code: 'FACTOR_RIESGO_HOGAR_FAMILIAR',
        label: 'Factor de riesgo hogar-familiar'
      }],
      ['FACTOR_RIESGO_COMUNITARIO', {
        itemId: 33,
        code: 'FACTOR_RIESGO_COMUNITARIO',
        label: 'Factor de riesgo comunitario'
      }]
    ]);
    const motivos = NormalizarMotivos([
      { code: 'FACTOR_RIESGO_INDIVIDUAL', specification: 'Detalle individual' },
      { code: 'FACTOR_RIESGO_HOGAR_FAMILIAR', specification: 'Detalle del hogar' },
      { code: 'FACTOR_RIESGO_COMUNITARIO', specification: '   ' }
    ], catalogo);
    expect(motivos.map((motivo) => motivo.code)).toEqual([
      'FACTOR_RIESGO_INDIVIDUAL',
      'FACTOR_RIESGO_HOGAR_FAMILIAR',
      'FACTOR_RIESGO_COMUNITARIO'
    ]);
    expect(motivos.map((motivo) => motivo.specification)).toEqual([
      'Detalle individual',
      'Detalle del hogar',
      null
    ]);
    const documento = GenerarDocumentoReferencia({
      consecutive: 'DNCC-DRCS-OL101-1100102-REF-701-2026',
      referenceDate: '2026-11-18',
      sentAt: '2026-11-18T15:00:00Z',
      responsible: 'dev-establecimiento-unico',
      status: 'PENDIENTE_REVISION',
      person: { personId: 'SYN-1', fullName: 'Persona sintética', sex: null },
      historicalContext: {},
      attentionRoute: { label: 'Urgencia' },
      origin: { label: 'Observación' },
      previousActions: null,
      previousResults: null,
      complementaryInformation: null,
      motives: motivos.map((motivo) => ({
        label: motivo.label,
        specification: motivo.specification
      }))
    }, '2026-11-18T16:00:00Z');
    expect(documento).toContain('Factor de riesgo individual');
    expect(documento).toContain('Detalle individual');
    expect(documento).toContain('Factor de riesgo comunitario');
  });

  test('la valoración exige las nueve categorías y no calcula prioridad por factores', () => {
    const categorias = CLAVES.map((par, indice) => ({
      categoriaId: indice + 1,
      respuesta: 'NINGUNO',
      factores: []
    }));
    expect(LeerValoracion({
      situacionId: 901,
      riesgoCodigo: 'ALTO',
      proteccionCodigo: 'BAJA',
      categorias
    }).categorias).toHaveLength(9);
    expect(() => LeerValoracion({
      situacionId: 901,
      riesgoCodigo: 'ALTO',
      proteccionCodigo: 'BAJA',
      categorias: [{
        categoriaId: 1,
        respuesta: 'NINGUNO',
        factores: [{ factorId: 10, especificacion: 'No aplica' }]
      }]
    })).toThrow(ErrorValidacion);
    expect(CalcularPrioridadRn009('ALTO', 'BAJA')).toBe('ALTO');
    expect(CalcularPrioridadRn009('BAJO', 'ALTA')).toBe('BAJO');
  });
});

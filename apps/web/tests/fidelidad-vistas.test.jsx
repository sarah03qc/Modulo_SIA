import { render, screen as pantalla } from '@testing-library/react';
import eventoUsuario from '@testing-library/user-event';
import FormularioReferencia from '../src/funcionalidades/referencias/FormularioReferencia';
import SituacionTrabajo from '../src/funcionalidades/sesiones/SituacionTrabajo';

const CATALOGOS_REFERENCIA = {
  attentionRoutes: [
    { code: 'URGENCIA', label: 'Urgencia' },
    { code: 'NO_INMEDIATA', label: 'No inmediata' }
  ],
  origins: [
    { code: 'OBSERVACION', label: 'Observación' }
  ],
  motives: [
    { code: 'CONDICION_MALNUTRICION', label: 'Condición de malnutrición', category: 'CRECIMIENTO' },
    { code: 'MALNUTRICION_NECESIDADES_ESPECIALES', label: 'Malnutrición con necesidades especiales', category: 'CRECIMIENTO' },
    { code: 'EDIN_II_RIESGO_RETRASO_ROJO', label: 'EDIN II: riesgo de retraso (rojo)', category: 'DESARROLLO' },
    { code: 'EVADE_RIESGO_REZAGO_0_1', label: 'EVADE: riesgo de rezago (0,1 sin logro de edad anterior)', category: 'DESARROLLO' },
    { code: 'OTRA_CONDICION_SALUD', label: 'Otra condición de salud', category: 'SALUD' }
  ],
  riskFactors: {
    status: 'NEEDS_VALIDATION',
    items: [],
    message: 'El catálogo vigente no incluye motivos de factor de riesgo por ámbito individual, hogar-familiar y comunitario.'
  }
};

function SolicitudReferencia(ruta) {
  if (ruta === '/api/references/catalogs') {
    return CATALOGOS_REFERENCIA;
  }
  if (ruta === '/api/references/drafts') {
    return { items: [] };
  }
  if (ruta.startsWith('/api/institutional/persons/search')) {
    return {
      result: {
        returned: 1,
        total: 1,
        items: [{
          personId: 'SYN-1100102-01',
          fullName: 'Persona sintética',
          region: { id: 1, name: 'Región sintética' },
          localOffice: { id: 101, name: 'Oficina sintética' },
          establishment: { id: 1100102, name: 'Establecimiento sintético' }
        }]
      }
    };
  }
  return {};
}

const MOTIVOS_APROBADOS = [
  ['CONDICION_MALNUTRICION', 'Condición de malnutrición', 'CRECIMIENTO', 1],
  ['MALNUTRICION_NECESIDADES_ESPECIALES', 'Malnutrición con necesidades especiales', 'CRECIMIENTO', 2],
  ['EDIN_II_RIESGO_RETRASO_ROJO', 'EDIN II: riesgo de retraso (rojo)', 'DESARROLLO', 3],
  ['EVADE_RIESGO_REZAGO_0_1', 'EVADE: riesgo de rezago (0,1 sin logro de edad anterior)', 'DESARROLLO', 4],
  ['ALTERACION_VISUAL', 'Alteración visual', 'SALUD', 5],
  ['ALTERACION_AUDITIVA', 'Alteración auditiva', 'SALUD', 6],
  ['ALTERACION_DEL_LENGUAJE', 'Alteración del lenguaje', 'SALUD', 7],
  ['ALTERACION_MOTORA', 'Alteración motora', 'SALUD', 8],
  ['ALTERACION_SALUD_ORAL', 'Alteración de salud oral', 'SALUD', 9],
  ['ALERGIA_ALIMENTARIA', 'Alergia alimentaria', 'SALUD', 10],
  ['ENFERMEDAD_CRONICA', 'Enfermedad crónica', 'SALUD', 11],
  ['LACTANCIA_MATERNA_ALIMENTACION_COMPLEMENTARIA', 'Lactancia materna / alimentación complementaria', 'SALUD', 12],
  ['TRASTORNO_ESPECIFICO_APRENDIZAJE', 'Trastorno específico del aprendizaje', 'SALUD', 13],
  ['SOSPECHA_O_DIAGNOSTICO_TRASTORNO_NEURODESARROLLO', 'Sospecha o diagnóstico de trastorno del neurodesarrollo', 'SALUD', 14],
  ['ALTERACIONES_EMOCIONALES', 'Alteraciones emocionales', 'SALUD', 15],
  ['ALTERACIONES_CONDUCTUALES', 'Alteraciones conductuales', 'SALUD', 16],
  ['OTRA_CONDICION_SALUD', 'Otra condición de salud', 'SALUD', 17],
  ['FACTOR_RIESGO_INDIVIDUAL', 'Factor de riesgo individual', 'FACTORES_RIESGO', 18],
  ['FACTOR_RIESGO_HOGAR_FAMILIAR', 'Factor de riesgo hogar-familiar', 'FACTORES_RIESGO', 19],
  ['FACTOR_RIESGO_COMUNITARIO', 'Factor de riesgo comunitario', 'FACTORES_RIESGO', 20]
].map(([code, label, category, order]) => ({ code, label, category, order }));

describe('fidelidad de referencia y valoración', () => {
  test('la referencia agrupa motivos y usa los nombres completos', async () => {
    const usuario = eventoUsuario.setup();
    render(
      <FormularioReferencia
        direccionApi="http://127.0.0.1:3001"
        identidad="dev-establecimiento-unico"
        solicitarApi={async (_base, ruta) => SolicitudReferencia(ruta)}
      />
    );

    expect(await pantalla.findByRole('heading', { name: 'Nueva referencia' })).toBeInTheDocument();
    expect(pantalla.getAllByText('Cliente/beneficiaria y trazabilidad')).toHaveLength(2);
    expect(pantalla.getByRole('heading', {
      name: 'Cliente/beneficiaria y trazabilidad'
    })).toBeInTheDocument();
    expect(pantalla.getByLabelText('Vía de Atención')).toBeInTheDocument();
    expect(pantalla.getByText(/Proviene de la sesión y no se edita/)).toBeInTheDocument();

    await usuario.type(pantalla.getByLabelText('Buscar por identificación o nombre'), 'SYN-1100102-01');
    await usuario.click(pantalla.getByRole('button', { name: 'Buscar en el ámbito' }));
    await usuario.click(await pantalla.findByRole('button', { name: /Persona sintética/ }));
    await usuario.type(pantalla.getByLabelText('Fecha de la referencia'), '2026-11-17');
    await usuario.selectOptions(pantalla.getByLabelText('Vía de Atención'), 'URGENCIA');
    await usuario.selectOptions(pantalla.getByLabelText('Origen'), 'OBSERVACION');
    await usuario.type(
      pantalla.getByLabelText('Consecutivo institucional'),
      'DNCC-DRCS-OL101-1100102-REF-015-2026'
    );
    await usuario.click(pantalla.getByRole('button', { name: 'Continuar' }));

    expect(pantalla.getByRole('group', { name: 'Crecimiento' })).toBeInTheDocument();
    expect(pantalla.getByRole('group', { name: 'Desarrollo' })).toBeInTheDocument();
    expect(pantalla.getByRole('group', { name: 'Salud' })).toBeInTheDocument();
    expect(pantalla.getByRole('group', { name: 'Factores de riesgo' })).toBeInTheDocument();
    expect(pantalla.getByText(/no incluye motivos de factor de riesgo/)).toBeInTheDocument();

    await usuario.click(pantalla.getByRole('checkbox', { name: 'Condición de malnutrición' }));
    expect(pantalla.getByLabelText('Detalle del factor (opcional)')).toBeInTheDocument();
    await usuario.click(pantalla.getByRole('checkbox', { name: 'Condición de malnutrición' }));
    expect(pantalla.queryByLabelText('Detalle del factor (opcional)')).not.toBeInTheDocument();

    await usuario.click(pantalla.getByRole('checkbox', { name: 'Otra condición de salud' }));
    await usuario.click(pantalla.getByRole('button', { name: 'Continuar' }));
    expect(pantalla.getByLabelText('Acciones realizadas previo a la referencia')).toBeInTheDocument();
    expect(pantalla.getByLabelText('Resultados obtenidos previo a la referencia')).toBeInTheDocument();
    expect(pantalla.getByRole('textbox', {
      name: 'Información complementaria asociada al motivo de referencia'
    })).toBeInTheDocument();
  });

  test('muestra los veinte motivos cuando el catálogo vigente los trae', async () => {
    const usuario = eventoUsuario.setup();
    render(
      <FormularioReferencia
        direccionApi="http://127.0.0.1:3001"
        identidad="dev-establecimiento-unico"
        solicitarApi={async (_base, ruta) => (
          ruta === '/api/references/catalogs'
            ? {
              ...CATALOGOS_REFERENCIA,
              motives: MOTIVOS_APROBADOS,
              riskFactors: { status: 'DISPONIBLE', items: [], message: null }
            }
            : SolicitudReferencia(ruta)
        )}
      />
    );
    await pantalla.findByRole('heading', { name: 'Nueva referencia' });
    await usuario.type(pantalla.getByLabelText('Buscar por identificación o nombre'), 'SYN-1100102-01');
    await usuario.click(pantalla.getByRole('button', { name: 'Buscar en el ámbito' }));
    await usuario.click(await pantalla.findByRole('button', { name: /Persona sintética/ }));
    await usuario.type(pantalla.getByLabelText('Fecha de la referencia'), '2026-11-18');
    await usuario.selectOptions(pantalla.getByLabelText('Vía de Atención'), 'URGENCIA');
    await usuario.selectOptions(pantalla.getByLabelText('Origen'), 'OBSERVACION');
    await usuario.type(
      pantalla.getByLabelText('Consecutivo institucional'),
      'DNCC-DRCS-OL101-1100102-REF-020-2026'
    );
    await usuario.click(pantalla.getByRole('button', { name: 'Continuar' }));
    expect(pantalla.getAllByRole('checkbox')).toHaveLength(20);
    expect(pantalla.getByRole('group', { name: 'Salud' })).toHaveTextContent('Alteración visual');
    expect(pantalla.getByRole('group', { name: 'Salud' })).toHaveTextContent(
      'Sospecha o diagnóstico de trastorno del neurodesarrollo'
    );
    expect(pantalla.getByRole('checkbox', { name: 'Factor de riesgo comunitario' })).toBeInTheDocument();
    await usuario.click(pantalla.getByRole('checkbox', { name: 'Alteración visual' }));
    await usuario.click(pantalla.getByRole('checkbox', { name: 'Enfermedad crónica' }));
    expect(pantalla.getAllByLabelText('Detalle del factor (opcional)')).toHaveLength(2);
  });

  test('la valoración nombra los niveles y separa los tres ámbitos', async () => {
    const usuario = eventoUsuario.setup();
    render(
      <SituacionTrabajo
        direccionApi="http://127.0.0.1:3001"
        identidad="dev-oficina-hatillo"
        sesionId={3}
        situacion={{ situacionId: 9, referenciaId: 4 }}
        catalogos={{
          instrumento: {
            disponibilidad: 'DISPONIBLE',
            cobertura: { categoriasPresentes: 2, categoriasEsperadas: 9, completa: false },
            categorias: [
              {
                categoriaId: 1,
                eje: 'PROTECTOR',
                ambito: 'INDIVIDUAL',
                etiqueta: 'Factores protectores — Individual',
                factores: [{ factorId: 11, etiqueta: 'Vínculos positivos', esAbierto: false }]
              },
              {
                categoriaId: 2,
                eje: 'RIESGO',
                ambito: 'HOGAR_FAMILIAR',
                etiqueta: 'Factores de riesgo — Hogar/Familiar',
                factores: [{ factorId: 21, etiqueta: 'Conflictos familiares', esAbierto: false }]
              }
            ]
          },
          estrategias: { disponibilidad: 'DISPONIBLE', items: [] },
          disciplinas: { disponibilidad: 'DISPONIBLE', items: [] },
          frecuencias: { disponibilidad: 'DISPONIBLE', items: [] }
        }}
        alInformar={() => {}}
      />
    );

    expect(pantalla.getByRole('region', { name: 'Individual' })).toBeInTheDocument();
    expect(pantalla.getByRole('region', { name: 'Hogar/Familiar' })).toBeInTheDocument();
    expect(pantalla.getByRole('region', { name: 'Comunitario' })).toBeInTheDocument();
    expect(pantalla.getByLabelText('Nivel de riesgo')).toBeInTheDocument();
    expect(pantalla.getByLabelText('Nivel de protección')).toBeInTheDocument();
    expect(pantalla.queryByLabelText('Riesgo profesional')).not.toBeInTheDocument();
    expect(pantalla.getAllByText('Pendiente').length).toBeGreaterThan(0);
    expect(pantalla.getByText(/2 de 9 categorías/)).toBeInTheDocument();

    const ninguno = pantalla.getAllByRole('checkbox', { name: 'Ninguno' })[0];
    await usuario.click(ninguno);
    expect(ninguno).toBeChecked();
    await usuario.click(pantalla.getByRole('checkbox', { name: 'Vínculos positivos' }));
    expect(ninguno).not.toBeChecked();
    expect(pantalla.getByLabelText('Especificación de Vínculos positivos')).toBeInTheDocument();
    expect(pantalla.getByText('1 seleccionado')).toBeInTheDocument();
  });
});

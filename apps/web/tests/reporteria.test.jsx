/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * HU-038 y HU-039. Generar reporte no descarga la consolidación.
 */
import { fireEvent, render, screen as pantalla } from '@testing-library/react';
import ReporteriaPagina from '../src/funcionalidades/reporteria/ReporteriaPagina';

function Visualizacion(numero, codigo, formato, extra = {}) {
  return {
    numero,
    codigo,
    titulo: `Título ${numero}`,
    formato,
    fechaAplicada: 'Fecha de prueba',
    estado: 'CON_DATOS',
    mensaje: null,
    serie: [{
      clave: 'A',
      etiqueta: 'Grupo A',
      cantidad: 2,
      porcentaje: 50,
      tipoPorcentaje: 'TOTAL'
    }],
    nota: numero === 7 ? 'Los motivos no son excluyentes.' : null,
    filtrosAplicados: [],
    totalFrecuencia: 1,
    numerador: 1,
    denominador: 2,
    porcentaje: 50,
    ...extra
  };
}

function Respuesta() {
  const formatos = [
    'BARRAS', 'DISTRIBUCION', 'DISTRIBUCION', 'DISTRIBUCION', 'DISTRIBUCION',
    'TABLA', 'NUBE', 'DISTRIBUCION', 'CIRCULAR', 'NUBE',
    'KPI_PORCENTAJE', 'KPI_CANTIDAD'
  ];
  return {
    filtrosActivos: [{ codigo: 'anio', etiqueta: 'Año 2026' }],
    alcanceFiltros: [{
      codigo: 'estado',
      aplicaA: [1, 2, 3, 4, 5],
      motivo: 'No cambia la cobertura.'
    }],
    cobertura: { texto: 'Definición operativa provisional pendiente de ratificación con Alina.' },
    referencias: {
      enviadas: 2,
      analizadas: 1,
      admitidas: 1,
      noRequiere: 0,
      nota: 'Una analizada puede concluir admitida.'
    },
    personasUnicas: 1,
    totalAtenciones: 3,
    atencionesIndividuales: 2,
    atencionesGrupales: 1,
    notaPersonas: 'Una persona con varias atenciones cuenta una vez.',
    notaAtenciones: 'Una grupal cuenta una vez.',
    casosSinAtencion: {
      total: 1,
      estado: 'CON_DATOS',
      nota: 'La programación no cuenta.',
      muestra: [{
        casoId: 15,
        establecimiento: 'Centro',
        ultimaAtencion: null,
        situacion: 'Sin atención registrada'
      }]
    },
    visualizaciones: formatos.map((formato, indice) => (
      Visualizacion(indice + 1, `V${indice + 1}`, formato, indice === 10
        ? {
          estado: 'SIN_CASOS_ACTIVOS',
          mensaje: 'Sin casos activos. No aplica.',
          porcentaje: null
        }
        : {})
    )),
    opciones: {
      profesionales: ['prof-1'],
      sexos: [
        { codigo: 'HOMBRE', etiqueta: 'Hombre' },
        { codigo: 'MUJER', etiqueta: 'Mujer' }
      ],
      gruposEdad: [
        { codigo: 'EDAD_0_2', etiqueta: '0–2 años' },
        { codigo: 'EDAD_3_5', etiqueta: '3–5 años' },
        { codigo: 'EDAD_6_12', etiqueta: '6–12 años' },
        { codigo: 'EDAD_13_17', etiqueta: '13–17 años' },
        { codigo: 'EDAD_18_MAS', etiqueta: '18 años o más' }
      ]
    },
    disciplinas: [{ itemId: 3, etiqueta: 'Trabajo social' }],
    establecimientos: [{ id: 10, nombre: 'Centro norte' }],
    informeAnalitico: {
      disponible: false,
      estado: 'PENDIENTE',
      mensaje: 'El asistente de HU-050 no descarga la consolidación ni el reporte del caso.'
    }
  };
}

describe('pantalla de reportería', () => {
  test('muestra las doce visualizaciones y no confunde el informe con la descarga', async () => {
    const solicitarApi = jest.fn(async (direccion, ruta) => {
      if (ruta.includes('consolidacion')) {
        return { blob: new Blob(['libro']), nombre: 'consolidacion-oficina-local.xlsx' };
      }
      return Respuesta();
    });
    render(
      <ReporteriaPagina
        direccionApi="http://127.0.0.1:3001"
        identidad="dev-oficina-hatillo"
        contexto={{ puedeDescargarConsolidacion: true }}
        solicitarApi={solicitarApi}
      />
    );
    expect(await pantalla.findByRole('heading', { name: /Título 12/ })).toBeTruthy();
    expect(pantalla.getByText('No aplica en este corte.')).toBeTruthy();
    expect(pantalla.getByText(/Cómo leer estos números/)).toBeTruthy();
    expect(pantalla.getAllByRole('heading', { name: /Título/ })).toHaveLength(12);
    expect(pantalla.queryByRole('columnheader', { name: 'Proporción' })).toBeNull();
    fireEvent.click(pantalla.getAllByRole('button', { name: 'Ver datos' })[0]);
    expect(pantalla.getAllByRole('columnheader', { name: 'Cantidad' }).length).toBeGreaterThan(0);
    expect(pantalla.getByRole('columnheader', { name: '% del total' })).toBeTruthy();
    expect(pantalla.getByRole('cell', { name: '2' }).textContent).toBe('2');
    expect(pantalla.getByRole('cell', { name: /50[,.]0 %/ }).textContent).toMatch(/^50[,.]0 %$/);
    fireEvent.click(pantalla.getByRole('button', { name: 'Generar reporte' }));
    expect(pantalla.getByRole('dialog')).toHaveTextContent('Este informe recoge su análisis');
    expect(solicitarApi).toHaveBeenCalledTimes(1);
    expect(solicitarApi.mock.calls[0][1]).not.toMatch(/oficinaLocalId/);
    fireEvent.click(pantalla.getByRole('button', { name: 'Cerrar' }));
    fireEvent.click(pantalla.getByRole('button', { name: 'Descargar consolidado' }));
    const descarga = await pantalla.findByRole('button', {
      name: 'Descargar consolidado'
    });
    expect(descarga).toBeEnabled();
    expect(solicitarApi.mock.calls.some((llamada) => String(llamada[1]).includes('consolidacion'))).toBe(true);
  });

  test('exige cinco visualizaciones y conserva el análisis al retroceder', async () => {
    const solicitarApi = jest.fn(async () => Respuesta());
    render(
      <ReporteriaPagina
        direccionApi="http://127.0.0.1:3001"
        identidad="dev-oficina-hatillo"
        contexto={{ puedeDescargarConsolidacion: true }}
        solicitarApi={solicitarApi}
      />
    );
    fireEvent.click(await pantalla.findByRole('button', { name: 'Generar reporte' }));
    expect(pantalla.getByText(/Seleccione al menos 5 visualizaciones/)).toBeTruthy();
    const casillas = pantalla.getAllByRole('checkbox');
    expect(pantalla.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
    casillas.slice(0, 4).forEach((casilla) => fireEvent.click(casilla));
    expect(pantalla.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
    fireEvent.click(casillas[4]);
    fireEvent.click(pantalla.getByRole('button', { name: 'Siguiente' }));
    expect(pantalla.getByText(/redacte su análisis/i)).toBeTruthy();
    fireEvent.click(pantalla.getByRole('button', { name: 'Siguiente' }));
    expect(pantalla.getByText(/No se genera una interpretación automática/)).toBeTruthy();
    fireEvent.change(pantalla.getByLabelText('Análisis'), {
      target: { value: 'Lectura del profesional.' }
    });
    fireEvent.click(pantalla.getByRole('button', { name: 'Anterior' }));
    fireEvent.click(pantalla.getByRole('button', { name: 'Siguiente' }));
    expect(pantalla.getByLabelText('Análisis').value).toBe('Lectura del profesional.');
    expect(solicitarApi).toHaveBeenCalledTimes(1);
  });

  test('Regional consulta el ámbito de la sesión y no abre el asistente', async () => {
    const solicitarApi = jest.fn(async (direccion, ruta) => {
      if (String(ruta).includes('territory/options')) {
        return {
          filters: {
            region: { options: [{ id: 1, name: 'Central Sur' }] },
            localOffice: { options: [{ id: 101, name: 'Hatillo' }], requiresParent: false },
            establishment: { options: [], requiresParent: true }
          }
        };
      }
      return Respuesta();
    });
    render(
      <ReporteriaPagina
        direccionApi="http://127.0.0.1:3001"
        identidad="dev-region-central-sur"
        contexto={{ nivel: 'REGION', puedeDescargarConsolidacion: true }}
        solicitarApi={solicitarApi}
      />
    );
    expect(await pantalla.findByRole('heading', { name: 'Reportería' })).toBeTruthy();
    expect(pantalla.queryByRole('button', { name: 'Generar reporte' })).toBeNull();
    expect(pantalla.getByText(/Indicadores del ámbito autorizado/)).toBeTruthy();
    expect(solicitarApi.mock.calls.some((llamada) => (
      String(llamada[1]).startsWith('/api/reporteria/consulta?')
    ))).toBe(true);
    expect(solicitarApi.mock.calls.some((llamada) => (
      String(llamada[1]).includes('/api/reporteria/oficina')
    ))).toBe(false);
  });
});

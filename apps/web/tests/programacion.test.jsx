/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * HU-044. El formulario debe usar el contrato metodo/json del cliente.
 */
import { fireEvent, render, screen as pantalla } from '@testing-library/react';
import ProgramacionPagina from '../src/funcionalidades/programacion/ProgramacionPagina';

const CATALOGO = {
  disponibilidad: 'DISPONIBLE',
  items: [{
    itemId: 19,
    codigo: 'VISITA_ESTABLECIMIENTO_AI',
    etiqueta: 'Visita a establecimiento de A.I.'
  }]
};

function Consulta(actividades = []) {
  return {
    fechaConsulta: '2026-11-16',
    cantidad: actividades.length,
    total: 2,
    actividades,
    personas: { disponibilidad: 'DISPONIBLE' },
    historial: { disponibilidad: 'DISPONIBLE' },
    proximasAcciones: {
      disponibilidad: 'DISPONIBLE',
      cantidad: 0,
      items: [],
      nota: 'Salen de la última atención individual. '
        + 'No son la frecuencia del plan ni una actividad programada.'
    }
  };
}

function Pagina(solicitarApi) {
  return render(
    <ProgramacionPagina
      direccionApi="http://127.0.0.1:3001"
      identidad="dev-oficina-hatillo"
      contexto={{ puedeGestionarProgramacion: true }}
      navegar={() => {}}
      solicitarApi={solicitarApi}
    />
  );
}

describe('programación en pantalla', () => {
  test('el alta y la resolución usan POST con json', async () => {
    const actividades = [Consulta([{
      actividadId: 80,
      titulo: 'Actividad sintetica',
      fechaPrevista: '2026-12-20',
      fechaVigente: '2026-12-20',
      estado: 'PROGRAMADA',
      alerta: null,
      motivo: null,
      vencida: false
    }]).actividades[0]];
    const solicitarApi = jest.fn(async (_base, ruta, opciones = {}) => {
      if (ruta === '/api/programacion/catalogos') {
        return CATALOGO;
      }
      if (opciones.metodo === 'POST' && ruta.endsWith('/resoluciones')) {
        return { repetida: false, actividad: { estado: 'REALIZADA' } };
      }
      if (opciones.metodo === 'POST') {
        return { repetida: false, actividad: { actividadId: 81, estado: 'PROGRAMADA' } };
      }
      return Consulta(actividades);
    });
    Pagina(solicitarApi);
    expect(await pantalla.findByText('1 de 2 actividades.')).toBeInTheDocument();

    fireEvent.change(pantalla.getByLabelText('Fecha prevista'), {
      target: { value: '2026-12-26' }
    });
    fireEvent.change(pantalla.getByLabelText('Tipo'), { target: { value: '19' } });
    fireEvent.change(pantalla.getByLabelText('Título o propósito'), {
      target: { value: 'VAL prueba de pantalla' }
    });
    fireEvent.click(pantalla.getByRole('button', { name: 'Programar' }));

    expect(await pantalla.findByText('La actividad quedó programada.')).toBeInTheDocument();
    const alta = solicitarApi.mock.calls.find((llamada) => (
      llamada[1] === '/api/programacion/actividades' && llamada[2] && llamada[2].metodo === 'POST'
    ));
    expect(alta[2].json.titulo).toBe('VAL prueba de pantalla');
    expect(alta[2].json.tipoItemId).toBe(19);
    expect(alta[2].json.fecha).toBe('2026-12-26');
    expect(alta[2].method).toBeUndefined();
    expect(alta[2].body).toBeUndefined();

    fireEvent.click(pantalla.getByRole('button', { name: 'Resolver' }));
    fireEvent.click(pantalla.getByRole('button', { name: 'Confirmar resolución' }));
    expect(await pantalla.findByText('La actividad conservó su historial.')).toBeInTheDocument();
    const resolucion = solicitarApi.mock.calls.find((llamada) => (
      String(llamada[1]).endsWith('/resoluciones')
    ));
    expect(resolucion[2].metodo).toBe('POST');
    expect(resolucion[2].json.efecto).toBe('REALIZADA');
    expect(resolucion[2].json.motivo).toBeNull();
  });
});

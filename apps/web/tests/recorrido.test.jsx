import { render, screen as pantalla } from '@testing-library/react';
import eventoUsuario from '@testing-library/user-event';
import Aplicacion from '../src/aplicacion/Aplicacion';

describe('recorrido por rol', () => {
  test('la oficina entra y ve sesiones; el establecimiento no las ve', async () => {
    const usuario = eventoUsuario.setup();
    const solicitarApi = jest.fn(async (_base, ruta, opciones) => {
      if (ruta === '/api/proceso/contexto') {
        const oficina = opciones.identidad === 'dev-oficina-hatillo';
        return {
          nivel: oficina ? 'OFICINA_LOCAL' : 'ESTABLECIMIENTO',
          puedeBuscarPersonas: true,
          puedeCrearReferencia: true,
          puedeConsultarReferencias: true,
          puedeGestionarSesiones: oficina,
          puedeVerListaSimplificada: !oficina,
          puedeVerCasosOficina: oficina,
          puedeVerDetalleCaso: oficina,
          puedeExportarCasos: oficina
        };
      }
      if (ruta === '/api/proceso/resumen') {
        return {
          referencias: { disponibilidad: 'DISPONIBLE', cantidad: 3 },
          referenciasPendientes: { disponibilidad: 'DISPONIBLE', cantidad: 1 },
          casosActivos: { disponibilidad: 'DISPONIBLE', cantidad: 2, personas: 2 },
          proximasSesiones: { disponibilidad: 'DISPONIBLE', items: [] },
          posiblesReferencias: { disponibilidad: 'NO_DISPONIBLE', cantidad: null, motivo: 'No disponible.' },
          actividadesVencidas: { disponibilidad: 'NO_DISPONIBLE', cantidad: null, motivo: 'No disponible.' },
          proximasAcciones: { disponibilidad: 'NO_DISPONIBLE', cantidad: null, motivo: 'No disponible.' }
        };
      }
      return {};
    });

    render(
      <Aplicacion
        direccionApi="http://127.0.0.1:3001"
        ambiente="test"
        consultarEstado={async () => ({ dependenciasDisponibles: true })}
        solicitarApi={solicitarApi}
      />
    );

    expect(pantalla.getByRole('heading', { level: 1, name: 'SIA-CENCINAI' })).toBeInTheDocument();
    await usuario.selectOptions(
      pantalla.getByLabelText('Identidad de desarrollo'),
      'dev-establecimiento-unico'
    );
    await usuario.click(pantalla.getByRole('button', { name: 'Continuar' }));
    expect(await pantalla.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument();
    expect(pantalla.queryByRole('button', { name: 'Sesiones' })).not.toBeInTheDocument();
    expect(pantalla.getByRole('button', { name: 'Buscar persona' })).toBeInTheDocument();

    await usuario.click(pantalla.getByRole('button', { name: 'Salir' }));
    await usuario.selectOptions(
      pantalla.getByLabelText('Identidad de desarrollo'),
      'dev-oficina-hatillo'
    );
    await usuario.click(pantalla.getByRole('button', { name: 'Continuar' }));
    expect(await pantalla.findByRole('button', { name: 'Sesiones' })).toBeInTheDocument();
    expect(pantalla.getByRole('button', { name: 'Pendientes' })).toBeInTheDocument();
    expect((await pantalla.findAllByText('No disponible.')).length).toBeGreaterThan(0);
  });
});

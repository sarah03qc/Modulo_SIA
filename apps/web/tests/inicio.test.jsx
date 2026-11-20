import { render, screen as pantalla } from '@testing-library/react';
import eventoUsuario from '@testing-library/user-event';
import InicioOperativo from '../src/funcionalidades/inicio/InicioOperativo';

function Contexto(extra) {
  return {
    nivel: 'OFICINA_LOCAL',
    puedeConsultarReferencias: true,
    puedeConsultarPosibles: true,
    puedeVerCasosOficina: true,
    puedeGestionarSesiones: true,
    puedeConsultarProgramacion: true,
    puedeRegistrarAtencion: true,
    ...extra
  };
}

function ResumenOficina(extra) {
  return {
    nivel: 'OFICINA_LOCAL',
    etiquetaAmbito: 'Oficina Local Hatillo',
    referenciasPendientes: { disponibilidad: 'DISPONIBLE', cantidad: 4 },
    casosActivos: { disponibilidad: 'DISPONIBLE', cantidad: 6, personas: 6 },
    posiblesReferencias: { disponibilidad: 'DISPONIBLE', cantidad: 2 },
    atencionesRegistradas: {
      disponibilidad: 'DISPONIBLE',
      cantidad: 8,
      grupalesConAsistencia: 1
    },
    actividadesVencidas: { disponibilidad: 'DISPONIBLE', cantidad: 3 },
    proximasSesiones: { disponibilidad: 'DISPONIBLE', cantidad: 1, items: [] },
    agendaHoy: { disponibilidad: 'DISPONIBLE', items: [] },
    proximasAcciones: { disponibilidad: 'DISPONIBLE', items: [] },
    ...extra
  };
}

describe('inicio por ámbito', () => {
  test('la oficina muestra pendientes reales y no una actividad personal inventada', async () => {
    const navegar = jest.fn();
    render(
      <InicioOperativo
        direccionApi="http://127.0.0.1:4000"
        identidad="dev-oficina-hatillo"
        contexto={Contexto()}
        navegar={navegar}
        solicitarApi={async () => ResumenOficina()}
      />
    );
    expect(await pantalla.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument();
    expect(pantalla.getByText('4')).toBeInTheDocument();
    expect(pantalla.getByText('3 actividades vencidas')).toBeInTheDocument();
    expect(pantalla.queryByText('Mi actividad')).not.toBeInTheDocument();
    expect(pantalla.getByText('No tiene actividades programadas para hoy.')).toBeInTheDocument();
    const usuario = eventoUsuario.setup();
    const botones = pantalla.getAllByRole('button', { name: 'Revisar referencias' });
    await usuario.click(botones[0]);
    expect(navegar).toHaveBeenCalledWith('referencias', { estado: 'PENDIENTE_REVISION' });
  });

  test('el establecimiento prioriza la nueva referencia', async () => {
    render(
      <InicioOperativo
        direccionApi="http://127.0.0.1:4000"
        identidad="dev-establecimiento-unico"
        contexto={Contexto({
          nivel: 'ESTABLECIMIENTO',
          puedeCrearReferencia: true,
          puedeBuscarPersonas: true,
          puedeVerCasosOficina: false,
          puedeGestionarSesiones: false,
          puedeConsultarProgramacion: false,
          puedeRegistrarAtencion: false
        })}
        navegar={jest.fn()}
        solicitarApi={async () => ({
          nivel: 'ESTABLECIMIENTO',
          referencias: { disponibilidad: 'DISPONIBLE', cantidad: 5 },
          referenciasPendientes: { disponibilidad: 'DISPONIBLE', cantidad: 1 },
          referenciasConResultado: { disponibilidad: 'DISPONIBLE', cantidad: 2 },
          posiblesReferencias: { disponibilidad: 'DISPONIBLE', cantidad: 0 },
          actividadesVencidas: { disponibilidad: 'NO_DISPONIBLE', cantidad: null }
        })}
      />
    );
    expect(await pantalla.findByRole('button', { name: /Nueva referencia/ })).toBeInTheDocument();
    expect(pantalla.queryByText('Agenda de hoy')).not.toBeInTheDocument();
    expect(pantalla.queryByText('Casos activos')).not.toBeInTheDocument();
  });
});

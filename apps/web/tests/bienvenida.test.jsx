import { act, render, screen as pantalla } from '@testing-library/react';
import eventoUsuario from '@testing-library/user-event';
import { axe } from 'jest-axe';
import Aplicacion from '../src/aplicacion/Aplicacion';

const MENSAJE_DISPONIBILIDAD = 'API en ejecución y dependencias disponibles.';

function RenderizarBienvenida(consultarEstado) {
  return render(
    <Aplicacion
      direccionApi="http://127.0.0.1:3001"
      ambiente="development"
      consultarEstado={consultarEstado}
    />
  );
}

describe('pantalla técnica', () => {
  test('muestra el nombre del proyecto, el ambiente y el estado listo', async () => {
    RenderizarBienvenida(async () => ({ dependenciasDisponibles: true }));

    expect(pantalla.getByRole('heading', { level: 1, name: 'SIA-CENCINAI' })).toBeInTheDocument();
    expect(pantalla.getByText('Desarrollo')).toBeInTheDocument();
    expect(await pantalla.findByText(MENSAJE_DISPONIBILIDAD)).toBeInTheDocument();
  });

  test('muestra el estado de carga y luego el error de conexión', async () => {
    const { promise: consultaPendiente, reject: rechazarConsulta } = Promise.withResolvers();
    RenderizarBienvenida(() => consultaPendiente);

    expect(pantalla.getByText('Comprobando la API.')).toBeInTheDocument();
    rechazarConsulta(new Error('No fue posible comunicarse con la API.'));
    expect(await pantalla.findByText('No fue posible comunicarse con la API.')).toBeInTheDocument();
  });

  test('permite repetir la comprobación con teclado', async () => {
    const usuario = eventoUsuario.setup();
    const consultarEstado = jest.fn()
      .mockResolvedValueOnce({ dependenciasDisponibles: false })
      .mockResolvedValueOnce({ dependenciasDisponibles: true });
    RenderizarBienvenida(consultarEstado);

    expect(await pantalla.findByText(/dependencias no están disponibles/i)).toBeInTheDocument();
    const boton = pantalla.getByRole('button', { name: 'Volver a comprobar' });
    boton.focus();
    expect(boton).toHaveFocus();
    await usuario.keyboard('{Enter}');
    expect(await pantalla.findByText(MENSAJE_DISPONIBILIDAD)).toBeInTheDocument();
  });

  test('conserva el resultado reciente si la consulta anterior termina después', async () => {
    const usuario = eventoUsuario.setup();
    const { promise: consultaAnterior, resolve: resolverConsultaAnterior } =
      Promise.withResolvers();
    const consultarEstado = jest.fn()
      .mockReturnValueOnce(consultaAnterior)
      .mockResolvedValueOnce({ dependenciasDisponibles: true });
    RenderizarBienvenida(consultarEstado);

    await usuario.click(pantalla.getByRole('button', { name: 'Volver a comprobar' }));
    expect(await pantalla.findByText(MENSAJE_DISPONIBILIDAD)).toBeInTheDocument();
    await act(async () => resolverConsultaAnterior({ dependenciasDisponibles: false }));
    expect(pantalla.getByText(MENSAJE_DISPONIBILIDAD)).toBeInTheDocument();
  });

  test('avisa cuando el permiso de solo lectura no está verificado', async () => {
    RenderizarBienvenida(async () => ({
      dependenciasDisponibles: true,
      lecturaInstitucionalVerificada: false
    }));

    expect(await pantalla.findByText(
      'El permiso de solo lectura de la fuente institucional no está verificado.'
    )).toBeInTheDocument();
  });

  test('no presenta violaciones automáticas de axe en el estado listo', async () => {
    const { container: contenedor } = RenderizarBienvenida(
      async () => ({ dependenciasDisponibles: true })
    );
    expect(await pantalla.findByText(MENSAJE_DISPONIBILIDAD)).toBeInTheDocument();
    expect(await axe(contenedor)).toHaveNoViolations();
  });
});

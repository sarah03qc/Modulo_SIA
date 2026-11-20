/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-18.
 * Los formularios de atención inician cerrados y no se pisan entre sí.
 */
import { fireEvent, render, screen as pantalla } from '@testing-library/react';
import AtencionesPagina from '../src/funcionalidades/atenciones/AtencionesPagina';

const CATALOGOS = {
  disciplinas: { items: [] },
  estrategias: { items: [] },
  tipos: { disponibilidad: 'DISPONIBLE', items: [] }
};

describe('paneles de atención', () => {
  test('abre un formulario y conserva el otro al cambiar', async () => {
    render(
      <AtencionesPagina
        direccionApi="http://127.0.0.1:3001"
        identidad="dev-oficina"
        solicitarApi={async () => CATALOGOS}
      />
    );
    expect(await pantalla.findByRole('button', {
      name: 'Registrar atención individual'
    })).toBeTruthy();
    expect(pantalla.queryByRole('textbox', { name: 'Caso activo' })).toBeNull();
    expect(pantalla.queryByRole('textbox', { name: 'Tema u objetivo' })).toBeNull();

    fireEvent.click(pantalla.getByRole('button', {
      name: 'Registrar atención individual'
    }));
    fireEvent.change(pantalla.getByRole('textbox', { name: 'Caso activo' }), {
      target: { value: '10' }
    });
    fireEvent.click(pantalla.getByRole('button', {
      name: 'Registrar atención grupal'
    }));
    expect(pantalla.queryByRole('textbox', { name: 'Caso activo' })).toBeNull();
    expect(pantalla.getByRole('textbox', { name: 'Tema u objetivo' })).toBeTruthy();
    expect(pantalla.getByText(
      'La atención individual conserva lo escrito. No se ha registrado.'
    )).toBeTruthy();

    fireEvent.click(pantalla.getByRole('button', {
      name: 'Registrar atención individual'
    }));
    expect(pantalla.getByRole('textbox', { name: 'Caso activo' })).toHaveValue('10');
    expect(pantalla.queryByRole('textbox', { name: 'Tema u objetivo' })).toBeNull();
  });
});

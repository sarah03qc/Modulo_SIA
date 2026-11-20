/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-18.
 * El contador distingue el corte filtrado, el ámbito y la página visible.
 */
import { render, screen as pantalla } from '@testing-library/react';
import { ResumenResultados } from '../src/componentes/interfaz';

describe('contador de resultados', () => {
  test('sin filtros muestra solo el total del ámbito', () => {
    render(<ResumenResultados filtrados={25} totalAmbito={25} />);
    expect(pantalla.getByText('25 resultados')).toBeTruthy();
    expect(pantalla.queryByText(/Mostrando/)).toBeNull();
  });

  test('con filtros distingue coincidencias y total autorizado', () => {
    render(
      <ResumenResultados filtrados={18} totalAmbito={25} hayFiltros />
    );
    expect(pantalla.getByText('18 de 25 resultados')).toBeTruthy();
  });

  test('sin coincidencias conserva el total del ámbito', () => {
    render(
      <ResumenResultados filtrados={0} totalAmbito={25} hayFiltros />
    );
    expect(pantalla.getByText('0 de 25 resultados')).toBeTruthy();
  });

  test('la página no sustituye al total filtrado', () => {
    render(
      <ResumenResultados
        filtrados={38}
        totalAmbito={120}
        pagina={1}
        tamano={20}
        hayFiltros
      />
    );
    expect(pantalla.getByText('38 de 120 resultados')).toBeTruthy();
    expect(pantalla.getByText('Mostrando 1–20 de 38')).toBeTruthy();
  });
});

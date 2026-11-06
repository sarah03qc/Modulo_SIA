import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import App from '../src/app/App';

function renderWelcome(loadStatus) {
  return render(
    <App
      apiBaseUrl="http://127.0.0.1:3001"
      environmentMode="development"
      loadStatus={loadStatus}
    />
  );
}

describe('pantalla técnica', () => {
  test('muestra el nombre del proyecto, el ambiente y el estado listo', async () => {
    renderWelcome(async () => ({ dependenciesAvailable: true }));

    expect(screen.getByRole('heading', { level: 1, name: 'SIA-CENCINAI' })).toBeInTheDocument();
    expect(screen.getByText('Desarrollo')).toBeInTheDocument();
    expect(await screen.findByText('API en ejecución y dependencias disponibles.')).toBeInTheDocument();
  });

  test('muestra el estado de carga y luego el error de conexión', async () => {
    let resolveStatus;
    const pending = new Promise((resolve, reject) => {
      resolveStatus = () => reject(new Error('No fue posible comunicarse con la API.'));
    });
    renderWelcome(() => pending);

    expect(screen.getByText('Comprobando la API.')).toBeInTheDocument();
    resolveStatus();
    expect(await screen.findByText('No fue posible comunicarse con la API.')).toBeInTheDocument();
  });

  test('permite repetir la comprobación con teclado', async () => {
    const user = userEvent.setup();
    const loadStatus = jest.fn()
      .mockResolvedValueOnce({ dependenciesAvailable: false })
      .mockResolvedValueOnce({ dependenciesAvailable: true });
    renderWelcome(loadStatus);

    expect(await screen.findByText(/dependencias no están disponibles/i)).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Volver a comprobar' });
    button.focus();
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(await screen.findByText('API en ejecución y dependencias disponibles.')).toBeInTheDocument();
  });

  test('avisa cuando el permiso de solo lectura no está verificado', async () => {
    renderWelcome(async () => ({
      dependenciesAvailable: true,
      institutionalReadOnly: false
    }));

    expect(await screen.findByText(/permiso de solo lectura de la fuente institucional no está verificado/i)).toBeInTheDocument();
  });

  test('no presenta violaciones automáticas de axe en el estado listo', async () => {
    const { container } = renderWelcome(async () => ({ dependenciesAvailable: true }));
    expect(await screen.findByText('API en ejecución y dependencias disponibles.')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});

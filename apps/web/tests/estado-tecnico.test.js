import { ConsultarEstadoTecnico } from '../src/servicios/estado-tecnico';

function CrearRespuestaJson(contenido, esCorrecta = true) {
  return {
    ok: esCorrecta,
    json: async () => contenido
  };
}

describe('ConsultarEstadoTecnico', () => {
  test('marca las dependencias disponibles cuando health y ready responden', async () => {
    const consultar = jest.fn()
      .mockResolvedValueOnce(CrearRespuestaJson({ status: 'ok' }))
      .mockResolvedValueOnce(CrearRespuestaJson({ status: 'ready' }));

    const resultado = await ConsultarEstadoTecnico('http://127.0.0.1:3001/', consultar);

    expect(resultado.dependenciasDisponibles).toBe(true);
    expect(consultar).toHaveBeenNthCalledWith(1, 'http://127.0.0.1:3001/health');
    expect(consultar).toHaveBeenNthCalledWith(2, 'http://127.0.0.1:3001/ready');
  });

  test('distingue una API activa con dependencias no disponibles', async () => {
    const consultar = jest.fn()
      .mockResolvedValueOnce(CrearRespuestaJson({ status: 'ok' }))
      .mockResolvedValueOnce(CrearRespuestaJson({ status: 'unavailable' }, false));

    const resultado = await ConsultarEstadoTecnico('http://127.0.0.1:3001', consultar);
    expect(resultado.dependenciasDisponibles).toBe(false);
  });

  test('informa error de conexión sin exponer la causa interna', async () => {
    const consultar = jest.fn().mockRejectedValue(new Error('ECONNREFUSED 10.0.0.8'));
    await expect(ConsultarEstadoTecnico('http://127.0.0.1:3001', consultar))
      .rejects.toThrow('No fue posible comunicarse con la API.');
  });

  test('oculta los detalles del analizador si el JSON es inválido', async () => {
    const consultar = jest.fn()
      .mockResolvedValueOnce(CrearRespuestaJson({ status: 'ok' }))
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockRejectedValue(new SyntaxError('detalle interno de infraestructura'))
      });

    await expect(ConsultarEstadoTecnico('http://127.0.0.1:3001', consultar))
      .rejects.toThrow(/^La API no respondió correctamente\.$/);
  });
});

import { loadTechnicalStatus } from '../src/services/technical-status';

function jsonResponse(body, ok = true) {
  return {
    ok,
    json: async () => body
  };
}

describe('loadTechnicalStatus', () => {
  test('marca las dependencias disponibles cuando health y ready responden', async () => {
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce(jsonResponse({ status: 'ok' }))
      .mockResolvedValueOnce(jsonResponse({ status: 'ready' }));

    const result = await loadTechnicalStatus('http://127.0.0.1:3001/', fetchImpl);

    expect(result.dependenciesAvailable).toBe(true);
    expect(fetchImpl).toHaveBeenNthCalledWith(1, 'http://127.0.0.1:3001/health');
    expect(fetchImpl).toHaveBeenNthCalledWith(2, 'http://127.0.0.1:3001/ready');
  });

  test('distingue una API activa con dependencias no disponibles', async () => {
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce(jsonResponse({ status: 'ok' }))
      .mockResolvedValueOnce(jsonResponse({ status: 'unavailable' }, false));

    const result = await loadTechnicalStatus('http://127.0.0.1:3001', fetchImpl);
    expect(result.dependenciesAvailable).toBe(false);
  });

  test('informa error de conexión sin exponer la causa interna', async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new Error('ECONNREFUSED 10.0.0.8'));
    await expect(loadTechnicalStatus('http://127.0.0.1:3001', fetchImpl))
      .rejects.toThrow('No fue posible comunicarse con la API.');
  });
});

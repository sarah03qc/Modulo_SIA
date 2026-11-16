'use strict';

const { CrearRepositorioCiclo } = require('../src/modules/ciclo-caso/repositorio-ciclo');

function CasoActivo() {
  return {
    caso_id: 40,
    per_id_persona: 'SYN-CICLO',
    estado: 'ACTIVO',
    establecimiento_id: 1100102,
    fecha_apertura: '2024-01-01'
  };
}

function Registro() {
  return {
    casoId: 40,
    usuario: 'dev-oficina-hatillo',
    rol: 'OFICINA_LOCAL',
    oficinaLocalId: 101,
    regionId: 1,
    claveOperacion: 'clave-coord-01',
    ambito: 'oficina:101;region:1;caso:40',
    institucionItemId: null,
    institucionTexto: 'Centro de salud',
    profesional: 'dev-oficina-hatillo',
    fecha: '2026-11-16',
    motivo: 'Consulta',
    estadoItemId: null,
    estadoTexto: 'Realizada'
  };
}

function Cliente(consultas) {
  return {
    async EnTransaccion(trabajo) {
      return trabajo({
        query: async (texto) => consultas(texto)
      });
    }
  };
}

describe('repositorio del ciclo', () => {
  test('la misma clave no inserta otra coordinación', async () => {
    const textos = [];
    const repositorio = CrearRepositorioCiclo(Cliente(async (texto) => {
      textos.push(texto);
      if (texto.includes('FROM dbo.caso_ai WITH (UPDLOCK, HOLDLOCK)')) {
        return [CasoActivo()];
      }
      if (texto.includes('FROM dbo.aud_evento WITH (UPDLOCK, HOLDLOCK)')) {
        return [{ entidad_id: '15' }];
      }
      if (texto.includes('FROM dbo.doc_coordinacion')) {
        return [{
          coordinacion_id: 15,
          caso_id: 40,
          institucion_texto: 'Centro de salud',
          profesional_responsable: 'dev-oficina-hatillo',
          digitador_usuario: 'dev-oficina-hatillo',
          motivo: 'Consulta',
          fecha_coordinacion: '2026-11-16',
          estado_texto: 'Realizada'
        }];
      }
      return [];
    }));
    const resultado = await repositorio.RegistrarCoordinacion(Registro());
    expect(resultado.repetida).toBe(true);
    expect(resultado.coordinacion.coordinacionId).toBe(15);
    expect(textos.some((texto) => texto.includes('INSERT INTO dbo.doc_coordinacion'))).toBe(false);
  });

  test('si la inserción se interrumpe, no confirma la coordinación', async () => {
    const repositorio = CrearRepositorioCiclo(Cliente(async (texto) => {
      if (texto.includes('FROM dbo.caso_ai WITH (UPDLOCK, HOLDLOCK)')) {
        return [CasoActivo()];
      }
      if (texto.includes('FROM dbo.aud_evento WITH (UPDLOCK, HOLDLOCK)')) {
        return [];
      }
      if (texto.includes('INSERT INTO dbo.doc_coordinacion')) {
        const error = new Error('permiso');
        error.sqlNumber = 229;
        throw error;
      }
      return [];
    }));
    await expect(repositorio.RegistrarCoordinacion(Registro())).rejects.toMatchObject({
      code: 'PERMISO'
    });
  });

  test('un caso que ya no está activo no recibe otra coordinación', async () => {
    const repositorio = CrearRepositorioCiclo(Cliente(async (texto) => {
      if (texto.includes('FROM dbo.caso_ai WITH (UPDLOCK, HOLDLOCK)')) {
        return [{ ...CasoActivo(), estado: 'CERRADO' }];
      }
      if (texto.includes('FROM dbo.aud_evento WITH (UPDLOCK, HOLDLOCK)')) {
        return [];
      }
      return [];
    }));
    await expect(repositorio.RegistrarCoordinacion(Registro())).rejects.toMatchObject({
      code: 'CASO_NO_ACTIVO'
    });
  });
});

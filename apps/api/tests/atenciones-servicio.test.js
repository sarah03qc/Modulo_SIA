'use strict';

const { CrearContextoUsuario } = require('../src/infrastructure/auth/user-context');
const { CrearServicioAtenciones } = require('../src/modules/atenciones/servicio-atenciones');
const { LeerAtencionGrupal } = require('../src/modules/atenciones/validacion-atenciones');

function AccesoOficina() {
  return CrearContextoUsuario({
    source: 'SYNTHETIC_DEVELOPMENT',
    principalId: 'dev-oficina-hatillo',
    grants: [{ role: 'OFICINA_LOCAL', regionId: 1, localOfficeId: 101 }]
  });
}

function AccesoEstablecimiento() {
  return CrearContextoUsuario({
    source: 'SYNTHETIC_DEVELOPMENT',
    principalId: 'dev-establecimiento-unico',
    grants: [{ role: 'ESTABLECIMIENTO', establishmentIds: [1100102] }]
  });
}

describe('servicio de atenciones', () => {
  test('el establecimiento no registra atenciones', async () => {
    const servicio = CrearServicioAtenciones({
      adaptador: {},
      repositorio: { ListarCatalogo: jest.fn() }
    });
    await expect(servicio.RegistrarIndividual(AccesoEstablecimiento(), {
      casoId: 1,
      fechaAtencion: '2026-11-16',
      disciplinaId: 1,
      estrategiaId: 2,
      acciones: 'Orientación',
      recomendaciones: 'Seguimiento',
      proximaAccion: null,
      fechaProxima: null
    })).rejects.toMatchObject({ status: 403 });
  });

  test('un caso que no está activo y autorizado no recibe atención', async () => {
    const registrar = jest.fn();
    const servicio = CrearServicioAtenciones({
      adaptador: {
        BuscarOficinaLocal: jest.fn(async () => ({ region_id: 1 })),
        BuscarRegion: jest.fn(async () => ({})),
        BuscarEstablecimiento: jest.fn(async () => ({ local_office_id: 101, region_id: 1 }))
      },
      repositorio: {
        ListarCatalogo: jest.fn(async () => [
          { cat_item_id: 1, codigo_catalogo: 'DISCIPLINA', codigo: 'NUTRICION', etiqueta: 'Nutrición' },
          { cat_item_id: 2, codigo_catalogo: 'ESTRATEGIA', codigo: 'ACOMPANAR', etiqueta: 'Acompañar' }
        ]),
        BuscarCasoActivo: jest.fn(async () => null),
        RegistrarIndividual: registrar
      }
    });
    await expect(servicio.RegistrarIndividual(AccesoOficina(), {
      casoId: 9,
      fechaAtencion: '2026-11-16',
      disciplinaId: 1,
      estrategiaId: 2,
      acciones: 'Orientación sintética',
      recomendaciones: 'Volver a observar',
      proximaAccion: null,
      fechaProxima: null
    })).rejects.toMatchObject({ status: 404 });
    expect(registrar).not.toHaveBeenCalled();
  });

  test('la grupal rechaza el mismo caso dos veces antes de persistir', () => {
    expect(() => LeerAtencionGrupal({
      fechaAtencion: '2026-11-16',
      tipoId: 3,
      tema: 'Taller sintético',
      lugar: 'Sala',
      acciones: 'Conversación',
      recomendaciones: 'Continuar',
      disciplinas: [1],
      profesionales: [],
      participantes: [
        { casoId: 4, asistio: true },
        { casoId: 4, asistio: false }
      ]
    })).toThrow(/repetirse/);
  });

  test('sin tipo vigente no inventa una clasificación', async () => {
    const servicio = CrearServicioAtenciones({
      adaptador: {},
      repositorio: { ListarCatalogo: jest.fn(async () => []) }
    });
    const catalogos = await servicio.ListarCatalogos(AccesoOficina());
    expect(catalogos.tipos.disponibilidad).toBe('NEEDS_VALIDATION');
    expect(catalogos.tipos.items).toEqual([]);
    expect(catalogos.clasificacionActividadesEducativas).toBe('NEEDS_VALIDATION');
  });
});

'use strict';

const { CrearContextoUsuario } = require('../src/infrastructure/auth/user-context');
const { CrearServicioProgramacion } = require('../src/modules/programacion/servicio-programacion');
const {
  LeerActividad,
  LeerResolucion
} = require('../src/modules/programacion/validacion-programacion');

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

function Actividad(estado, fecha) {
  return {
    actividadId: 8,
    establecimientoId: null,
    tipoItemId: 4,
    titulo: 'Visita sintetica',
    fechaPrevista: '2026-11-01',
    fechaVigente: fecha,
    estado,
    motivo: null,
    observaciones: null,
    responsable: 'dev-oficina-hatillo',
    cambios: []
  };
}

function Servicio(repositorio) {
  return CrearServicioProgramacion({
    repositorio,
    adaptador: {
      BuscarEstablecimiento: jest.fn(async () => ({
        establishmentId: 1100102,
        localOfficeId: 101,
        regionId: 1
      })),
      BuscarOficinaLocal: jest.fn(),
      BuscarRegion: jest.fn()
    }
  });
}

describe('programación de Oficina Local', () => {
  test('el establecimiento no gestiona la programación', async () => {
    const servicio = Servicio({ ListarTipos: jest.fn() });
    await expect(servicio.ListarCatalogos(AccesoEstablecimiento()))
      .rejects.toMatchObject({ status: 403 });
  });

  test('crea en la oficina de la sesión y no duplica la misma clave', async () => {
    const crear = jest.fn()
      .mockResolvedValueOnce({ repetida: false, actividad: Actividad('PROGRAMADA', '2026-12-01') })
      .mockResolvedValueOnce({ repetida: true, actividad: Actividad('PROGRAMADA', '2026-12-01') });
    const servicio = Servicio({
      ListarTipos: jest.fn(async () => [{
        cat_item_id: 4,
        codigo: 'VISITA_ESTABLECIMIENTO_AI',
        etiqueta: 'Visita a establecimiento de A.I.'
      }]),
      Crear: crear
    });
    const solicitud = {
      fecha: '2026-12-01',
      tipoItemId: 4,
      titulo: 'Visita sintetica',
      establecimientoId: null,
      observaciones: null,
      casos: [],
      claveOperacion: 'prog-clave-01'
    };
    const primera = await servicio.CrearActividad(AccesoOficina(), solicitud);
    const segunda = await servicio.CrearActividad(AccesoOficina(), solicitud);
    expect(primera.repetida).toBe(false);
    expect(segunda.repetida).toBe(true);
    expect(crear).toHaveBeenCalledTimes(2);
    expect(crear.mock.calls[0][0].oficinaLocalId).toBe(101);
    expect(crear.mock.calls[0][0].regionId).toBe(1);
  });

  test('rechaza un tipo que no está vigente', async () => {
    const servicio = Servicio({
      ListarTipos: jest.fn(async () => []),
      Crear: jest.fn()
    });
    await expect(servicio.CrearActividad(AccesoOficina(), {
      fecha: '2026-12-01',
      tipoItemId: 99,
      titulo: 'Sin tipo',
      establecimientoId: null,
      observaciones: null,
      casos: [],
      claveOperacion: 'prog-clave-02'
    })).rejects.toMatchObject({ status: 400 });
  });

  test('reprogramar exige una fecha que no sea anterior a hoy', async () => {
    const resolver = jest.fn();
    const servicio = Servicio({ Resolver: resolver });
    await expect(servicio.ResolverActividad(AccesoOficina(), 8, {
      efecto: 'REPROGRAMADA',
      motivo: 'Clima',
      nuevaFecha: '2020-01-01',
      claveOperacion: 'prog-clave-03'
    })).rejects.toMatchObject({ status: 400 });
    expect(resolver).not.toHaveBeenCalled();
  });

  test('una actividad ya resuelta no admite otra transición', async () => {
    const error = new Error('estado');
    error.domain = true;
    error.code = 'ESTADO';
    const servicio = Servicio({
      Resolver: jest.fn(async () => {
        throw error;
      })
    });
    await expect(servicio.ResolverActividad(AccesoOficina(), 8, {
      efecto: 'CANCELADA',
      motivo: 'Sin transporte',
      nuevaFecha: null,
      claveOperacion: 'prog-clave-04'
    })).rejects.toMatchObject({ status: 409 });
  });

  test('marca vencida solo la programada con fecha anterior y separa la próxima acción', async () => {
    const servicio = Servicio({
      Listar: jest.fn(async () => [{
        actividad_id: 3,
        establecimiento_id: null,
        tipo_item_id: 4,
        titulo: 'Actividad sintetica vencida',
        fecha_prevista: '2026-01-15',
        fecha_vigente: '2026-01-15',
        estado: 'PROGRAMADA',
        motivo_vigente: null,
        observaciones: null,
        creada_por: 'semilla'
      }, {
        actividad_id: 4,
        establecimiento_id: 1100102,
        tipo_item_id: 4,
        titulo: 'Actividad sintetica reprogramada',
        fecha_prevista: '2026-05-01',
        fecha_vigente: '2026-06-01',
        estado: 'REPROGRAMADA',
        motivo_vigente: 'Sintetico reprogramacion',
        observaciones: null,
        creada_por: 'semilla'
      }]),
      Contar: jest.fn(async () => 8),
      ListarPersonas: jest.fn(async () => []),
      ListarCambios: jest.fn(async () => []),
      ListarProximasAcciones: jest.fn(async () => [{
        caso_id: 40,
        per_id_persona: 'SYN-40',
        proxima_accion: 'Visita de seguimiento',
        fecha_proxima: '2026-12-01',
        atencion_individual_id: 70
      }])
    });
    const consulta = await servicio.Consultar(AccesoOficina(), {
      establecimientoId: null,
      estado: null
    });
    expect(consulta.cantidad).toBe(2);
    expect(consulta.total).toBe(8);
    expect(consulta.actividades[0].vencida).toBe(true);
    expect(consulta.actividades[0].alerta).toBe('Vencida');
    expect(consulta.actividades[1].vencida).toBe(false);
    expect(consulta.proximasAcciones.items).toEqual([
      expect.objectContaining({ casoId: 40, origen: 'ATENCION_INDIVIDUAL' })
    ]);
    expect(consulta.proximasAcciones.nota).toContain('frecuencia del plan');
  });

  test('la solicitud no acepta la oficina del cliente', () => {
    expect(() => LeerActividad({
      fecha: '2026-12-01',
      tipoItemId: 4,
      titulo: 'Visita',
      oficinaLocalId: 501,
      claveOperacion: 'prog-clave-05'
    })).toThrow(/sesión/);
  });

  test('realizada no admite motivo y reprogramar lo exige', () => {
    expect(() => LeerResolucion({
      efecto: 'REALIZADA',
      motivo: 'No corresponde',
      claveOperacion: 'prog-clave-06'
    })).toThrow(/realizada/i);
    expect(LeerResolucion({
      efecto: 'REPROGRAMADA',
      motivo: 'Clima',
      nuevaFecha: '2026-12-20',
      claveOperacion: 'prog-clave-07'
    }).nuevaFecha).toBe('2026-12-20');
  });
});

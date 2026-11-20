/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-18.
 * El expediente muestra una categoría a la vez y abre las acciones al pedirlas.
 */
import { fireEvent, render, screen as pantalla } from '@testing-library/react';
import ExpedienteOperativo from '../src/funcionalidades/casos/ExpedienteOperativo';

const DETALLE = {
  casoId: 10,
  nombre: 'Persona sintetica',
  identificacion: 'ID-10',
  estado: 'ACTIVO',
  establecimientoNombre: 'Establecimiento sintetico',
  fechaApertura: '2026-01-01',
  prioridadCodigo: 'MODERADO',
  prioridadEtiqueta: 'Moderado',
  riesgoCodigo: null,
  proteccionCodigo: null,
  consecutivo: 'REF-10',
  contextoIngreso: {
    encargado: 'Encargado sintetico',
    relacion: 'Madre',
    contacto: '0000-0000'
  },
  ultimaAtencion: { mensaje: 'Sin atención registrada.' },
  pendientes: [],
  valoraciones: [],
  plan: null,
  planes: [],
  atenciones: [],
  participacionesGrupales: [],
  consultaIndividual: { disponibilidad: 'DISPONIBLE', mensaje: null },
  consultaGrupal: { disponibilidad: 'DISPONIBLE', mensaje: null },
  consultaPlanes: { disponibilidad: 'DISPONIBLE', mensaje: null },
  documentos: { disponibilidad: 'DISPONIBLE', cantidad: 0 },
  coordinaciones: { disponibilidad: 'DISPONIBLE', registros: [] },
  reportes: { disponibilidad: 'DISPONIBLE', registros: [] },
  cierre: { disponibilidad: 'DISPONIBLE', registro: null },
  lineaTiempo: [{ clave: 'apertura', fecha: '2026-01-01', texto: 'Apertura' }],
  historial: []
};

const CATALOGOS = {
  instituciones: { disponibilidad: 'DISPONIBLE', items: [] },
  estadosCoordinacion: { disponibilidad: 'DISPONIBLE', items: [] },
  motivosCierre: {
    disponibilidad: 'DISPONIBLE',
    items: [
      {
        itemId: 1,
        codigo: 'SATISFACTORIO',
        etiqueta: 'Cierre satisfactorio',
        requiereTexto: false
      },
      {
        itemId: 2,
        codigo: 'TRASLADO',
        etiqueta: 'Traslado',
        requiereTexto: false
      }
    ]
  }
};

function Montar() {
  return render(
    <ExpedienteOperativo
      detalle={DETALLE}
      direccionApi="http://127.0.0.1:3001"
      identidad="dev-oficina"
      contexto={{
        puedeRegistrarCoordinacion: true,
        puedeGenerarReporte: true,
        puedeCerrarCaso: true
      }}
      solicitarApi={async () => CATALOGOS}
      alCerrar={() => {}}
      alActualizar={async () => {}}
    />
  );
}

describe('expediente por categorías', () => {
  test('abre en el resumen y no mezcla vacíos de otras secciones', () => {
    Montar();
    expect(pantalla.getByRole('heading', { name: 'Persona sintetica' })).toBeTruthy();
    expect(pantalla.queryByText('Todavía no hay coordinaciones registradas.')).toBeNull();
    expect(pantalla.queryByText(
      'Todavía no hay un cierre ni un traslado registrado.'
    )).toBeNull();
    expect(pantalla.queryByLabelText('Institución')).toBeNull();
  });

  test('la coordinación y el cierre aparecen solo al solicitarlos', async () => {
    Montar();
    fireEvent.click(pantalla.getByRole('tab', { name: 'Coordinaciones' }));
    expect(pantalla.getByText('Todavía no hay coordinaciones registradas.')).toBeTruthy();
    expect(pantalla.queryByLabelText('Institución')).toBeNull();
    fireEvent.click(pantalla.getByRole('button', { name: 'Registrar coordinación' }));
    expect(await pantalla.findByLabelText('Institución')).toBeTruthy();

    fireEvent.click(pantalla.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(pantalla.getByRole('tab', { name: 'Cierre y traslado' }));
    expect(pantalla.queryByLabelText('Motivo')).toBeNull();
    fireEvent.click(pantalla.getByRole('button', { name: 'Cerrar caso' }));
    expect(await pantalla.findByLabelText('Motivo')).toBeTruthy();
    expect(pantalla.queryByRole('option', { name: 'Traslado' })).toBeNull();
  });
});

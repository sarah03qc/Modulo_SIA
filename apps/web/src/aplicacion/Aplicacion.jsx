/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Primer registro del archivo en Git: 2026-11-06 (5fabddc).
 * Modificación del 2026-11-14: navegación operativa por rol.
 * Modificación del 2026-11-16: atenciones, seguimiento y programación.
 */
import { useState } from 'react';
import { Aviso } from '../componentes/interfaz';
import BienvenidaTecnica from '../funcionalidades/bienvenida/BienvenidaTecnica';
import AtencionesPagina from '../funcionalidades/atenciones/AtencionesPagina';
import CasosPagina from '../funcionalidades/casos/CasosPagina';
import ProgramacionPagina from '../funcionalidades/programacion/ProgramacionPagina';
import SeguimientoPagina from '../funcionalidades/seguimiento/SeguimientoPagina';
import InicioOperativo from '../funcionalidades/inicio/InicioOperativo';
import BusquedaContextual from '../funcionalidades/personas/BusquedaContextual';
import FormularioReferencia from '../funcionalidades/referencias/FormularioReferencia';
import ListaReferencias from '../funcionalidades/referencias/ListaReferencias';
import SesionesPagina from '../funcionalidades/sesiones/SesionesPagina';
import { IDENTIDADES_DESARROLLO } from './identidades-desarrollo';
import { SolicitarApi } from '../servicios/cliente-api';

/**
 * Aplicación operativa. La identidad de desarrollo solo selecciona un registro del servidor.
 */
export default function Aplicacion({
  direccionApi,
  ambiente,
  consultarEstado,
  solicitarApi = SolicitarApi
}) {
  const [elegida, establecerElegida] = useState(IDENTIDADES_DESARROLLO[0].id);
  const [identidad, establecerIdentidad] = useState('');
  const [contexto, establecerContexto] = useState(null);
  const [vista, establecerVista] = useState({ nombre: 'inicio', parametros: {} });
  const [error, establecerError] = useState('');

  async function Entrar(evento) {
    evento.preventDefault();
    establecerError('');
    try {
      const datos = await solicitarApi(direccionApi, '/api/proceso/contexto', { identidad: elegida });
      establecerIdentidad(elegida);
      establecerContexto(datos);
      establecerVista({ nombre: 'inicio', parametros: {} });
    } catch (fallo) {
      establecerError(fallo.message);
    }
  }

  function Navegar(nombre, parametros = {}) {
    establecerVista({ nombre, parametros });
  }

  if (!contexto) {
    return (
      <main>
        <BienvenidaTecnica
          embebida
          direccionApi={direccionApi}
          ambiente={ambiente}
          consultarEstado={consultarEstado}
        />
        <form className="panel" onSubmit={Entrar}>
          <h2>Entrada de desarrollo</h2>
          <p>La sesión institucional productiva sigue pendiente. Esta lista no asigna un rol.</p>
          <div className="campo">
            <label htmlFor="identidad-desarrollo">Identidad de desarrollo</label>
            <select
              id="identidad-desarrollo"
              value={elegida}
              onChange={(evento) => establecerElegida(evento.target.value)}
            >
              {IDENTIDADES_DESARROLLO.map((item) => (
                <option key={item.id} value={item.id}>{item.etiqueta}</option>
              ))}
            </select>
          </div>
          {error ? <Aviso>{error}</Aviso> : null}
          <button type="submit">Continuar</button>
        </form>
      </main>
    );
  }

  const propiedades = {
    direccionApi,
    identidad,
    contexto,
    navegar: Navegar,
    parametros: vista.parametros,
    solicitarApi
  };
  return (
    <div className="aplicacion">
      <header>
        <p className="marca">SIA-CENCINAI</p>
        <p>Atención Interdisciplinaria — {contexto.nivel || 'sin ámbito confirmado'}</p>
      </header>
      <nav className="navegacion" aria-label="Principal">
        <button type="button" aria-current={vista.nombre === 'inicio' ? 'page' : undefined} onClick={() => Navegar('inicio')}>Inicio</button>
        {contexto.puedeBuscarPersonas ? <button type="button" onClick={() => Navegar('buscar')}>Buscar persona</button> : null}
        {contexto.puedeCrearReferencia ? <button type="button" onClick={() => Navegar('referencia-nueva')}>Nueva referencia</button> : null}
        {contexto.puedeConsultarReferencias ? <button type="button" onClick={() => Navegar('referencias')}>Referencias</button> : null}
        {contexto.puedeGestionarSesiones ? <button type="button" onClick={() => Navegar('bandeja')}>Pendientes</button> : null}
        {contexto.puedeGestionarSesiones ? <button type="button" onClick={() => Navegar('sesiones')}>Sesiones</button> : null}
        {contexto.puedeVerListaSimplificada || contexto.puedeVerCasosOficina
          ? <button type="button" onClick={() => Navegar('casos')}>Casos</button>
          : null}
        {contexto.puedeRegistrarAtencion
          ? <button type="button" onClick={() => Navegar('atenciones')}>Atenciones</button>
          : null}
        {contexto.puedeConsultarSeguimiento
          ? <button type="button" onClick={() => Navegar('seguimiento')}>Sin atención</button>
          : null}
        {contexto.puedeConsultarProgramacion
          ? <button type="button" onClick={() => Navegar('programacion')}>Programación</button>
          : null}
        <button type="button" className="secundario" onClick={() => Navegar('tecnico')}>Estado técnico</button>
        <button type="button" className="secundario" onClick={() => { establecerContexto(null); establecerIdentidad(''); }}>Salir</button>
      </nav>
      <main id="contenido">
        {vista.nombre === 'inicio' ? <InicioOperativo {...propiedades} /> : null}
        {vista.nombre === 'buscar' ? <BusquedaContextual {...propiedades} /> : null}
        {vista.nombre === 'referencia-nueva' ? (
          <FormularioReferencia
            direccionApi={direccionApi}
            identidad={identidad}
            personIdInicial={vista.parametros.personId || ''}
            solicitarApi={solicitarApi}
          />
        ) : null}
        {vista.nombre === 'referencias' ? <ListaReferencias {...propiedades} /> : null}
        {vista.nombre === 'bandeja' ? <ListaReferencias {...propiedades} soloPendientes /> : null}
        {vista.nombre === 'sesiones' ? <SesionesPagina {...propiedades} /> : null}
        {vista.nombre === 'sesion' ? <SesionesPagina {...propiedades} /> : null}
        {vista.nombre === 'casos' ? <CasosPagina {...propiedades} /> : null}
        {vista.nombre === 'atenciones' ? <AtencionesPagina {...propiedades} /> : null}
        {vista.nombre === 'seguimiento' ? <SeguimientoPagina {...propiedades} /> : null}
        {vista.nombre === 'programacion' ? <ProgramacionPagina {...propiedades} /> : null}
        {vista.nombre === 'tecnico' ? (
          <BienvenidaTecnica
            embebida
            direccionApi={direccionApi}
            ambiente={ambiente}
            consultarEstado={consultarEstado}
          />
        ) : null}
      </main>
    </div>
  );
}

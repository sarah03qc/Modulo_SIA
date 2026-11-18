/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Primer registro del archivo en Git: 2026-11-06 (5fabddc).
 * Modificación del 2026-11-14: navegación operativa por rol.
 * Modificación del 2026-11-16: atenciones, seguimiento, programación,
 * reportería y consulta Regional y Nacional.
 * Modificación: 2026-11-18. Sección de posibles referencias.
 * Modificación: 2026-11-18. Navegación lateral y orientación por ámbito.
 */
import { lazy, Suspense, useState } from 'react';
import { Aviso, Cargando } from '../componentes/interfaz';
import BienvenidaTecnica from '../funcionalidades/bienvenida/BienvenidaTecnica';
import AtencionesPagina from '../funcionalidades/atenciones/AtencionesPagina';
import CasosPagina from '../funcionalidades/casos/CasosPagina';
import ProgramacionPagina from '../funcionalidades/programacion/ProgramacionPagina';
import SeguimientoPagina from '../funcionalidades/seguimiento/SeguimientoPagina';
import InicioOperativo from '../funcionalidades/inicio/InicioOperativo';
import BusquedaContextual from '../funcionalidades/personas/BusquedaContextual';
import FormularioReferencia from '../funcionalidades/referencias/FormularioReferencia';
import ListaReferencias from '../funcionalidades/referencias/ListaReferencias';
import PosiblesReferenciasPagina from '../funcionalidades/posibles/PosiblesReferenciasPagina';
import SesionesPagina from '../funcionalidades/sesiones/SesionesPagina';
import { IDENTIDADES_DESARROLLO } from './identidades-desarrollo';
import { SolicitarApi } from '../servicios/cliente-api';

const ReporteriaPagina = lazy(
  () => import('../funcionalidades/reporteria/ReporteriaPagina')
);

const ETIQUETAS_NIVEL = {
  ESTABLECIMIENTO: 'Establecimiento',
  OFICINA_LOCAL: 'Oficina Local',
  REGION: 'Región',
  NACIONAL: 'Nivel nacional'
};

function VistaActiva(vista, nombre) {
  if (nombre === 'sesiones') {
    return vista.nombre === 'sesiones' || vista.nombre === 'sesion';
  }
  return vista.nombre === nombre;
}

function BotonNav({ activa, alActivar, secundario = false, children }) {
  return (
    <button
      type="button"
      className={secundario ? 'secundario' : undefined}
      aria-current={activa ? 'page' : undefined}
      onClick={alActivar}
    >
      {children}
    </button>
  );
}

function GrupoNav({ id, titulo, children }) {
  return (
    <div className="grupo-nav">
      <p id={id}>{titulo}</p>
      <div role="group" aria-labelledby={id}>{children}</div>
    </div>
  );
}

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
      <main className="acceso">
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
  const etiquetaNivel = ETIQUETAS_NIVEL[contexto.nivel] || 'Sin ámbito confirmado';
  const identidadVisible = IDENTIDADES_DESARROLLO.find((item) => item.id === identidad);
  const puedeCasos = contexto.puedeVerListaSimplificada
    || contexto.puedeVerCasosOficina
    || contexto.puedeVerCasosRegion
    || contexto.puedeVerCasosNacional;
  const puedePersonas = contexto.puedeBuscarPersonas
    || contexto.puedeCrearReferencia
    || contexto.puedeConsultarReferencias
    || contexto.puedeConsultarPosibles
    || contexto.puedeGestionarSesiones;
  const puedeAtencion = contexto.puedeGestionarSesiones
    || puedeCasos
    || contexto.puedeRegistrarAtencion
    || contexto.puedeConsultarSeguimiento
    || contexto.puedeConsultarProgramacion;

  return (
    <div className="aplicacion">
      <a className="saltar" href="#contenido">Saltar al contenido</a>
      <aside className="barra-lateral">
        <div className="marca-bloque">
          <p className="marca">SIA-CENCINAI</p>
          <p className="marca-sub">Atención Interdisciplinaria</p>
        </div>
        <nav className="navegacion" aria-label="Principal">
          <GrupoNav id="nav-trabajo" titulo="Trabajo">
            <BotonNav
              activa={VistaActiva(vista, 'inicio')}
              alActivar={() => Navegar('inicio')}
            >
              Inicio
            </BotonNav>
          </GrupoNav>
          {puedePersonas ? (
            <GrupoNav id="nav-personas" titulo="Personas y referencias">
              {contexto.puedeBuscarPersonas ? (
                <BotonNav
                  activa={VistaActiva(vista, 'buscar')}
                  alActivar={() => Navegar('buscar')}
                >
                  Buscar persona
                </BotonNav>
              ) : null}
              {contexto.puedeCrearReferencia ? (
                <BotonNav
                  activa={VistaActiva(vista, 'referencia-nueva')}
                  alActivar={() => Navegar('referencia-nueva')}
                >
                  Nueva referencia
                </BotonNav>
              ) : null}
              {contexto.puedeConsultarReferencias ? (
                <BotonNav
                  activa={VistaActiva(vista, 'referencias')}
                  alActivar={() => Navegar('referencias')}
                >
                  Referencias
                </BotonNav>
              ) : null}
              {contexto.puedeConsultarPosibles ? (
                <BotonNav
                  activa={VistaActiva(vista, 'posibles')}
                  alActivar={() => Navegar('posibles')}
                >
                  Posibles referencias
                </BotonNav>
              ) : null}
              {contexto.puedeGestionarSesiones ? (
                <BotonNav
                  activa={VistaActiva(vista, 'bandeja')}
                  alActivar={() => Navegar('bandeja')}
                >
                  Pendientes
                </BotonNav>
              ) : null}
            </GrupoNav>
          ) : null}
          {puedeAtencion ? (
            <GrupoNav id="nav-atencion" titulo="Atención">
              {contexto.puedeGestionarSesiones ? (
                <BotonNav
                  activa={VistaActiva(vista, 'sesiones')}
                  alActivar={() => Navegar('sesiones')}
                >
                  Sesiones
                </BotonNav>
              ) : null}
              {puedeCasos ? (
                <BotonNav
                  activa={VistaActiva(vista, 'casos')}
                  alActivar={() => Navegar('casos')}
                >
                  Casos
                </BotonNav>
              ) : null}
              {contexto.puedeRegistrarAtencion ? (
                <BotonNav
                  activa={VistaActiva(vista, 'atenciones')}
                  alActivar={() => Navegar('atenciones')}
                >
                  Atenciones
                </BotonNav>
              ) : null}
              {contexto.puedeConsultarSeguimiento ? (
                <BotonNav
                  activa={VistaActiva(vista, 'seguimiento')}
                  alActivar={() => Navegar('seguimiento')}
                >
                  Sin atención
                </BotonNav>
              ) : null}
              {contexto.puedeConsultarProgramacion ? (
                <BotonNav
                  activa={VistaActiva(vista, 'programacion')}
                  alActivar={() => Navegar('programacion')}
                >
                  Programación
                </BotonNav>
              ) : null}
            </GrupoNav>
          ) : null}
          {contexto.puedeConsultarReporteria ? (
            <GrupoNav id="nav-analisis" titulo="Análisis">
              <BotonNav
                activa={VistaActiva(vista, 'reporteria')}
                alActivar={() => Navegar('reporteria')}
              >
                Reportería
              </BotonNav>
            </GrupoNav>
          ) : null}
          <GrupoNav id="nav-sistema" titulo="Sistema">
            <BotonNav
              activa={VistaActiva(vista, 'tecnico')}
              alActivar={() => Navegar('tecnico')}
              secundario
            >
              Estado técnico
            </BotonNav>
          </GrupoNav>
        </nav>
      </aside>
      <div className="columna-trabajo">
        <header className="barra-contexto">
          <p className="ambito">{etiquetaNivel}</p>
          <p className="identidad-sesion">
            {identidadVisible ? identidadVisible.etiqueta : 'Identidad de desarrollo'}
          </p>
          <button
            type="button"
            className="secundario"
            onClick={() => { establecerContexto(null); establecerIdentidad(''); }}
          >
            Salir
          </button>
        </header>
        <main id="contenido">
        {vista.nombre === 'inicio' ? <InicioOperativo {...propiedades} /> : null}
        {vista.nombre === 'buscar' ? <BusquedaContextual {...propiedades} /> : null}
        {vista.nombre === 'referencia-nueva' ? (
          <FormularioReferencia
            direccionApi={direccionApi}
            identidad={identidad}
            personIdInicial={vista.parametros.personId || ''}
            posibleIdInicial={vista.parametros.posibleId || null}
            solicitarApi={solicitarApi}
          />
        ) : null}
        {vista.nombre === 'referencias' ? <ListaReferencias {...propiedades} /> : null}
        {vista.nombre === 'posibles' ? <PosiblesReferenciasPagina {...propiedades} /> : null}
        {vista.nombre === 'bandeja' ? <ListaReferencias {...propiedades} soloPendientes /> : null}
        {vista.nombre === 'sesiones' ? <SesionesPagina {...propiedades} /> : null}
        {vista.nombre === 'sesion' ? <SesionesPagina {...propiedades} /> : null}
        {vista.nombre === 'casos' ? <CasosPagina {...propiedades} /> : null}
        {vista.nombre === 'atenciones' ? <AtencionesPagina {...propiedades} /> : null}
        {vista.nombre === 'seguimiento' ? <SeguimientoPagina {...propiedades} /> : null}
        {vista.nombre === 'programacion' ? <ProgramacionPagina {...propiedades} /> : null}
        {vista.nombre === 'reporteria' ? (
          <Suspense fallback={<Cargando texto="Cargando reportería." />}>
            <ReporteriaPagina {...propiedades} />
          </Suspense>
        ) : null}
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
    </div>
  );
}

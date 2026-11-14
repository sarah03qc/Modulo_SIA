'use strict';

const {
  ErrorUbicacionInstitucionalAmbigua,
  ErrorConflicto,
  ErrorProhibido,
  ErrorInfraestructura,
  ErrorNoEncontrado,
  ErrorValidacion
} = require('../../common/errors');
const { CAPABILITY } = require('../../infrastructure/auth/capabilities');
const { ExigirCapacidad } = require('../../infrastructure/auth/authorization-policy');
const { GenerarLibroPlantilla, LeerLibroPlantilla } = require('./reference-template');
const { ResolverAmbitoTerritorial } = require('../institutional/territorial-scope');
const {
  ACTIVE_CASE_MESSAGE,
  CAPTURE_ORIGIN,
  CATEGORY_LABEL,
  DUPLICATE_CONSECUTIVE_MESSAGE,
  MAX_DRAFT_JSON_LENGTH,
  NAME_MATCH_LIMIT,
  PERSON_NOT_IN_SCOPE_MESSAGE,
  REFERENCE_NOT_FOUND_MESSAGE,
  REFERENCE_STATUS,
  RESPONSIBLE_LOCKED_MESSAGE,
  STATUS_LABEL,
  TEMPLATE_VERSION
} = require('./reference-constants');
const {
  AfirmarConsecutivoDePersona,
  CanonizarConsecutivo,
  CategoriaDeMotivo,
  NarrarTexto,
  NormalizarMotivos,
  ExigirFechaReferencia
} = require('./reference-rules');
const { ConstruirContextoHistorico, NombreCompleto } = require('./reference-snapshot');
const { GenerarDocumentoReferencia } = require('./reference-document');

const PERMISSION_MESSAGE = 'La operación de referencias no está disponible para la cuenta técnica actual.';
const MAX_ATTEMPTS = 3;

/**
 * Adapta el puerto territorial que ya usa la consulta de personas.
 *
 * @param {object} adapter Adaptador institucional.
 * @returns {object} Búsquedas de establecimiento, oficina y región.
 */
function PuertoTerritorial(adapter) {
  return {
    BuscarEstablecimiento: (establishmentId) => adapter.BuscarEstablecimiento(establishmentId),
    BuscarOficinaLocal: (localOfficeId) => adapter.BuscarOficinaLocal(localOfficeId),
    BuscarRegion: (regionId) => adapter.BuscarRegion(regionId)
  };
}

/**
 * Formatea la marca de tiempo del motor como UTC, sin cambiar el instante.
 *
 * @param {string} value Texto `AAAA-MM-DD HH:MM:SS` del servidor.
 * @returns {string|null} Instantáneo con sufijo Z, o null.
 */
function MarcaTiempoServidor(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }
  return `${value.trim().replace(' ', 'T')}Z`;
}

/**
 * Traduce un fallo de persistencia al error HTTP correspondiente.
 * El caso activo y el consecutivo duplicado no revelan el expediente ni proponen otro número.
 *
 * @param {Error} error Error de dominio o de infraestructura.
 * @returns {never}
 * @throws {ErrorConflicto|ErrorValidacion|ErrorInfraestructura|ErrorNoEncontrado} Error visible.
 */
function RelanzarErrorPersistencia(error) {
  if (error && error.code === 'ACTIVE_CASE') {
    throw new ErrorConflicto(ACTIVE_CASE_MESSAGE);
  }
  if (error && error.code === 'DUPLICATE_CONSECUTIVE') {
    throw new ErrorConflicto(DUPLICATE_CONSECUTIVE_MESSAGE);
  }
  if (error && error.code === 'CONSTRAINT') {
    throw new ErrorValidacion('Los datos de catálogo o de la persona ya no permiten registrar la referencia.');
  }
  if (error && error.code === 'PERMISSION') {
    throw new ErrorInfraestructura(PERMISSION_MESSAGE);
  }
  if (error && error.code === 'DRAFT_MISMATCH') {
    throw new ErrorValidacion('El borrador indicado no corresponde a la persona de esta referencia.');
  }
  if (error && error.code === 'DRAFT_NOT_FOUND') {
    throw new ErrorNoEncontrado('El borrador solicitado no existe.');
  }
  if (error instanceof ErrorValidacion || error instanceof ErrorConflicto || error instanceof ErrorNoEncontrado) {
    throw error;
  }
  if (error instanceof ErrorInfraestructura) {
    throw error;
  }
  throw new ErrorInfraestructura('La dependencia de base de datos no está disponible.');
}

/**
 * Arma el texto de ámbito que viaja a auditoría, sin narrativa clínica.
 *
 * @param {object} context Contexto histórico.
 * @param {string} identitySource Origen de la identidad del servidor.
 * @returns {string} Ámbito y marca de identidad.
 */
function TextoDeAmbito(context, identitySource) {
  const source = identitySource === 'SYNTHETIC_DEVELOPMENT' ? 'SINTETICA' : 'SESION';
  return `E:${context.establishmentId}|OL:${context.localOfficeId}|R:${context.regionId}|ID:${source}`.slice(0, 200);
}

/**
 * Servicio de referencias. Reutiliza el ámbito y la persona del Lote 01.
 * El envío manual y el de plantilla terminan en el mismo registro transaccional.
 *
 * @param {object} dependencies Periodo, adaptador y repositorio.
 * @returns {object} Operaciones de catálogo, envío, consulta, plantilla y documento.
 */
function CrearServicioReferencias(dependencies) {
  const periodId = dependencies.periodId;
  const adapter = dependencies.adapter;
  const repository = dependencies.repository;
  const territory = PuertoTerritorial(adapter);

  /**
   * Resuelve el ámbito efectivo. Un filtro de establecimiento solo puede estrecharlo.
   *
   * @param {object} acceso Contexto interno.
   * @param {object} filters Filtros territoriales ya validados.
   * @returns {Promise<object>} Ámbito de la operación.
   */
  async function ResolverAmbito(acceso, filters) {
    return ResolverAmbitoTerritorial(acceso, {
      regionId: filters.regionId ?? null,
      localOfficeId: filters.localOfficeId ?? null,
      establishmentId: filters.establishmentId ?? null
    }, territory);
  }

  /**
   * Exige una identidad de servidor utilizable como responsable.
   *
   * @param {object} acceso Contexto interno.
   * @returns {string} Identificador del responsable.
   * @throws {ErrorProhibido} Cuando la sesión no trae identidad.
   */
  function ExigirResponsable(acceso) {
    if (!acceso || typeof acceso.principalId !== 'string' || acceso.principalId.length === 0 || acceso.principalId.length > 128) {
      throw new ErrorProhibido('La identidad de la sesión no puede usarse como responsable.');
    }
    return acceso.principalId;
  }

  /**
   * Impide sustituir al responsable por un valor del cliente o de la plantilla.
   *
   * @param {object} solicitud DTO de entrada.
   * @param {string} responsible Identidad de la sesión.
   * @returns {void}
   * @throws {ErrorValidacion} Cuando el valor enviado no es el de la sesión.
   */
  function AfirmarResponsableFijo(solicitud, responsible) {
    if (solicitud.responsibleProvided && solicitud.responsible !== responsible) {
      throw new ErrorValidacion(RESPONSIBLE_LOCKED_MESSAGE);
    }
  }

  /**
   * Carga el catálogo vigente y lo separa por tipo.
   *
   * @returns {Promise<object>} Vías, orígenes y motivos indexados.
   */
  async function CargarCatalogo() {
    let rows;
    try {
      rows = await repository.ListarCatalogo();
    } catch (error) {
      RelanzarErrorPersistencia(error);
    }
    const routes = new Map();
    const origins = new Map();
    const motives = new Map();
    for (const row of rows) {
      const item = {
        itemId: Number(row.cat_item_id),
        code: row.codigo,
        label: row.etiqueta,
        order: Number(row.orden)
      };
      if (row.codigo_catalogo === 'VIA_ATENCION') {
        routes.set(item.code, item);
      } else if (row.codigo_catalogo === 'ORIGEN_REFERENCIA') {
        origins.set(item.code, item);
      } else if (row.codigo_catalogo === 'MOTIVO_REFERENCIA') {
        motives.set(item.code, item);
      }
    }
    return { routes, origins, motives };
  }

  /**
   * Localiza a la persona dentro del ámbito y arma el contexto histórico.
   * Una ubicación ambigua no se resuelve en silencio.
   *
   * @param {object} scope Ámbito autorizado.
   * @param {string} personId Identificador.
   * @param {string} referenceDate Fecha de la referencia.
   * @returns {Promise<object>} Contexto histórico y fila de origen.
   * @throws {ErrorNoEncontrado|ErrorUbicacionInstitucionalAmbigua} Cuando no hay una ubicación utilizable.
   */
  async function CargarContextoPersona(scope, personId, referenceDate) {
    const rows = await adapter.BuscarPersonaEnAmbito({
      periodId,
      personId,
      scope
    });
    const locationCounts = rows.map((row) => Number(row.location_count));
    if (rows.length > 1 || locationCounts.some((count) => count > 1)) {
      throw new ErrorUbicacionInstitucionalAmbigua();
    }
    if (rows.length === 0) {
      throw new ErrorNoEncontrado(PERSON_NOT_IN_SCOPE_MESSAGE);
    }
    const [services, guardianRows] = await Promise.all([
      adapter.ListarServicios({ periodId, personId }),
      adapter.ListarFilasEncargado({ periodId, personId })
    ]);
    return ConstruirContextoHistorico({
      person: rows[0],
      services,
      guardianRows,
      referenceDate
    });
  }

  /**
   * Prepara la referencia sin escribirla. La usa la validación y el envío.
   *
   * @param {object} acceso Contexto interno.
   * @param {object} solicitud DTO validado.
   * @param {object} catalog Catálogo vigente.
   * @returns {Promise<object>} Referencia lista para revisar o confirmar.
   */
  async function PrepararReferencia(acceso, solicitud, catalog) {
    const responsible = ExigirResponsable(acceso);
    AfirmarResponsableFijo(solicitud, responsible);
    const referenceDate = ExigirFechaReferencia(solicitud.referenceDate);
    const consecutive = CanonizarConsecutivo(solicitud.consecutive);
    const scope = await ResolverAmbito(acceso, {});
    const context = await CargarContextoPersona(scope, solicitud.personId, referenceDate);
    AfirmarConsecutivoDePersona(consecutive, context.establishmentId);
    const route = catalog.routes.get(solicitud.attentionRouteCode);
    const origin = catalog.origins.get(solicitud.originCode);
    if (!route) {
      throw new ErrorValidacion('La Vía de Atención no corresponde al catálogo vigente.');
    }
    if (!origin) {
      throw new ErrorValidacion('El origen no corresponde al catálogo vigente.');
    }
    if (solicitud.captureOrigin === CAPTURE_ORIGIN.TEMPLATE && solicitud.templateVersion !== TEMPLATE_VERSION) {
      throw new ErrorValidacion('La versión de la plantilla no es compatible.');
    }
    const motives = NormalizarMotivos(solicitud.motives, catalog.motives);
    let activeCase = false;
    try {
      activeCase = await repository.PersonaTieneCasoActivo(solicitud.personId);
    } catch (error) {
      RelanzarErrorPersistencia(error);
    }
    return {
      personId: solicitud.personId,
      referenceDate,
      consecutive,
      attentionRoute: route,
      origin,
      motives,
      previousActions: NarrarTexto(solicitud.previousActions, 'acciones previas'),
      previousResults: NarrarTexto(solicitud.previousResults, 'resultados previos'),
      complementaryInformation: NarrarTexto(solicitud.complementaryInformation, 'información complementaria'),
      captureOrigin: solicitud.captureOrigin,
      templateVersion: solicitud.captureOrigin === CAPTURE_ORIGIN.TEMPLATE ? solicitud.templateVersion : null,
      draftId: solicitud.draftId || null,
      responsible,
      auditRole: acceso.accessLevel,
      identitySource: acceso.identitySource,
      scope,
      context,
      activeCase
    };
  }

  /**
   * Arma la revisión que el cliente puede mostrar antes del envío.
   * Incluye las etapas como contrato de datos. No describe una pantalla.
   *
   * @param {object} prepared Referencia preparada.
   * @returns {object} Revisión de solo lectura.
   */
  function PresentarRevision(prepared) {
    return {
      person: {
        personId: prepared.personId,
        fullName: prepared.context.currentName || null,
        birthDate: prepared.context.birthDate,
        ageYears: prepared.context.ageYears,
        sex: prepared.context.currentSex,
        nameSource: 'CURRENT_INSTITUTIONAL',
        sexSource: 'CURRENT_INSTITUTIONAL'
      },
      territory: {
        region: { id: prepared.context.regionId, name: prepared.context.regionName },
        localOffice: { id: prepared.context.localOfficeId, name: prepared.context.localOfficeName },
        establishment: { id: prepared.context.establishmentId, name: prepared.context.establishmentName }
      },
      services: prepared.context.servicesText,
      guardian: {
        name: prepared.context.guardianName,
        relationship: prepared.context.RelacionEncargado,
        relationshipStatus: prepared.context.guardianRelationshipStatus
      },
      contact: prepared.context.contact,
      address: prepared.context.address,
      responsible: {
        principalId: prepared.responsible,
        editable: false
      },
      referenceDate: prepared.referenceDate,
      attentionRoute: prepared.attentionRoute,
      origin: prepared.origin,
      consecutive: prepared.consecutive,
      motives: prepared.motives.map((motive) => ({
        code: motive.code,
        label: motive.label,
        category: motive.category,
        specification: motive.specification
      })),
      previousActions: prepared.previousActions,
      previousResults: prepared.previousResults,
      complementaryInformation: prepared.complementaryInformation
    };
  }

  /**
   * Describe qué grupos de datos ya están completos.
   *
   * @param {object|null} prepared Preparación, o null si todavía no cierra.
   * @returns {object[]} Etapas de datos.
   */
  function EtapasDePreparacion(prepared) {
    const ready = Boolean(prepared);
    return [
      { code: 'PERSON', complete: ready },
      { code: 'REFERENCE_DATA', complete: ready },
      { code: 'MOTIVES', complete: ready },
      { code: 'NARRATIVE', complete: ready },
      { code: 'CONSECUTIVE', complete: ready },
      { code: 'REVIEW', complete: ready && !prepared.activeCase }
    ];
  }

  /**
   * Entrega el libro de la plantilla compatible.
   * No incluye datos de una persona ni reserva un consecutivo.
   * Requisito: HU-014.
   */
  async function DescargarPlantilla(acceso) {
    ExigirCapacidad(acceso, CAPABILITY.REFERRAL_IMPORT);
    return {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileName: 'referencia-plantilla.xlsx',
      body: await GenerarLibroPlantilla()
    };
  }

  /**
   * Lee la plantilla y devuelve la precarga para revisión.
   * No envía la referencia ni reserva el consecutivo.
   * Si la validación de negocio falla, el archivo no queda registrado
   * y se devuelven los problemas encontrados.
   */
  async function PrecargarPlantilla(acceso, buffer) {
    ExigirCapacidad(acceso, CAPABILITY.REFERRAL_IMPORT);
    const parsed = await LeerLibroPlantilla(buffer);
    const solicitud = {
      ...parsed.referral,
      responsibleProvided: false,
      responsible: null,
      draftId: null
    };
    let validation = null;
    try {
      validation = await ValidarReferencia(acceso, solicitud);
    } catch (error) {
      if (error && error.expose === true) {
        return {
          status: 'PRELOAD',
          submitted: false,
          consecutiveReserved: false,
          reviewRequired: true,
          templateVersion: parsed.templateVersion,
          referral: parsed.referral,
          validation: null,
          issues: [{ code: error.code, message: error.message }]
        };
      }
      throw error;
    }
    return {
      status: 'PRELOAD',
      submitted: false,
      consecutiveReserved: false,
      reviewRequired: true,
      templateVersion: parsed.templateVersion,
      referral: parsed.referral,
      validation,
      issues: validation.activeCaseBlocked
        ? [{ code: 'CONFLICT', message: validation.message }]
        : []
    };
  }

  /**
   * Publica el catálogo vigente de vías, orígenes y motivos.
   * Los factores de riesgo no están confirmados: se informan vacíos, sin inventar códigos.
   */
  async function ListarCatalogos(acceso) {
    ExigirCapacidad(acceso, CAPABILITY.REFERRAL_CREATE);
    const catalog = await CargarCatalogo();
    const motives = [...catalog.motives.values()].map((item) => ({
      ...item,
      category: CategoriaDeMotivo(item.code),
      categoryLabel: CATEGORY_LABEL[CategoriaDeMotivo(item.code)]
    }));
    return {
      attentionRoutes: [...catalog.routes.values()],
      origins: [...catalog.origins.values()],
      motives,
      riskFactors: {
        status: 'NEEDS_VALIDATION',
        items: [],
        message: 'El catálogo vigente no incluye motivos de factor de riesgo por ámbito individual, hogar-familiar y comunitario.'
      }
    };
  }

  /**
   * Valida la referencia y devuelve la revisión. No reserva consecutivo ni envía.
   *
   * @param {object} acceso Contexto interno.
   * @param {object} solicitud DTO.
   * @returns {Promise<object>} Resultado de validación.
   */
  async function ValidarReferencia(acceso, solicitud) {
    ExigirCapacidad(acceso, CAPABILITY.REFERRAL_CREATE);
    const catalog = await CargarCatalogo();
    const prepared = await PrepararReferencia(acceso, solicitud, catalog);
    return {
      valid: !prepared.activeCase,
      submitted: false,
      consecutiveReserved: false,
      activeCaseBlocked: prepared.activeCase,
      message: prepared.activeCase ? ACTIVE_CASE_MESSAGE : null,
      stages: EtapasDePreparacion(prepared),
      review: PresentarRevision(prepared)
    };
  }

  /**
   * Confirma el envío en la transacción común. Reintenta solo un interbloqueo.
   *
   * Requisitos: HU-013 y HU-014 CA-07 y CA-08.
   *
   * @param {object} acceso Contexto interno.
   * @param {object} solicitud DTO.
   * @returns {Promise<object>} Referencia enviada y comprobante.
   * @throws {ErrorConflicto} Cuando hay caso activo o consecutivo duplicado.
   */
  async function EnviarReferencia(acceso, solicitud) {
    ExigirCapacidad(acceso, CAPABILITY.REFERRAL_CREATE);
    const catalog = await CargarCatalogo();
    const prepared = await PrepararReferencia(acceso, solicitud, catalog);
    if (prepared.activeCase) {
      throw new ErrorConflicto(ACTIVE_CASE_MESSAGE);
    }
    const record = {
      ...prepared,
      TextoDeAmbito: TextoDeAmbito(prepared.context, prepared.identitySource)
    };
    let attempt = 0;
    let saved = null;
    while (attempt < MAX_ATTEMPTS) {
      try {
        saved = await repository.InsertarEnviada(record);
        break;
      } catch (error) {
        attempt += 1;
        if (error && error.code === 'DEADLOCK' && attempt < MAX_ATTEMPTS) {
          continue;
        }
        RelanzarErrorPersistencia(error);
      }
    }
    return {
      referenceId: saved.referenceId,
      status: REFERENCE_STATUS.PENDING_REVIEW,
      statusLabel: STATUS_LABEL.PENDIENTE_REVISION,
      consecutive: prepared.consecutive,
      sentAt: MarcaTiempoServidor(saved.sentAt),
      responsible: prepared.responsible,
      submitted: true,
      review: PresentarRevision(prepared)
    };
  }

  /**
   * Busca identificadores institucionales por nombre, dentro del ámbito.
   * Si el criterio es demasiado amplio, pide precisión en lugar de traer todas las referencias.
   *
   * @param {object} scope Ámbito.
   * @param {string} name Texto de nombre.
   * @returns {Promise<string[]>} Identificadores coincidentes.
   */
  async function IdentificadoresPorNombre(scope, name) {
    const result = await adapter.BuscarPersonas({
      mode: 'name',
      periodId,
      text: name,
      scope,
      offset: 0,
      pageSize: NAME_MATCH_LIMIT
    });
    if (result.total > NAME_MATCH_LIMIT) {
      throw new ErrorValidacion('La búsqueda por nombre es demasiado amplia. Precise el criterio.');
    }
    return result.items.map((row) => row.person_id);
  }

  /**
   * Completa el nombre visible de la página con la réplica actual.
   * Si la persona ya no está en el ámbito, conserva la identificación y deja el nombre vacío.
   *
   * @param {object} scope Ámbito.
   * @param {object[]} items Filas del listado.
   * @returns {Promise<Map<string, object>>} Nombre y sexo actuales por identificador.
   */
  async function IdentidadesVigentes(scope, items) {
    const identities = new Map();
    const personIds = [...new Set(items.map((item) => item.per_id_persona))];
    await Promise.all(personIds.map(async (personId) => {
      const rows = await adapter.BuscarPersonaEnAmbito({ periodId, personId, scope });
      if (rows.length === 1 && Number(rows[0].location_count) === 1) {
        identities.set(personId, {
          fullName: NombreCompleto(rows[0]),
          sex: rows[0].sex_name || null
        });
      }
    }));
    return identities;
  }

  /**
   * Lista las referencias del ámbito con filtros aplicados en SQL.
   *
   * Requisitos: HU-015 y la consulta de Oficina Local de CU-06.
   *
   * @param {object} acceso Contexto interno.
   * @param {object} criteria Filtros de consulta.
   * @returns {Promise<object>} Página y conteo.
   */
  async function ListarReferencias(acceso, criteria) {
    ExigirCapacidad(acceso, CAPABILITY.REFERRAL_READ);
    if (criteria.categoryHasNoConfirmedCodes) {
      return {
        query: PresentarConsulta(criteria),
        result: {
          total: 0,
          returned: 0,
          items: []
        }
      };
    }
    const scope = await ResolverAmbito(acceso, { establishmentId: criteria.establishmentId });
    let personIds;
    if (criteria.name) {
      personIds = await IdentificadoresPorNombre(scope, criteria.name);
      if (personIds.length === 0) {
        return PaginaVacia(criteria);
      }
    }
    let page;
    try {
      page = await repository.ListarReferencias({
        ...criteria,
        scope,
        personIds
      });
    } catch (error) {
      RelanzarErrorPersistencia(error);
    }
    const identities = await IdentidadesVigentes(scope, page.items);
    return {
      query: PresentarConsulta(criteria),
      result: {
        total: page.total,
        returned: page.items.length,
        items: page.items.map((item) => {
          const identidad = identities.get(item.per_id_persona);
          return {
            referenceId: Number(item.referencia_id),
            consecutive: item.consecutivo,
            person: {
              personId: item.per_id_persona,
              fullName: identidad ? identidad.fullName : null,
              nameSource: identidad ? 'CURRENT_INSTITUTIONAL' : 'UNAVAILABLE'
            },
            establishment: {
              id: Number(item.establecimiento_id),
              name: item.establecimiento_nombre
            },
            responsible: item.responsable_usuario,
            sentAt: MarcaTiempoServidor(item.enviada_en),
            status: item.estado,
            statusLabel: STATUS_LABEL[item.estado] || item.estado,
            attentionRoute: {
              code: item.via_codigo,
              label: item.via_etiqueta
            }
          };
        })
      }
    };
  }

  /**
   * Copia los filtros públicos de la consulta.
   *
   * @param {object} criteria Criterios de entrada.
   * @returns {object} Eco de la consulta.
   */
  function PresentarConsulta(criteria) {
    return {
      page: criteria.page,
      pageSize: criteria.pageSize,
      name: criteria.name,
      identification: criteria.identification,
      consecutive: criteria.consecutive,
      status: criteria.status,
      attentionRoute: criteria.attentionRoute,
      origin: criteria.origin,
      category: criteria.category,
      establishmentId: criteria.establishmentId
    };
  }

  /**
   * Devuelve una página vacía cuando el nombre no tiene coincidencias en el ámbito.
   *
   * @param {object} criteria Criterios de entrada.
   * @returns {object} Página sin filas.
   */
  function PaginaVacia(criteria) {
    return {
      query: PresentarConsulta(criteria),
      result: { total: 0, returned: 0, items: [] }
    };
  }

  /**
   * Arma el detalle desde lo guardado. El nombre y el sexo actuales se marcan como lectura vigente.
   *
   * @param {object} header Fila histórica.
   * @param {object[]} motives Motivos guardados.
   * @param {object|null} identidad Lectura institucional actual, si sigue en el ámbito.
   * @returns {object} Detalle autorizado.
   */
  function PresentarDetalle(header, motives, identidad) {
    return {
      referenceId: Number(header.referencia_id),
      consecutive: header.consecutivo,
      referenceDate: String(header.fecha_referencia).slice(0, 10),
      sentAt: MarcaTiempoServidor(header.enviada_en),
      status: header.estado,
      statusLabel: STATUS_LABEL[header.estado] || header.estado,
      attentionRoute: { code: header.via_codigo, label: header.via_etiqueta },
      origin: { code: header.origen_codigo, label: header.origen_etiqueta },
      person: {
        personId: header.per_id_persona,
        fullName: identidad ? identidad.fullName : null,
        sex: identidad ? identidad.sex : null,
        nameSource: identidad ? 'CURRENT_INSTITUTIONAL' : 'UNAVAILABLE',
        sexSource: identidad ? 'CURRENT_INSTITUTIONAL' : 'UNAVAILABLE'
      },
      historicalContext: {
        birthDate: header.fecha_nacimiento_informada,
        ageYears: header.edad_anios === null || header.edad_anios === undefined ? null : Number(header.edad_anios),
        servicesText: header.servicios_texto,
        regionName: header.region_nombre,
        localOfficeName: header.oficina_local_nombre,
        establishmentName: header.establecimiento_nombre,
        establishmentId: Number(header.establecimiento_id),
        localOfficeId: Number(header.oficina_local_id),
        regionId: Number(header.region_id),
        guardianName: header.encargado_nombre,
        RelacionEncargado: header.relacion_encargado,
        contact: header.contacto,
        address: header.direccion
      },
      motives: motives.map((motive) => ({
        code: motive.codigo,
        label: motive.etiqueta,
        category: CategoriaDeMotivo(motive.codigo),
        specification: motive.especificacion
      })),
      previousActions: header.acciones_previas,
      previousResults: header.resultados_previos,
      complementaryInformation: header.informacion_complementaria,
      responsible: header.responsable_usuario,
      sentBy: header.enviada_por,
      captureOrigin: header.origen_captura,
      templateVersion: header.plantilla_version
    };
  }

  /**
   * Consulta el detalle si la referencia pertenece al ámbito. Si no, responde como inexistente.
   *
   * Requisitos: HU-016 y RF-033.
   *
   * @param {object} acceso Contexto interno.
   * @param {number} referenceId Identificador técnico.
   * @returns {Promise<object>} Detalle.
   * @throws {ErrorNoEncontrado} Cuando no está en el ámbito o no existe.
   */
  async function ObtenerReferencia(acceso, referenceId) {
    ExigirCapacidad(acceso, CAPABILITY.REFERRAL_READ_DETAIL);
    const scope = await ResolverAmbito(acceso, {});
    let header;
    let motives;
    try {
      header = await repository.BuscarReferencia(referenceId, scope);
      motives = header ? await repository.ListarMotivos(referenceId, scope) : [];
    } catch (error) {
      RelanzarErrorPersistencia(error);
    }
    if (!header) {
      throw new ErrorNoEncontrado(REFERENCE_NOT_FOUND_MESSAGE);
    }
    const identities = await IdentidadesVigentes(scope, [header]);
    return PresentarDetalle(header, motives, identities.get(header.per_id_persona) || null);
  }

  /**
   * Genera el documento y registra la impresión sin cambiar la referencia.
   *
   * Requisitos: HU-017 CA-08 y CA-09; RF-035.
   *
   * @param {object} acceso Contexto interno.
   * @param {number} referenceId Identificador técnico.
   * @returns {Promise<{contentType: string, fileName: string, body: string, generatedAt: string}>} Documento.
   */
  async function ImprimirReferencia(acceso, referenceId) {
    ExigirCapacidad(acceso, CAPABILITY.REFERRAL_PRINT);
    const detail = await ObtenerReferencia(acceso, referenceId);
    const responsible = ExigirResponsable(acceso);
    let printed;
    try {
      printed = await repository.RegistrarImpresion({
        referenceId,
        responsible,
        auditRole: acceso.accessLevel,
        TextoDeAmbito: TextoDeAmbito(detail.historicalContext, acceso.identitySource)
      });
    } catch (error) {
      RelanzarErrorPersistencia(error);
    }
    const generatedAt = MarcaTiempoServidor(printed.generatedAt);
    const after = await ObtenerReferencia(acceso, referenceId);
    if (after.sentAt !== detail.sentAt || after.consecutive !== detail.consecutive) {
      throw new ErrorInfraestructura('La generación documental no pudo conservar el comprobante de envío.');
    }
    return {
      contentType: 'text/html; charset=utf-8',
      fileName: `referencia-${detail.referenceId}.html`,
      generatedAt,
      sentAt: detail.sentAt,
      body: GenerarDocumentoReferencia(detail, generatedAt)
    };
  }

  /**
   * Quita del borrador cualquier responsable, estado o comprobante que el cliente haya incluido.
   *
   * @param {object} content Contenido recibido.
   * @returns {object} Contenido de captura, sin datos de envío.
   */
  function ContenidoBorrador(content) {
    const copy = { ...content };
    for (const field of [
      'responsible',
      'responsable',
      'estado',
      'status',
      'enviada_en',
      'sentAt',
      'enviada_por',
      'creada_por'
    ]) {
      delete copy[field];
    }
    return copy;
  }

  /**
   * Guarda un borrador del autor. No queda pendiente de revisión ni tiene comprobante.
   *
   * Requisito: RF-098, limitado al autor. La visibilidad para otra persona de la misma oficina sigue NEEDS_VALIDATION.
   *
   * @param {object} acceso Contexto interno.
   * @param {object} solicitud Borrador.
   * @returns {Promise<object>} Borrador guardado.
   */
  async function GuardarBorrador(acceso, solicitud) {
    ExigirCapacidad(acceso, CAPABILITY.REFERRAL_CREATE);
    const responsible = ExigirResponsable(acceso);
    const content = ContenidoBorrador(solicitud.content);
    const serialized = JSON.stringify({
      kind: 'REFERENCE_DRAFT',
      submitted: false,
      content
    });
    if (serialized.length > MAX_DRAFT_JSON_LENGTH) {
      throw new ErrorValidacion('El borrador supera el tamaño permitido.');
    }
    const scope = await ResolverAmbito(acceso, {});
    const establishmentId = Array.isArray(scope.establishmentIds) && scope.establishmentIds.length === 1
      ? scope.establishmentIds[0]
      : null;
    try {
      const saved = await repository.GuardarBorrador({
        draftId: solicitud.draftId,
        personId: solicitud.personId,
        responsible,
        accessLevel: acceso.accessLevel,
        localOfficeId: scope.localOfficeId,
        establishmentId,
        content: serialized
      });
      return {
        draftId: saved.draftId,
        updatedAt: MarcaTiempoServidor(saved.updatedAt),
        submitted: false,
        status: null,
        sentAt: null,
        content
      };
    } catch (error) {
      RelanzarErrorPersistencia(error);
    }
  }

  /**
   * Recupera los borradores del autor.
   *
   * @param {object} acceso Contexto interno.
   * @returns {Promise<object>} Lista de borradores no enviados.
   */
  async function ListarBorradores(acceso) {
    ExigirCapacidad(acceso, CAPABILITY.REFERRAL_CREATE);
    const responsible = ExigirResponsable(acceso);
    let rows;
    try {
      rows = await repository.ListarBorradores(responsible);
    } catch (error) {
      RelanzarErrorPersistencia(error);
    }
    return {
      items: rows.map((row) => {
        let parsed = null;
        try {
          parsed = JSON.parse(row.contenido);
        } catch {
          parsed = null;
        }
        const content = parsed && parsed.kind === 'REFERENCE_DRAFT' ? parsed.content : null;
        return {
          draftId: Number(row.borrador_id),
          personId: row.clave_negocio,
          updatedAt: MarcaTiempoServidor(row.actualizado_en),
          submitted: false,
          status: null,
          sentAt: null,
          content
        };
      })
    };
  }

  /**
   * Elimina un borrador del autor.
   *
   * @param {object} acceso Contexto interno.
   * @param {number} draftId Identificador.
   * @returns {Promise<void>} Nada cuando la eliminación ocurrió.
   * @throws {ErrorNoEncontrado} Cuando el borrador no es del autor.
   */
  async function EliminarBorrador(acceso, draftId) {
    ExigirCapacidad(acceso, CAPABILITY.REFERRAL_CREATE);
    const responsible = ExigirResponsable(acceso);
    let removed = false;
    try {
      removed = await repository.EliminarBorrador(draftId, responsible);
    } catch (error) {
      RelanzarErrorPersistencia(error);
    }
    if (!removed) {
      throw new ErrorNoEncontrado('El borrador solicitado no existe.');
    }
  }

  return {
    ListarCatalogos,
    DescargarPlantilla,
    PrecargarPlantilla,
    ValidarReferencia,
    EnviarReferencia,
    ListarReferencias,
    ObtenerReferencia,
    ImprimirReferencia,
    GuardarBorrador,
    ListarBorradores,
    EliminarBorrador
  };
}

module.exports = {
  CrearServicioReferencias
};

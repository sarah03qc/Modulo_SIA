/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16. Modificación: 2026-11-16.
 * HU-038, HU-039, HU-040 a HU-043 y HU-050.
 * La capacidad se vuelve a exigir en el servicio.
 * El informe acepta un cuerpo JSON acotado al máximo validado.
 */
'use strict';

const express = require('express');
const { EnvolverAsincrono } = require('../../common/async-handler');
const { DescartarCuerpoNoProcesado } = require('../../common/http-error-handler');
const { ErrorProhibido } = require('../../common/errors');
const { CAPABILITY } = require('../../infrastructure/auth/capabilities');
const { ExigirCapacidad } = require('../../infrastructure/auth/authorization-policy');
const { ACCESS_LEVEL } = require('../../infrastructure/auth/institutional-roles');
const { AnioCalendarioLocal } = require('../../common/fecha-local');
const { LeerFiltrosReporteria } = require('./validacion-reporteria');

function EnviarInforme(res, archivo) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="informe-analitico-oficina-local.html"'
  );
  res.setHeader('X-Persistencia-Informe', archivo.persistencia);
  if (archivo.informeId) {
    res.setHeader('X-Informe-Id', String(archivo.informeId));
  }
  if (archivo.reintento || archivo.historico) {
    res.setHeader('X-Origen-Informe', 'INSTANTANEA');
  }
  res.status(200).send(archivo.contenido);
}

function ExigirOficina(capacidad) {
  return function Exigir(req, res, next) {
    try {
      ExigirCapacidad(req.acceso, capacidad);
      if (!req.acceso || req.acceso.accessLevel !== ACCESS_LEVEL.LOCAL_OFFICE) {
        throw new ErrorProhibido(
          'La reportería interna de Oficina Local no está permitida para este ámbito.'
        );
      }
      next();
    } catch (error) {
      DescartarCuerpoNoProcesado(req, () => next(error));
    }
  };
}

function Filtros(req) {
  const anio = AnioCalendarioLocal();
  return LeerFiltrosReporteria(req.query, anio);
}

function FiltrosAmbito(req) {
  return LeerFiltrosReporteria(req.query, AnioCalendarioLocal(), req.acceso.accessLevel);
}

function ExigirConsulta(capacidad) {
  return function Exigir(req, res, next) {
    try {
      ExigirCapacidad(req.acceso, capacidad);
      const nivel = req.acceso && req.acceso.accessLevel;
      if (nivel !== ACCESS_LEVEL.REGION && nivel !== ACCESS_LEVEL.NATIONAL) {
        throw new ErrorProhibido(
          'La reportería de este ámbito no está permitida para la sesión.'
        );
      }
      next();
    } catch (error) {
      DescartarCuerpoNoProcesado(req, () => next(error));
    }
  };
}

function NombreConsolidacion(nivel) {
  if (nivel === ACCESS_LEVEL.NATIONAL) {
    return 'consolidacion-nacional.xlsx';
  }
  return 'consolidacion-region.xlsx';
}

/**
 * Publica la reportería de Oficina Local.
 *
 * @param {object} servicio Servicio ya construido.
 * @returns {express.Router} Rutas de `/api/reporteria`.
 */
function CrearEnrutadorReporteria(servicio) {
  const router = express.Router();
  const json = express.json({ limit: '128kb' });

  router.get(
    '/oficina',
    ExigirOficina(CAPABILITY.REPORTING_READ),
    EnvolverAsincrono(async (req, res) => {
      res.status(200).json(await servicio.ConsultarOficina(req.acceso, Filtros(req)));
    })
  );

  router.post(
    '/oficina/informe',
    ExigirOficina(CAPABILITY.REPORTING_EXPORT),
    json,
    EnvolverAsincrono(async (req, res) => {
      const archivo = await servicio.GenerarInforme(req.acceso, Filtros(req), req.body);
      EnviarInforme(res, archivo);
    })
  );

  router.get(
    '/oficina/informe/:informeId',
    ExigirOficina(CAPABILITY.REPORTING_READ),
    EnvolverAsincrono(async (req, res) => {
      const archivo = await servicio.ConsultarInformeHistorico(
        req.acceso,
        req.params.informeId
      );
      EnviarInforme(res, archivo);
    })
  );

  router.get(
    '/oficina/consolidacion',
    ExigirOficina(CAPABILITY.REPORTING_EXPORT),
    EnvolverAsincrono(async (req, res) => {
      const archivo = await servicio.DescargarConsolidacion(req.acceso, Filtros(req));
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="consolidacion-oficina-local.xlsx"'
      );
      res.status(200).send(archivo);
    })
  );

  router.get(
    '/consulta',
    ExigirConsulta(CAPABILITY.REPORTING_READ),
    EnvolverAsincrono(async (req, res) => {
      res.status(200).json(await servicio.ConsultarAmbito(req.acceso, FiltrosAmbito(req)));
    })
  );

  router.get(
    '/consulta/consolidacion',
    ExigirConsulta(CAPABILITY.REPORTING_EXPORT),
    EnvolverAsincrono(async (req, res) => {
      const archivo = await servicio.DescargarConsolidacionAmbito(
        req.acceso,
        FiltrosAmbito(req)
      );
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${NombreConsolidacion(req.acceso.accessLevel)}"`
      );
      res.status(200).send(archivo);
    })
  );

  return router;
}

module.exports = { CrearEnrutadorReporteria };

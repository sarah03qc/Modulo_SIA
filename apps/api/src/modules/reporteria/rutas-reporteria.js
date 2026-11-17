/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * HU-038 y HU-039. La capacidad se vuelve a exigir en el servicio.
 */
'use strict';

const express = require('express');
const { EnvolverAsincrono } = require('../../common/async-handler');
const { DescartarCuerpoNoProcesado } = require('../../common/http-error-handler');
const { ErrorProhibido } = require('../../common/errors');
const { CAPABILITY } = require('../../infrastructure/auth/capabilities');
const { ExigirCapacidad } = require('../../infrastructure/auth/authorization-policy');
const { ACCESS_LEVEL } = require('../../infrastructure/auth/institutional-roles');
const { LeerFiltrosReporteria } = require('./validacion-reporteria');

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
  const anio = Number(new Date().toISOString().slice(0, 4));
  return LeerFiltrosReporteria(req.query, anio);
}

/**
 * Publica la reportería de Oficina Local.
 *
 * @param {object} servicio Servicio ya construido.
 * @returns {express.Router} Rutas de `/api/reporteria`.
 */
function CrearEnrutadorReporteria(servicio) {
  const router = express.Router();

  router.get(
    '/oficina',
    ExigirOficina(CAPABILITY.REPORTING_READ),
    EnvolverAsincrono(async (req, res) => {
      res.status(200).json(await servicio.ConsultarOficina(req.acceso, Filtros(req)));
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

  return router;
}

module.exports = { CrearEnrutadorReporteria };

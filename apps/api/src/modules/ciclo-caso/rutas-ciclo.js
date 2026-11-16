/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * Rutas del ciclo. La capacidad se vuelve a exigir en el servicio.
 */
'use strict';

const express = require('express');
const { EnvolverAsincrono } = require('../../common/async-handler');
const { DescartarCuerpoNoProcesado } = require('../../common/http-error-handler');
const { ErrorProhibido } = require('../../common/errors');
const { CAPABILITY } = require('../../infrastructure/auth/capabilities');
const { ExigirCapacidad } = require('../../infrastructure/auth/authorization-policy');
const { ACCESS_LEVEL } = require('../../infrastructure/auth/institutional-roles');
const {
  LeerCasoDeRuta,
  LeerCierre,
  LeerCoordinacion,
  LeerReporte
} = require('./validacion-ciclo');

function ExigirOficina(capacidad) {
  return function Exigir(req, res, next) {
    try {
      ExigirCapacidad(req.acceso, capacidad);
      if (!req.acceso || req.acceso.accessLevel !== ACCESS_LEVEL.LOCAL_OFFICE) {
        throw new ErrorProhibido('La operación no está permitida.');
      }
      next();
    } catch (error) {
      DescartarCuerpoNoProcesado(req, () => next(error));
    }
  };
}

/**
 * Publica coordinaciones, reportes y cierre.
 *
 * @param {object} servicio Servicio ya construido.
 * @returns {express.Router} Rutas de `/api/ciclo`.
 */
function CrearEnrutadorCiclo(servicio) {
  const router = express.Router();
  const json = express.json({ limit: '100kb' });

  router.get(
    '/catalogos',
    ExigirOficina(CAPABILITY.CASE_READ),
    EnvolverAsincrono(async (req, res) => {
      res.status(200).json(await servicio.ListarCatalogos(req.acceso));
    })
  );

  router.get(
    '/casos/:casoId/vista-reporte',
    ExigirOficina(CAPABILITY.CASE_REPORT_WRITE),
    EnvolverAsincrono(async (req, res) => {
      res.status(200).json(await servicio.ConsultarVista(
        req.acceso,
        LeerCasoDeRuta(req.params.casoId)
      ));
    })
  );

  router.post(
    '/coordinaciones',
    ExigirOficina(CAPABILITY.COORDINATION_WRITE),
    json,
    EnvolverAsincrono(async (req, res) => {
      const resultado = await servicio.RegistrarCoordinacion(
        req.acceso,
        LeerCoordinacion(req.body)
      );
      res.status(resultado.repetida ? 200 : 201).json(resultado);
    })
  );

  router.post(
    '/reportes',
    ExigirOficina(CAPABILITY.CASE_REPORT_WRITE),
    json,
    EnvolverAsincrono(async (req, res) => {
      const resultado = await servicio.RegistrarReporte(
        req.acceso,
        LeerReporte(req.body)
      );
      res.status(resultado.repetida ? 200 : 201).json(resultado);
    })
  );

  router.post(
    '/cierres',
    ExigirOficina(CAPABILITY.CASE_CLOSE),
    json,
    EnvolverAsincrono(async (req, res) => {
      const resultado = await servicio.CerrarCaso(
        req.acceso,
        LeerCierre(req.body)
      );
      res.status(resultado.repetida ? 200 : 201).json(resultado);
    })
  );

  return router;
}

module.exports = { CrearEnrutadorCiclo };

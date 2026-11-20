/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * Modificación: 2026-11-18. Lectura del caso activo seleccionado.
 * Rutas de atenciones. La capacidad se vuelve a exigir en el servicio.
 */
'use strict';

const express = require('express');
const { EnvolverAsincrono } = require('../../common/async-handler');
const { DescartarCuerpoNoProcesado } = require('../../common/http-error-handler');
const { ErrorProhibido } = require('../../common/errors');
const { CAPABILITY } = require('../../infrastructure/auth/capabilities');
const { ExigirCapacidad } = require('../../infrastructure/auth/authorization-policy');
const {
  LeerAtencionGrupal,
  LeerAtencionIndividual,
  LeerEntero
} = require('./validacion-atenciones');

function ExigirOficinaEnRuta(req, res, next) {
  try {
    ExigirCapacidad(req.acceso, CAPABILITY.ATTENTION_WRITE);
    if (!req.acceso || req.acceso.accessLevel !== 'OFICINA_LOCAL') {
      throw new ErrorProhibido('La operación no está permitida.');
    }
    next();
  } catch (error) {
    DescartarCuerpoNoProcesado(req, () => next(error));
  }
}

/**
 * Publica el registro de atenciones.
 *
 * @param {object} servicio Servicio ya construido.
 * @returns {express.Router} Rutas de `/api/atenciones`.
 */
function CrearEnrutadorAtenciones(servicio) {
  const router = express.Router();
  const json = express.json({ limit: '100kb' });

  router.get(
    '/catalogos',
    ExigirOficinaEnRuta,
    EnvolverAsincrono(async (req, res) => {
      res.status(200).json(await servicio.ListarCatalogos(req.acceso));
    })
  );

  router.get(
    '/casos/:casoId',
    ExigirOficinaEnRuta,
    EnvolverAsincrono(async (req, res) => {
      const casoId = LeerEntero(req.params.casoId, 'caso');
      res.status(200).json(await servicio.ObtenerCasoActivo(req.acceso, casoId));
    })
  );

  router.post(
    '/individuales',
    ExigirOficinaEnRuta,
    json,
    EnvolverAsincrono(async (req, res) => {
      res.status(201).json(await servicio.RegistrarIndividual(
        req.acceso,
        LeerAtencionIndividual(req.body)
      ));
    })
  );

  router.post(
    '/grupales',
    ExigirOficinaEnRuta,
    json,
    EnvolverAsincrono(async (req, res) => {
      res.status(201).json(await servicio.RegistrarGrupal(
        req.acceso,
        LeerAtencionGrupal(req.body)
      ));
    })
  );

  return router;
}

module.exports = { CrearEnrutadorAtenciones };

/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-18.
 * Rutas de posibles referencias. La capacidad se vuelve a exigir en el servicio.
 */
'use strict';

const express = require('express');
const { EnvolverAsincrono } = require('../../common/async-handler');
const { CAPABILITY } = require('../../infrastructure/auth/capabilities');
const { CrearControlCapacidad } = require('../../infrastructure/auth/authorization-policy');
const { LeerConsulta, LeerIdentificador } = require('./validacion-posibles');

/**
 * @param {object} servicio Servicio de posibles referencias.
 * @returns {express.Router} Rutas de `/api/posibles-referencias`.
 */
function CrearEnrutadorPosibles(servicio) {
  const router = express.Router();

  router.get(
    '/configuracion',
    CrearControlCapacidad(CAPABILITY.REFERRAL_READ),
    EnvolverAsincrono(async (req, res) => {
      res.status(200).json(servicio.Configuracion());
    })
  );

  router.get(
    '/ultima-ejecucion',
    CrearControlCapacidad(CAPABILITY.REFERRAL_READ),
    EnvolverAsincrono(async (req, res) => {
      res.status(200).json(await servicio.Ultima());
    })
  );

  router.post(
    '/deteccion',
    CrearControlCapacidad(CAPABILITY.REFERRAL_CREATE),
    EnvolverAsincrono(async (req, res) => {
      res.status(200).json(await servicio.Ejecutar(req.acceso));
    })
  );

  router.get(
    '/',
    CrearControlCapacidad(CAPABILITY.REFERRAL_READ),
    EnvolverAsincrono(async (req, res) => {
      res.status(200).json(await servicio.Listar(req.acceso, LeerConsulta(req.query)));
    })
  );

  router.get(
    '/:posibleId',
    CrearControlCapacidad(CAPABILITY.REFERRAL_READ),
    EnvolverAsincrono(async (req, res) => {
      const posibleId = LeerIdentificador(req.params.posibleId);
      res.status(200).json(await servicio.Detalle(req.acceso, posibleId));
    })
  );

  return router;
}

module.exports = { CrearEnrutadorPosibles };

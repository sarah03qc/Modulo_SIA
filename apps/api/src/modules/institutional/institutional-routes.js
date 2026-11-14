'use strict';

const express = require('express');
const { EnvolverAsincrono } = require('../../common/async-handler');
const { CAPABILITY } = require('../../infrastructure/auth/capabilities');
const { CrearControlCapacidad } = require('../../infrastructure/auth/authorization-policy');
const {
  LeerIdentificadorPersona,
  LeerConsultaBusqueda,
  LeerConsultaTerritorio
} = require('./request-validation');

/*
  Propósito: exponer la consulta institucional y exigir la capacidad en la ruta
  Entrada: servicio de personas
  Salida: router de Express. El servicio vuelve a comprobar la misma capacidad
*/
function CrearEnrutadorInstitucional(servicio) {
  const router = express.Router();

  router.get(
    '/persons/search',
    CrearControlCapacidad(CAPABILITY.PERSON_SEARCH),
    EnvolverAsincrono(async (req, res) => {
      const criterios = LeerConsultaBusqueda(req.query);
      const cuerpo = await servicio.BuscarPersonas(req.acceso, criterios);
      res.status(200).json(cuerpo);
    })
  );

  router.get(
    '/persons/:personId',
    CrearControlCapacidad(CAPABILITY.PERSON_PROFILE_READ),
    EnvolverAsincrono(async (req, res) => {
      const identificador = LeerIdentificadorPersona(req.params.personId);
      const cuerpo = await servicio.ObtenerPersona(req.acceso, identificador);
      res.status(200).json(cuerpo);
    })
  );

  router.get(
    '/territory/options',
    CrearControlCapacidad(CAPABILITY.TERRITORY_OPTIONS_READ),
    EnvolverAsincrono(async (req, res) => {
      const filtros = LeerConsultaTerritorio(req.query);
      const cuerpo = await servicio.ListarOpcionesTerritorio(req.acceso, filtros);
      res.status(200).json(cuerpo);
    })
  );

  return router;
}

module.exports = { CrearEnrutadorInstitucional };

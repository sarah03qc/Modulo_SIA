'use strict';

const express = require('express');
const { asyncHandler } = require('../../common/async-handler');
const { CAPABILITY } = require('../../infrastructure/auth/capabilities');
const { CrearControlCapacidad } = require('../../infrastructure/auth/authorization-policy');
const { readPersonId, readSearchQuery, readTerritoryQuery } = require('./request-validation');

/*
  Propósito: exponer la consulta institucional y exigir la capacidad en la ruta
  Entrada: servicio de personas
  Salida: router de Express. El servicio vuelve a comprobar la misma capacidad
*/
function createInstitutionalRouter(service) {
  const router = express.Router();

  router.get('/persons/search', CrearControlCapacidad(CAPABILITY.PERSON_SEARCH), asyncHandler(async (req, res) => {
    const criteria = readSearchQuery(req.query);
    const body = await service.searchPersons(req.access, criteria);
    res.status(200).json(body);
  }));

  router.get('/persons/:personId', CrearControlCapacidad(CAPABILITY.PERSON_PROFILE_READ), asyncHandler(async (req, res) => {
    const personId = readPersonId(req.params.personId);
    const body = await service.getPerson(req.access, personId);
    res.status(200).json(body);
  }));

  router.get('/territory/options', CrearControlCapacidad(CAPABILITY.TERRITORY_OPTIONS_READ), asyncHandler(async (req, res) => {
    const filters = readTerritoryQuery(req.query);
    const body = await service.listTerritoryOptions(req.access, filters);
    res.status(200).json(body);
  }));

  return router;
}

module.exports = { createInstitutionalRouter };

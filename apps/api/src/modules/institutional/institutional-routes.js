'use strict';

const express = require('express');
const { asyncHandler } = require('../../common/async-handler');
const { readPersonId, readSearchQuery, readTerritoryQuery } = require('./request-validation');

function createInstitutionalRouter(service) {
  const router = express.Router();

  router.get('/persons/search', asyncHandler(async (req, res) => {
    const criteria = readSearchQuery(req.query);
    const body = await service.searchPersons(req.access, criteria);
    res.status(200).json(body);
  }));

  router.get('/persons/:personId', asyncHandler(async (req, res) => {
    const personId = readPersonId(req.params.personId);
    const body = await service.getPerson(req.access, personId);
    res.status(200).json(body);
  }));

  router.get('/territory/options', asyncHandler(async (req, res) => {
    const filters = readTerritoryQuery(req.query);
    const body = await service.listTerritoryOptions(req.access, filters);
    res.status(200).json(body);
  }));

  return router;
}

module.exports = { createInstitutionalRouter };

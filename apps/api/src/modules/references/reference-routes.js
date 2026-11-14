'use strict';

const express = require('express');
const { asyncHandler } = require('../../common/async-handler');
const { CAPABILITY } = require('../../infrastructure/auth/capabilities');
const { CrearControlCapacidad } = require('../../infrastructure/auth/authorization-policy');
const { MAX_TEMPLATE_BYTES } = require('./reference-constants');
const {
  readDraftCommand,
  readReferenceId,
  readReferenceListQuery,
  readReferralCommand
} = require('./reference-validation');

/**
 * Publica las rutas de referencias.
 * Cada ruta exige la capacidad y el servicio la vuelve a exigir.
 *
 * @param {object} service Servicio de referencias.
 * @returns {express.Router} Rutas montadas en `/api/references`.
 */
function createReferenceRouter(service) {
  const router = express.Router();
  const LeerCuerpoJson = express.json({ limit: '100kb' });
  const LeerArchivoPlantilla = express.raw({ type: () => true, limit: MAX_TEMPLATE_BYTES });

  router.get('/catalogs', CrearControlCapacidad(CAPABILITY.REFERRAL_CREATE), asyncHandler(async (req, res) => {
    res.status(200).json(await service.listCatalogs(req.access));
  }));

  router.get('/template', CrearControlCapacidad(CAPABILITY.REFERRAL_IMPORT), asyncHandler(async (req, res) => {
    const file = await service.downloadTemplate(req.access);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    res.status(200).send(file.body);
  }));

  // La sesión y la capacidad se comprueban antes de leer el archivo.
  router.post(
    '/template',
    CrearControlCapacidad(CAPABILITY.REFERRAL_IMPORT),
    LeerArchivoPlantilla,
    asyncHandler(async (req, res) => {
      const precarga = await service.preloadTemplate(req.access, req.body);
      res.status(200).json(precarga);
    })
  );

  router.post(
    '/validation',
    CrearControlCapacidad(CAPABILITY.REFERRAL_CREATE),
    LeerCuerpoJson,
    asyncHandler(async (req, res) => {
      const solicitud = readReferralCommand(req.body);
      res.status(200).json(await service.validateReferral(req.access, solicitud));
    })
  );

  router.post(
    '/',
    CrearControlCapacidad(CAPABILITY.REFERRAL_CREATE),
    LeerCuerpoJson,
    asyncHandler(async (req, res) => {
      const solicitud = readReferralCommand(req.body, { requireCaptureOrigin: true });
      res.status(201).json(await service.submitReferral(req.access, solicitud));
    })
  );

  router.get('/', CrearControlCapacidad(CAPABILITY.REFERRAL_READ), asyncHandler(async (req, res) => {
    const criteria = readReferenceListQuery(req.query);
    res.status(200).json(await service.listReferences(req.access, criteria));
  }));

  router.get('/drafts', CrearControlCapacidad(CAPABILITY.REFERRAL_CREATE), asyncHandler(async (req, res) => {
    res.status(200).json(await service.listDrafts(req.access));
  }));

  router.put(
    '/drafts',
    CrearControlCapacidad(CAPABILITY.REFERRAL_CREATE),
    LeerCuerpoJson,
    asyncHandler(async (req, res) => {
      const solicitud = readDraftCommand(req.body);
      res.status(200).json(await service.saveDraft(req.access, solicitud));
    })
  );

  router.delete('/drafts/:draftId', CrearControlCapacidad(CAPABILITY.REFERRAL_CREATE), asyncHandler(async (req, res) => {
    await service.deleteDraft(req.access, readReferenceId(req.params.draftId));
    res.status(204).end();
  }));

  router.get('/:referenceId/document', CrearControlCapacidad(CAPABILITY.REFERRAL_PRINT), asyncHandler(async (req, res) => {
    const file = await service.printReference(req.access, readReferenceId(req.params.referenceId));
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    res.setHeader('X-Document-Generated-At', file.generatedAt);
    res.status(200).send(file.body);
  }));

  router.get('/:referenceId', CrearControlCapacidad(CAPABILITY.REFERRAL_READ_DETAIL), asyncHandler(async (req, res) => {
    res.status(200).json(await service.getReference(req.access, readReferenceId(req.params.referenceId)));
  }));

  return router;
}

module.exports = { createReferenceRouter };

'use strict';

const express = require('express');
const { asyncHandler } = require('../../common/async-handler');
const { CAPABILITY } = require('../../infrastructure/auth/capabilities');
const { createCapabilityGuard } = require('../../infrastructure/auth/authorization-policy');
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

  router.get('/catalogs', createCapabilityGuard(CAPABILITY.REFERRAL_CREATE), asyncHandler(async (req, res) => {
    res.status(200).json(await service.listCatalogs(req.access));
  }));

  router.get('/template', createCapabilityGuard(CAPABILITY.REFERRAL_IMPORT), asyncHandler(async (req, res) => {
    const file = await service.downloadTemplate(req.access);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    res.status(200).send(file.body);
  }));

  router.post('/template', createCapabilityGuard(CAPABILITY.REFERRAL_IMPORT), asyncHandler(async (req, res) => {
    const body = await service.preloadTemplate(req.access, req.body);
    res.status(200).json(body);
  }));

  router.post('/validation', createCapabilityGuard(CAPABILITY.REFERRAL_CREATE), asyncHandler(async (req, res) => {
    const command = readReferralCommand(req.body);
    res.status(200).json(await service.validateReferral(req.access, command));
  }));

  router.post('/', createCapabilityGuard(CAPABILITY.REFERRAL_CREATE), asyncHandler(async (req, res) => {
    const command = readReferralCommand(req.body, { requireCaptureOrigin: true });
    res.status(201).json(await service.submitReferral(req.access, command));
  }));

  router.get('/', createCapabilityGuard(CAPABILITY.REFERRAL_READ), asyncHandler(async (req, res) => {
    const criteria = readReferenceListQuery(req.query);
    res.status(200).json(await service.listReferences(req.access, criteria));
  }));

  router.get('/drafts', createCapabilityGuard(CAPABILITY.REFERRAL_CREATE), asyncHandler(async (req, res) => {
    res.status(200).json(await service.listDrafts(req.access));
  }));

  router.put('/drafts', createCapabilityGuard(CAPABILITY.REFERRAL_CREATE), asyncHandler(async (req, res) => {
    const command = readDraftCommand(req.body);
    res.status(200).json(await service.saveDraft(req.access, command));
  }));

  router.delete('/drafts/:draftId', createCapabilityGuard(CAPABILITY.REFERRAL_CREATE), asyncHandler(async (req, res) => {
    await service.deleteDraft(req.access, readReferenceId(req.params.draftId));
    res.status(204).end();
  }));

  router.get('/:referenceId/document', createCapabilityGuard(CAPABILITY.REFERRAL_PRINT), asyncHandler(async (req, res) => {
    const file = await service.printReference(req.access, readReferenceId(req.params.referenceId));
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    res.setHeader('X-Document-Generated-At', file.generatedAt);
    res.status(200).send(file.body);
  }));

  router.get('/:referenceId', createCapabilityGuard(CAPABILITY.REFERRAL_READ_DETAIL), asyncHandler(async (req, res) => {
    res.status(200).json(await service.getReference(req.access, readReferenceId(req.params.referenceId)));
  }));

  return router;
}

module.exports = { createReferenceRouter };

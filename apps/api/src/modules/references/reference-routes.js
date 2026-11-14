'use strict';

const express = require('express');
const { EnvolverAsincrono } = require('../../common/async-handler');
const { CAPABILITY } = require('../../infrastructure/auth/capabilities');
const { CrearControlCapacidad } = require('../../infrastructure/auth/authorization-policy');
const { MAX_TEMPLATE_BYTES } = require('./reference-constants');
const {
  LeerSolicitudBorrador,
  LeerIdentificadorReferencia,
  LeerConsultaReferencias,
  LeerSolicitudReferencia
} = require('./reference-validation');

/**
 * Publica las rutas de referencias.
 * Cada ruta exige la capacidad y el servicio la vuelve a exigir.
 *
 * @param {object} servicio Servicio de referencias.
 * @returns {express.Router} Rutas montadas en `/api/references`.
 */
function CrearEnrutadorReferencias(servicio) {
  const router = express.Router();
  const LeerCuerpoJson = express.json({ limit: '100kb' });
  const LeerArchivoPlantilla = express.raw({ type: () => true, limit: MAX_TEMPLATE_BYTES });

  router.get(
    '/catalogs',
    CrearControlCapacidad(CAPABILITY.REFERRAL_CREATE),
    EnvolverAsincrono(async (req, res) => {
      res.status(200).json(await servicio.ListarCatalogos(req.acceso));
    })
  );

  router.get(
    '/template',
    CrearControlCapacidad(CAPABILITY.REFERRAL_IMPORT),
    EnvolverAsincrono(async (req, res) => {
      const archivo = await servicio.DescargarPlantilla(req.acceso);
      res.setHeader('Content-Type', archivo.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${archivo.fileName}"`);
      res.status(200).send(archivo.body);
    })
  );

  // La sesión y la capacidad se comprueban antes de leer el archivo.
  router.post(
    '/template',
    CrearControlCapacidad(CAPABILITY.REFERRAL_IMPORT),
    LeerArchivoPlantilla,
    EnvolverAsincrono(async (req, res) => {
      const precarga = await servicio.PrecargarPlantilla(req.acceso, req.body);
      res.status(200).json(precarga);
    })
  );

  router.post(
    '/validation',
    CrearControlCapacidad(CAPABILITY.REFERRAL_CREATE),
    LeerCuerpoJson,
    EnvolverAsincrono(async (req, res) => {
      const solicitud = LeerSolicitudReferencia(req.body);
      res.status(200).json(await servicio.ValidarReferencia(req.acceso, solicitud));
    })
  );

  router.post(
    '/',
    CrearControlCapacidad(CAPABILITY.REFERRAL_CREATE),
    LeerCuerpoJson,
    EnvolverAsincrono(async (req, res) => {
      const solicitud = LeerSolicitudReferencia(req.body, { requireCaptureOrigin: true });
      res.status(201).json(await servicio.EnviarReferencia(req.acceso, solicitud));
    })
  );

  router.get(
    '/',
    CrearControlCapacidad(CAPABILITY.REFERRAL_READ),
    EnvolverAsincrono(async (req, res) => {
      const criterios = LeerConsultaReferencias(req.query);
      res.status(200).json(await servicio.ListarReferencias(req.acceso, criterios));
    })
  );

  router.get(
    '/drafts',
    CrearControlCapacidad(CAPABILITY.REFERRAL_CREATE),
    EnvolverAsincrono(async (req, res) => {
      res.status(200).json(await servicio.ListarBorradores(req.acceso));
    })
  );

  router.put(
    '/drafts',
    CrearControlCapacidad(CAPABILITY.REFERRAL_CREATE),
    LeerCuerpoJson,
    EnvolverAsincrono(async (req, res) => {
      const solicitud = LeerSolicitudBorrador(req.body);
      res.status(200).json(await servicio.GuardarBorrador(req.acceso, solicitud));
    })
  );

  router.delete(
    '/drafts/:draftId',
    CrearControlCapacidad(CAPABILITY.REFERRAL_CREATE),
    EnvolverAsincrono(async (req, res) => {
      const borradorId = LeerIdentificadorReferencia(req.params.draftId);
      await servicio.EliminarBorrador(req.acceso, borradorId);
      res.status(204).end();
    })
  );

  router.get(
    '/:referenceId/document',
    CrearControlCapacidad(CAPABILITY.REFERRAL_PRINT),
    EnvolverAsincrono(async (req, res) => {
      const referenciaId = LeerIdentificadorReferencia(req.params.referenceId);
      const archivo = await servicio.ImprimirReferencia(req.acceso, referenciaId);
      res.setHeader('Content-Type', archivo.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${archivo.fileName}"`);
      res.setHeader('X-Document-Generated-At', archivo.generatedAt);
      res.status(200).send(archivo.body);
    })
  );

  router.get(
    '/:referenceId',
    CrearControlCapacidad(CAPABILITY.REFERRAL_READ_DETAIL),
    EnvolverAsincrono(async (req, res) => {
      const referenciaId = LeerIdentificadorReferencia(req.params.referenceId);
      res.status(200).json(await servicio.ObtenerReferencia(req.acceso, referenciaId));
    })
  );

  return router;
}

module.exports = { CrearEnrutadorReferencias };

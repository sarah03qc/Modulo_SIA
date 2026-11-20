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
  LeerDocumento,
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
    '/casos/:casoId/documentos',
    ExigirOficina(CAPABILITY.DOCUMENT_WRITE),
    express.json({ limit: '8mb' }),
    EnvolverAsincrono(async (req, res) => {
      const casoId = LeerCasoDeRuta(req.params.casoId);
      const resultado = await servicio.RegistrarDocumento(
        req.acceso,
        LeerDocumento(req.body, casoId)
      );
      res.status(201).json(resultado);
    })
  );

  router.get(
    '/casos/:casoId/documentos/:documentoId',
    ExigirOficina(CAPABILITY.DOCUMENT_READ),
    EnvolverAsincrono(async (req, res) => {
      const archivo = await servicio.DescargarDocumento(
        req.acceso,
        LeerCasoDeRuta(req.params.casoId),
        LeerCasoDeRuta(req.params.documentoId)
      );
      const nombre = String(archivo.nombre).replace(/[^A-Za-z0-9._-]/g, '_');
      res.setHeader('Content-Type', archivo.tipo);
      res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
      res.status(200).send(archivo.contenido);
    })
  );

  router.get(
    '/casos/:casoId/exportacion',
    ExigirOficina(CAPABILITY.CASE_READ),
    EnvolverAsincrono(async (req, res) => {
      const archivo = await servicio.ExportarExpediente(
        req.acceso,
        LeerCasoDeRuta(req.params.casoId)
      );
      res.setHeader('Content-Type', archivo.tipo);
      res.setHeader('Content-Disposition', `attachment; filename="${archivo.nombre}"`);
      res.status(200).send(archivo.contenido);
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

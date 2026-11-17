/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-14.
 * Modificación: 2026-11-16. Seguimiento y consulta Regional y Nacional.
 * Rutas del proceso interdisciplinario. La capacidad se exige otra vez en el servicio.
 */
'use strict';

const express = require('express');
const { EnvolverAsincrono } = require('../../common/async-handler');
const { DescartarCuerpoNoProcesado } = require('../../common/http-error-handler');
const { ErrorProhibido } = require('../../common/errors');
const { CAPABILITY } = require('../../infrastructure/auth/capabilities');
const {
  ExigirCapacidad,
  TieneCapacidad
} = require('../../infrastructure/auth/authorization-policy');
const {
  LeerApertura,
  LeerConsultaCasos,
  LeerConsultaPrioridad,
  LeerEntero,
  LeerPeriodoSeguimiento,
  LeerResolucion,
  LeerSesion,
  LeerSituacion,
  LeerValoracion
} = require('./validacion-proceso');

function ExigirAlguna(capacidades) {
  return function Comprobar(req, res, next) {
    try {
      const permitida = capacidades.some((capacidad) => TieneCapacidad(req.acceso, capacidad));
      if (!permitida) {
        ExigirCapacidad(req.acceso, capacidades[0]);
      }
      next();
    } catch (error) {
      DescartarCuerpoNoProcesado(req, () => next(error));
    }
  };
}

function ExigirLecturaCasosEnRuta(req, res, next) {
  try {
    ExigirCapacidad(req.acceso, CAPABILITY.CASE_READ);
    const nivel = req.acceso && req.acceso.accessLevel;
    if (nivel !== 'OFICINA_LOCAL' && nivel !== 'REGION' && nivel !== 'NACIONAL') {
      throw new ErrorProhibido('La operación no está permitida.');
    }
    next();
  } catch (error) {
    DescartarCuerpoNoProcesado(req, () => next(error));
  }
}

function ExigirOficinaEnRuta(capacidad) {
  return function Comprobar(req, res, next) {
    try {
      ExigirCapacidad(req.acceso, capacidad);
      if (!req.acceso || req.acceso.accessLevel !== 'OFICINA_LOCAL') {
        throw new ErrorProhibido('La operación no está permitida.');
      }
      next();
    } catch (error) {
      DescartarCuerpoNoProcesado(req, () => next(error));
    }
  };
}

/**
 * Publica el proceso interdisciplinario.
 *
 * @param {object} servicio Servicio ya construido.
 * @returns {express.Router} Rutas de `/api/proceso`.
 */
function CrearEnrutadorProceso(servicio) {
  const router = express.Router();
  const json = express.json({ limit: '100kb' });

  router.get('/contexto', EnvolverAsincrono(async (req, res) => {
    res.status(200).json(servicio.ObtenerContexto(req.acceso));
  }));

  router.get(
    '/resumen',
    ExigirAlguna([CAPABILITY.CASE_SUMMARY_READ, CAPABILITY.CASE_READ]),
    EnvolverAsincrono(async (req, res) => {
      res.status(200).json(await servicio.ObtenerResumen(req.acceso));
    })
  );

  router.get(
    '/catalogos',
    ExigirOficinaEnRuta(CAPABILITY.SESSION_MANAGE),
    EnvolverAsincrono(async (req, res) => {
      res.status(200).json(await servicio.ListarCatalogos(req.acceso));
    })
  );

  router.post(
    '/prioridad',
    ExigirOficinaEnRuta(CAPABILITY.ASSESSMENT_WRITE),
    json,
    EnvolverAsincrono(async (req, res) => {
      res.status(200).json(await servicio.CalcularPrioridad(
        req.acceso,
        LeerConsultaPrioridad(req.body)
      ));
    })
  );

  router.get(
    '/sesiones',
    ExigirOficinaEnRuta(CAPABILITY.SESSION_MANAGE),
    EnvolverAsincrono(async (req, res) => {
      res.status(200).json(await servicio.ListarSesiones(req.acceso));
    })
  );

  router.post(
    '/sesiones',
    ExigirOficinaEnRuta(CAPABILITY.SESSION_MANAGE),
    json,
    EnvolverAsincrono(async (req, res) => {
      res.status(201).json(await servicio.CrearSesion(req.acceso, LeerSesion(req.body)));
    })
  );

  router.get(
    '/sesiones/:sesionId',
    ExigirOficinaEnRuta(CAPABILITY.SESSION_MANAGE),
    EnvolverAsincrono(async (req, res) => {
      const sesionId = LeerEntero(req.params.sesionId, 'sesión');
      res.status(200).json(await servicio.ObtenerSesion(req.acceso, sesionId));
    })
  );

  router.post(
    '/sesiones/:sesionId/situaciones',
    ExigirOficinaEnRuta(CAPABILITY.SESSION_MANAGE),
    json,
    EnvolverAsincrono(async (req, res) => {
      const sesionId = LeerEntero(req.params.sesionId, 'sesión');
      res.status(201).json(await servicio.AsociarSituacion(
        req.acceso,
        sesionId,
        LeerSituacion(req.body)
      ));
    })
  );

  router.post(
    '/valoraciones',
    ExigirOficinaEnRuta(CAPABILITY.ASSESSMENT_WRITE),
    json,
    EnvolverAsincrono(async (req, res) => {
      res.status(201).json(await servicio.RegistrarValoracion(
        req.acceso,
        LeerValoracion(req.body)
      ));
    })
  );

  router.post(
    '/resoluciones',
    ExigirOficinaEnRuta(CAPABILITY.ASSESSMENT_WRITE),
    json,
    EnvolverAsincrono(async (req, res) => {
      res.status(201).json(await servicio.RegistrarResolucion(
        req.acceso,
        LeerResolucion(req.body)
      ));
    })
  );

  router.post(
    '/casos',
    ExigirOficinaEnRuta(CAPABILITY.CASE_OPEN),
    json,
    EnvolverAsincrono(async (req, res) => {
      res.status(201).json(await servicio.AbrirCaso(req.acceso, LeerApertura(req.body)));
    })
  );

  router.get(
    '/seguimiento/sin-atencion',
    ExigirOficinaEnRuta(CAPABILITY.ATTENTION_DETAIL_READ),
    EnvolverAsincrono(async (req, res) => {
      res.status(200).json(await servicio.ListarSinAtencion(
        req.acceso,
        LeerPeriodoSeguimiento(req.query)
      ));
    })
  );

  router.get(
    '/casos/exportacion',
    ExigirLecturaCasosEnRuta,
    EnvolverAsincrono(async (req, res) => {
      const archivo = await servicio.ExportarCasos(req.acceso, LeerConsultaCasos(req.query));
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="casos-atencion-interdisciplinaria.csv"');
      res.status(200).send(archivo.contenido);
    })
  );

  router.get(
    '/casos',
    ExigirAlguna([CAPABILITY.CASE_SUMMARY_READ, CAPABILITY.CASE_READ]),
    EnvolverAsincrono(async (req, res) => {
      res.status(200).json(await servicio.ListarCasos(req.acceso, LeerConsultaCasos(req.query)));
    })
  );

  router.get(
    '/casos/:casoId',
    ExigirLecturaCasosEnRuta,
    EnvolverAsincrono(async (req, res) => {
      const casoId = LeerEntero(req.params.casoId, 'caso');
      const nivel = req.acceso && req.acceso.accessLevel;
      const detalle = nivel === 'REGION' || nivel === 'NACIONAL'
        ? await servicio.ObtenerConsultaCaso(req.acceso, casoId)
        : await servicio.ObtenerCaso(req.acceso, casoId);
      res.status(200).json(detalle);
    })
  );

  return router;
}

module.exports = { CrearEnrutadorProceso };

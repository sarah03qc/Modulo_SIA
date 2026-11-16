/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * Rutas de programación. La capacidad se vuelve a exigir en el servicio.
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
  LeerActividad,
  LeerConsulta,
  LeerEntero,
  LeerEstadoFiltro,
  LeerResolucion
} = require('./validacion-programacion');

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
 * Publica la programación de Oficina Local.
 *
 * @param {object} servicio Servicio ya construido.
 * @returns {express.Router} Rutas de `/api/programacion`.
 */
function CrearEnrutadorProgramacion(servicio) {
  const router = express.Router();
  const json = express.json({ limit: '100kb' });

  router.get(
    '/catalogos',
    ExigirOficina(CAPABILITY.SCHEDULING_READ),
    EnvolverAsincrono(async (req, res) => {
      res.status(200).json(await servicio.ListarCatalogos(req.acceso));
    })
  );

  router.get(
    '/actividades',
    ExigirOficina(CAPABILITY.SCHEDULING_READ),
    EnvolverAsincrono(async (req, res) => {
      const filtros = LeerConsulta(req.query);
      filtros.estado = LeerEstadoFiltro(filtros.estado);
      res.status(200).json(await servicio.Consultar(req.acceso, filtros));
    })
  );

  router.post(
    '/actividades',
    ExigirOficina(CAPABILITY.SCHEDULING_MANAGE),
    json,
    EnvolverAsincrono(async (req, res) => {
      const resultado = await servicio.CrearActividad(req.acceso, LeerActividad(req.body));
      res.status(resultado.repetida ? 200 : 201).json(resultado);
    })
  );

  router.post(
    '/actividades/:actividadId/resoluciones',
    ExigirOficina(CAPABILITY.SCHEDULING_MANAGE),
    json,
    EnvolverAsincrono(async (req, res) => {
      const resultado = await servicio.ResolverActividad(
        req.acceso,
        LeerEntero(req.params.actividadId, 'actividad'),
        LeerResolucion(req.body)
      );
      res.status(resultado.repetida ? 200 : 201).json(resultado);
    })
  );

  return router;
}

module.exports = { CrearEnrutadorProgramacion };

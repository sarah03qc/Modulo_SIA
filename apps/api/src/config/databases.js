'use strict';

/*
  Nombres fijos de las dos bases que usa la API.
  SIA_CENCINAI es la base propia del módulo y admite escritura controlada.
  SIDINACC_LOCAL es la réplica institucional y solo se consulta.
*/

const SIA_DATABASE = 'SIA_CENCINAI';
const SIDINACC_DATABASE = 'SIDINACC_LOCAL';

module.exports = {
  SIA_DATABASE,
  SIDINACC_DATABASE
};

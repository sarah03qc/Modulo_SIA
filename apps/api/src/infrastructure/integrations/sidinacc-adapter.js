'use strict';

const { SIDINACC_DATABASE } = require('../../config/databases');
const { CrearLectorPersonasSidinacc } = require('./sidinacc-person-reader');

/**
 * Punto de entrada de la réplica institucional.
 *
 * Recibe el cliente de SIDINACC_LOCAL. Expone la búsqueda de personas,
 * la ficha y los catálogos territoriales. La comprobación de disponibilidad
 * verifica que la conexión apunta a esa base y si la cuenta se ve como solo lectura.
 */
function CrearAdaptadorSidinacc(client) {
  const persons = CrearLectorPersonasSidinacc(client);
  return {
    /**
     * Comprueba la réplica sin leer datos de personas.
     * available es verdadero solo si el nombre de la base es SIDINACC_LOCAL.
     */
    async ComprobarDisponibilidad() {
      const Sondear = await client.Sondear();
      return {
        available: Sondear.database === SIDINACC_DATABASE,
        database: Sondear.database,
        readOnly: Sondear.readOnly
      };
    },
    BuscarPersonas: (criteria) => persons.BuscarPersonas(criteria),
    BuscarPersonaEnAmbito: (criteria) => persons.BuscarPersonaEnAmbito(criteria),
    ListarServicios: (criteria) => persons.ListarServicios(criteria),
    ListarFilasEncargado: (criteria) => persons.ListarFilasEncargado(criteria),
    BuscarEstablecimiento: (establishmentId) => persons.BuscarEstablecimiento(establishmentId),
    BuscarOficinaLocal: (localOfficeId) => persons.BuscarOficinaLocal(localOfficeId),
    BuscarRegion: (regionId) => persons.BuscarRegion(regionId),
    ListarRegiones: (scope) => persons.ListarRegiones(scope),
    ListarOficinasLocales: (scope) => persons.ListarOficinasLocales(scope),
    ListarEstablecimientos: (scope) => persons.ListarEstablecimientos(scope),
    LeerSexoYNacimiento: (identificadores) => persons.LeerSexoYNacimiento(identificadores)
  };
}

module.exports = { CrearAdaptadorSidinacc };

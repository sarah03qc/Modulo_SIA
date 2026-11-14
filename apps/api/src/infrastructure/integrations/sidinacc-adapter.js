'use strict';

const { SIDINACC_DATABASE } = require('../../config/databases');
const { createSidinaccPersonReader } = require('./sidinacc-person-reader');

/**
 * Punto de entrada de la réplica institucional.
 *
 * Recibe el cliente de SIDINACC_LOCAL. Expone la búsqueda de personas,
 * la ficha y los catálogos territoriales. La comprobación de disponibilidad
 * verifica que la conexión apunta a esa base y si la cuenta se ve como solo lectura.
 */
function createSidinaccAdapter(client) {
  const persons = createSidinaccPersonReader(client);
  return {
    /**
     * Comprueba la réplica sin leer datos de personas.
     * available es verdadero solo si el nombre de la base es SIDINACC_LOCAL.
     */
    async checkAvailability() {
      const probe = await client.probe();
      return {
        available: probe.database === SIDINACC_DATABASE,
        database: probe.database,
        readOnly: probe.readOnly
      };
    },
    searchPersons: (criteria) => persons.searchPersons(criteria),
    findPersonInScope: (criteria) => persons.findPersonInScope(criteria),
    listServices: (criteria) => persons.listServices(criteria),
    listGuardianRows: (criteria) => persons.listGuardianRows(criteria),
    findEstablishment: (establishmentId) => persons.findEstablishment(establishmentId),
    findLocalOffice: (localOfficeId) => persons.findLocalOffice(localOfficeId),
    findRegion: (regionId) => persons.findRegion(regionId),
    listRegions: (scope) => persons.listRegions(scope),
    listLocalOffices: (scope) => persons.listLocalOffices(scope),
    listEstablishments: (scope) => persons.listEstablishments(scope)
  };
}

module.exports = { createSidinaccAdapter };

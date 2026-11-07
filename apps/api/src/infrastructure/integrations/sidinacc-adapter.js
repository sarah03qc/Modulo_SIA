'use strict';

const { SIDINACC_DATABASE } = require('../../config/databases');
const { createSidinaccPersonReader } = require('./sidinacc-person-reader');

function createSidinaccAdapter(client) {
  const persons = createSidinaccPersonReader(client);
  return {
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

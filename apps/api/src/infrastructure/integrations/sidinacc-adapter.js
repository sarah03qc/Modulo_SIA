'use strict';

const { SIDINACC_DATABASE } = require('../../config/databases');

function createSidinaccAdapter(client) {
  return {
    async checkAvailability() {
      const probe = await client.probe();
      return {
        available: probe.database === SIDINACC_DATABASE,
        database: probe.database,
        readOnly: probe.readOnly
      };
    }
  };
}

module.exports = { createSidinaccAdapter };

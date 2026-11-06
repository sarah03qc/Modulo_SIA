'use strict';

const { AuthenticationNotConfiguredError } = require('../../common/errors');

function requireInstitutionalSession(req, res, next) {
  next(new AuthenticationNotConfiguredError());
}

module.exports = { requireInstitutionalSession };

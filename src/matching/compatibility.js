/*
 * Keep the legacy helper module as a compatibility entry point. The scorer
 * owns the validation behavior so malformed profiles receive safe zero
 * category scores instead of throwing.
 */
const {
  budgetCompatibility,
  locationCompatibility,
} = require('./compatibility-score');

module.exports = { budgetCompatibility, locationCompatibility };

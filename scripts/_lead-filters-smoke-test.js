/**
 * Lead filter parser smoke tests.
 * Run: npx tsx scripts/_lead-filters-smoke-test.js
 */
const assert = require('assert')
const {
  parseLeadTypeFilter,
  parseLeadDateFilter,
  parseLeadSortPreset,
  parseLeadLimit,
  leadSortToSql,
  leadDateCutoffUtc,
} = require('../lib/admin/leadFilters.ts')

assert.equal(parseLeadTypeFilter('detailed'), 'detailed')
assert.equal(parseLeadTypeFilter('bogus'), 'all')
assert.equal(parseLeadDateFilter('7d'), '7d')
assert.equal(parseLeadSortPreset('company_asc'), 'company_asc')
assert.equal(parseLeadSortPreset('newest'), 'newest')
assert.equal(parseLeadLimit('50'), 50)
assert.equal(parseLeadLimit('3'), 20)
assert.equal(leadSortToSql('oldest').direction, 'ASC')
assert.ok(leadDateCutoffUtc('today') instanceof Date)
assert.equal(leadDateCutoffUtc('all'), null)

console.log(JSON.stringify({ ok: true, tests: ['lead-filters'] }))

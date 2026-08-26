/**
 * Smoke tests for PDF share token helpers.
 * Run: npx tsx scripts/_pdf-share-smoke-test.js
 */
const assert = require('assert')
const { generatePdfShareToken } = require('../lib/db/reportPdfShares.ts')
const { parseShareFilter } = require('../lib/admin/reportFilters.ts')

const a = generatePdfShareToken()
const b = generatePdfShareToken()
assert.ok(a.length >= 40)
assert.ok(/^[A-Za-z0-9_-]+$/.test(a))
assert.notEqual(a, b)

assert.equal(parseShareFilter('shared'), 'shared')
assert.equal(parseShareFilter('private'), 'private')
assert.equal(parseShareFilter('x'), 'all')
assert.equal(parseShareFilter(null), 'all')

console.log(
  JSON.stringify({
    ok: true,
    tests: ['token-entropy-shape', 'token-unique', 'share-filter'],
  })
)

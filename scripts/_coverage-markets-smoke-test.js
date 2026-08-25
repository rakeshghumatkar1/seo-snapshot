/**
 * Smoke tests for homepage report-coverage market building.
 * Run: npx tsx scripts/_coverage-markets-smoke-test.js
 */
const assert = require('assert')
const { buildCoverageMarkets } = require('../lib/homepage/coverageMarkets.ts')

function testCurrentProductionShape() {
  const out = buildCoverageMarkets([
    {
      business_category: 'Digital Marketing',
      public_location: 'Pune, India',
    },
  ])
  assert.deepEqual(out, [
    { businessCategory: 'Digital Marketing', publicLocation: 'Pune, India' },
  ])
}

function testDeduplication() {
  const out = buildCoverageMarkets([
    { business_category: 'Digital Marketing', public_location: 'Pune, India' },
    { business_category: 'digital marketing', public_location: 'Pune, India' },
    { business_category: '  Digital Marketing  ', public_location: '  Pune, India  ' },
  ])
  assert.equal(out.length, 1)
  assert.equal(out[0].businessCategory, 'Digital Marketing')
  assert.equal(out[0].publicLocation, 'Pune, India')
}

function testEmptyExcluded() {
  const out = buildCoverageMarkets([
    { business_category: null, public_location: null },
    { business_category: '   ', public_location: '' },
    { business_category: 'SaaS Technology', public_location: 'London, UK' },
  ])
  assert.deepEqual(out, [
    { businessCategory: 'SaaS Technology', publicLocation: 'London, UK' },
  ])
}

function testCategoryOrLocationOnly() {
  const out = buildCoverageMarkets([
    { business_category: 'Specialty Insurance', public_location: null },
    { business_category: null, public_location: 'Dubai, UAE' },
  ])
  assert.deepEqual(out, [
    { businessCategory: 'Specialty Insurance', publicLocation: null },
    { businessCategory: null, publicLocation: 'Dubai, UAE' },
  ])
}

function testLimitAndOrderPreserved() {
  const rows = []
  for (let i = 1; i <= 8; i += 1) {
    rows.push({
      business_category: `Category ${i}`,
      public_location: `City ${i}`,
    })
  }
  const out = buildCoverageMarkets(rows, 6)
  assert.equal(out.length, 6)
  assert.equal(out[0].businessCategory, 'Category 1')
  assert.equal(out[5].businessCategory, 'Category 6')
}

function testSourceLikeRowsNotAssumed() {
  // Helper only receives anonymised rows from caller; ensure no displayName/domain leakage shape
  const out = buildCoverageMarkets([
    {
      business_category: 'Digital Marketing',
      public_location: 'Pune, India',
      public_display_name: 'Think Big Digital',
      public_domain: 'thinkbigdigital.co',
    },
  ])
  assert.deepEqual(Object.keys(out[0]).sort(), ['businessCategory', 'publicLocation'])
  assert.ok(!('displayName' in out[0]))
  assert.ok(!('domain' in out[0]))
}

testCurrentProductionShape()
testDeduplication()
testEmptyExcluded()
testCategoryOrLocationOnly()
testLimitAndOrderPreserved()
testSourceLikeRowsNotAssumed()
console.log(
  JSON.stringify({
    ok: true,
    tests: [
      'production-shape',
      'dedupe',
      'empty-excluded',
      'partial-fields',
      'limit-order',
      'no-identity-leak',
    ],
  })
)

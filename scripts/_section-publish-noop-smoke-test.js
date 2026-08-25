/**
 * Regression: published + identical sections → no-op; changed → not no-op.
 * Run: npx tsx scripts/_section-publish-noop-smoke-test.js
 */
const assert = require('assert')
const {
  anonymizedSectionsEqual,
  shouldNoOpPublishedSectionSave,
  toSectionStringMap,
} = require('../lib/anonymize/sectionDraftCompare.ts')

const base = {
  executiveBusinessAssessment: 'Hello world.',
  searchAsGrowthChannel: 'Growth notes.',
}

assert.equal(anonymizedSectionsEqual(base, { ...base }), true)
assert.equal(
  anonymizedSectionsEqual(base, {
    searchAsGrowthChannel: 'Growth notes.',
    executiveBusinessAssessment: 'Hello world.',
  }),
  true
)
assert.equal(
  anonymizedSectionsEqual(base, {
    ...base,
    executiveBusinessAssessment: 'Changed.',
  }),
  false
)
assert.equal(anonymizedSectionsEqual(null, base), false)
assert.deepEqual(toSectionStringMap({ a: 1, b: 'x' }), { a: '1', b: 'x' })

assert.equal(
  shouldNoOpPublishedSectionSave({
    anonymizationStatus: 'published',
    useAsSample: true,
    storedSections: base,
    incomingSections: { ...base },
    residualCount: 0,
  }),
  true
)

assert.equal(
  shouldNoOpPublishedSectionSave({
    anonymizationStatus: 'published',
    useAsSample: true,
    storedSections: base,
    incomingSections: { ...base, executiveBusinessAssessment: 'Edited.' },
    residualCount: 0,
  }),
  false
)

assert.equal(
  shouldNoOpPublishedSectionSave({
    anonymizationStatus: 'published',
    useAsSample: true,
    storedSections: base,
    incomingSections: { ...base },
    residualCount: 1,
  }),
  false
)

assert.equal(
  shouldNoOpPublishedSectionSave({
    anonymizationStatus: 'ready',
    useAsSample: false,
    storedSections: base,
    incomingSections: { ...base },
    residualCount: 0,
  }),
  false
)

assert.equal(
  shouldNoOpPublishedSectionSave({
    anonymizationStatus: 'published',
    useAsSample: false,
    storedSections: base,
    incomingSections: { ...base },
    residualCount: 0,
  }),
  false
)

console.log(
  JSON.stringify({
    ok: true,
    tests: [
      'equal-same',
      'equal-key-order',
      'unequal-content',
      'noop-published-identical',
      'noop-published-changed',
      'noop-residual',
      'noop-ready',
      'noop-not-use-as-sample',
    ],
  })
)

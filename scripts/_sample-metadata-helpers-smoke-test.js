/**
 * Smoke tests for anonymised sample metadata helpers.
 * Run: npx tsx scripts/_sample-metadata-helpers-smoke-test.js
 */
const assert = require('assert')
const {
  sanitizeSuggestedMetadata,
  mergeSuggestedMetadata,
  needsMetadataSuggestion,
  missingMetadataMessages,
  deriveSlugFromLabel,
  isUnsafeGenericLabel,
} = require('../lib/anonymize/sampleMetadataHelpers.ts')

assert.equal(deriveSlugFromLabel('B2B Digital Services Company'), 'b2b-digital-services-company')

assert.equal(
  isUnsafeGenericLabel('imaginnovation.co Services', 'https://www.imaginnovation.co'),
  true
)
assert.equal(
  isUnsafeGenericLabel('Imaginnovation Agency', 'https://imaginnovation.co'),
  true
)
assert.equal(
  isUnsafeGenericLabel('B2B Digital Services Company', 'https://imaginnovation.co'),
  false
)

const sanitized = sanitizeSuggestedMetadata(
  {
    genericLabel: 'www.imaginnovation.co',
    businessCategory: 'Digital Marketing',
    publicLocation: 'Pune, India',
  },
  'https://imaginnovation.co'
)
assert.equal(sanitized.genericLabel, null)
assert.equal(sanitized.businessCategory, 'Digital Marketing')
assert.equal(sanitized.publicLocation, 'Pune, India')

const merged = mergeSuggestedMetadata(
  {
    genericLabel: 'Existing Label',
    businessCategory: '',
    publicLocation: 'Pune, India',
  },
  {
    genericLabel: 'Should Not Overwrite',
    businessCategory: 'SaaS Technology',
    publicLocation: 'Should Not Overwrite',
  }
)
assert.equal(merged.genericLabel, 'Existing Label')
assert.equal(merged.businessCategory, 'SaaS Technology')
assert.equal(merged.publicLocation, 'Pune, India')

assert.equal(
  needsMetadataSuggestion({
    genericLabel: 'A',
    businessCategory: 'B',
    publicLocation: 'C',
  }),
  false
)
assert.equal(
  needsMetadataSuggestion({
    genericLabel: 'A',
    businessCategory: '',
    publicLocation: 'C',
  }),
  true
)

const msgs = missingMetadataMessages({
  genericLabel: 'ok',
  businessCategory: 'ok',
  publicLocation: '',
})
assert.equal(msgs.length, 1)
assert.ok(/Public location/i.test(msgs[0]))

console.log(
  JSON.stringify({
    ok: true,
    tests: ['slug', 'unsafe-label', 'sanitize', 'merge-partial', 'needs', 'messages'],
  })
)

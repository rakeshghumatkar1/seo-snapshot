/**
 * Smoke tests for homepage sample preview excerpts.
 * Run: npx tsx scripts/_sample-preview-excerpt-smoke-test.js
 */
const assert = require('assert')
const { deriveSamplePreviewText } = require('../lib/public/samplePreviewExcerpt.ts')

const detailed = {
  executiveBusinessAssessment:
    'The business presents itself as a well-structured digital agency specializing in AI and automation for B2B clients across multiple markets.',
  searchAsGrowthChannel: 'Search engines represent a vital channel for growth.',
}

const excerpt = deriveSamplePreviewText(detailed, { reportType: 'detailed' })
assert.ok(excerpt)
assert.ok(excerpt.startsWith('The business presents itself'))
assert.ok(excerpt.length <= 210)

const skippedDisclosure = deriveSamplePreviewText(
  {
    executiveBusinessAssessment: 'Identifying business details have been anonymised.',
    searchAsGrowthChannel:
      'Search engines represent a vital channel for the company to attract operators and founders looking for practical software solutions across industries.',
  },
  { reportType: 'detailed' }
)
assert.ok(skippedDisclosure)
assert.ok(skippedDisclosure.startsWith('Search engines'))
assert.ok(!/anonymis/i.test(skippedDisclosure))

assert.equal(deriveSamplePreviewText({}), null)
assert.equal(deriveSamplePreviewText(null), null)
assert.equal(deriveSamplePreviewText({ intro: 'Too short.' }), null)

const snapshot = deriveSamplePreviewText(
  {
    businessCustomerUnderstanding:
      'This organisation serves homeowners and small commercial clients with clear service packaging and local market intent signals across the website.',
  },
  { reportType: 'snapshot' }
)
assert.ok(snapshot && snapshot.includes('homeowners'))

const long =
  'A'.repeat(40) +
  ' ' +
  'word '.repeat(80)
const truncated = deriveSamplePreviewText(
  { executiveBusinessAssessment: long },
  { reportType: 'detailed', maxChars: 180 }
)
assert.ok(truncated)
assert.ok(truncated.endsWith('…'))
assert.ok(truncated.length <= 185)

console.log(
  JSON.stringify({
    ok: true,
    tests: [
      'detailed-first-section',
      'skip-disclosure',
      'empty',
      'short',
      'snapshot',
      'truncate',
    ],
  })
)

/**
 * Smoke tests for Admin reports filter parsing helpers.
 * Run: npx tsx scripts/_admin-report-filters-smoke-test.js
 */
const assert = require('assert')
const {
  parseReportTypeFilter,
  parsePdfFilter,
  parseSampleFilter,
  parseDateFilter,
  parseSortPreset,
  parseLimit,
  dateFilterCutoffUtc,
  sortPresetToSql,
  deriveSampleStatus,
} = require('../lib/admin/reportFilters.ts')

assert.equal(parseReportTypeFilter('detailed'), 'detailed')
assert.equal(parseReportTypeFilter('nope'), 'all')
assert.equal(parsePdfFilter('stored'), 'stored')
assert.equal(parsePdfFilter('x'), 'all')
assert.equal(parseSampleFilter('published'), 'published')
assert.equal(parseSampleFilter('draft'), 'draft')
assert.equal(parseDateFilter('7d'), '7d')
assert.equal(parseSortPreset('website_asc'), 'website_asc')
assert.equal(parseSortPreset(''), 'newest')
assert.equal(parseLimit('50'), 50)
assert.equal(parseLimit('999'), 20)

const now = new Date('2026-08-25T15:00:00.000Z')
assert.equal(dateFilterCutoffUtc('all', now), null)
assert.equal(
  dateFilterCutoffUtc('today', now)?.toISOString(),
  '2026-08-25T00:00:00.000Z'
)
assert.equal(
  dateFilterCutoffUtc('7d', now)?.toISOString(),
  '2026-08-18T15:00:00.000Z'
)

assert.deepEqual(sortPresetToSql('newest'), { column: 'r.created_at', direction: 'DESC' })
assert.deepEqual(sortPresetToSql('oldest'), { column: 'r.created_at', direction: 'ASC' })

assert.equal(
  deriveSampleStatus({
    sample_content_mode: 'anonymized',
    anonymization_status: 'published',
    use_as_sample: true,
    has_anonymized_sections: true,
  }),
  'published'
)
assert.equal(
  deriveSampleStatus({
    sample_content_mode: 'anonymized',
    anonymization_status: 'ready',
    use_as_sample: false,
    has_anonymized_sections: true,
  }),
  'draft'
)
assert.equal(
  deriveSampleStatus({
    sample_content_mode: 'anonymized',
    anonymization_status: 'needs_review',
    use_as_sample: false,
    has_anonymized_sections: true,
  }),
  'needs_review'
)
assert.equal(
  deriveSampleStatus({
    sample_content_mode: 'source',
    anonymization_status: 'none',
    use_as_sample: false,
    has_anonymized_sections: false,
  }),
  'none'
)

console.log(JSON.stringify({ ok: true, tests: ['parse', 'date', 'sort', 'sample-status'] }))

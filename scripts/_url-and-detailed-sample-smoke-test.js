/**
 * Smoke tests for public website URL normalization + Detailed-only sample rules.
 * Run: npx tsx scripts/_url-and-detailed-sample-smoke-test.js
 */
const assert = require('assert')
const {
  normalizePublicWebsiteInput,
  WEBSITE_URL_INVALID_MESSAGE,
} = require('../lib/url/publicWebsiteInput.ts')
const {
  isDetailedReportType,
  PUBLIC_SAMPLE_DETAILED_ONLY_MESSAGE,
} = require('../lib/homepage/publicSampleRules.ts')

const ok = [
  ['onlyforrecruiters.com', 'https://onlyforrecruiters.com'],
  ['www.onlyforrecruiters.com', 'https://www.onlyforrecruiters.com'],
  ['onlyforrecruiters.com/home-v2', 'https://onlyforrecruiters.com/home-v2'],
  ['https://onlyforrecruiters.com', 'https://onlyforrecruiters.com'],
  ['http://onlyforrecruiters.com', 'http://onlyforrecruiters.com'],
  ['  onlyforrecruiters.com  ', 'https://onlyforrecruiters.com'],
]

for (const [input, expected] of ok) {
  assert.strictEqual(
    normalizePublicWebsiteInput(input),
    expected,
    `normalize(${JSON.stringify(input)})`
  )
}

for (const input of ['hello', 'abc', '://broken', 'https://', '', '   ', 'http://']) {
  assert.throws(
    () => normalizePublicWebsiteInput(input),
    (err) => err && err.message === WEBSITE_URL_INVALID_MESSAGE,
    `reject(${JSON.stringify(input)})`
  )
}

assert.equal(isDetailedReportType('detailed'), true)
assert.equal(isDetailedReportType('snapshot'), false)
assert.equal(isDetailedReportType('DETAILED'), true)
assert.ok(PUBLIC_SAMPLE_DETAILED_ONLY_MESSAGE.includes('Detailed'))

console.log('PASS: URL normalization + Detailed-only sample rule helpers')

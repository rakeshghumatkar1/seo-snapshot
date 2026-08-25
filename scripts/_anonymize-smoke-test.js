const assert = require('assert')
const {
  detectIdentifiers,
  runDeterministicPrivacyScan,
  scanSectionsForIdentifiers,
} = require('../lib/anonymize/privacyScan.ts')
const {
  validateAnonymizedStructure,
  parseJsonObject,
  expectedSectionKeys,
} = require('../lib/anonymize/structure.ts')
const {
  SNAPSHOT_V3_SECTION_LABELS,
  DETAILED_V3_SECTION_LABELS,
} = require('../lib/report/sectionLabels.ts')

function testPrivacyDetection() {
  const site = 'https://www.example.com/services'
  const cases = [
    'example.com',
    'www.example.com',
    'https://example.com',
    'https://www.example.com/services',
    'person@example.com',
    '+1 555 123 4567',
    '+91 98765 43210',
  ]
  for (const text of cases) {
    const hits = detectIdentifiers(text, site)
    assert.ok(hits.length > 0, `expected hit for ${text}`)
  }

  const cleaned = runDeterministicPrivacyScan(
    {
      a: 'Visit https://www.example.com/services and email person@example.com or call +1 555 123 4567',
    },
    site
  )
  assert.equal(cleaned.passed, true)
  assert.ok(!/example\.com/i.test(cleaned.cleanedSections.a))
  assert.ok(!/person@/i.test(cleaned.cleanedSections.a))
}

function testStructureSnapshot() {
  const keys = Object.keys(SNAPSHOT_V3_SECTION_LABELS)
  assert.equal(keys.length, 10)
  const source = Object.fromEntries(keys.map((k) => [k, `Source content for ${k}`]))
  const good = Object.fromEntries(keys.map((k) => [k, `Anon content for ${k}`]))
  const ok = validateAnonymizedStructure({ sections: good }, keys, source)
  assert.equal(ok.valid, true)

  const missing = { ...good }
  delete missing[keys[0]]
  const badMissing = validateAnonymizedStructure({ sections: missing }, keys, source)
  assert.equal(badMissing.valid, false)

  const wrongKey = { ...good, unexpectedKey: 'x' }
  delete wrongKey[keys[1]]
  const badKey = validateAnonymizedStructure({ sections: wrongKey }, keys, source)
  assert.equal(badKey.valid, false)

  const nonString = { ...good, [keys[2]]: 123 }
  const badType = validateAnonymizedStructure({ sections: nonString }, keys, source)
  assert.equal(badType.valid, false)

  assert.equal(parseJsonObject('not json'), null)
  assert.ok(parseJsonObject('{"sections":{}}'))
}

function testStructureDetailed() {
  const keys = Object.keys(DETAILED_V3_SECTION_LABELS)
  assert.equal(keys.length, 16)
  const source = Object.fromEntries(keys.map((k) => [k, `Source ${k}`]))
  const good = Object.fromEntries(keys.map((k) => [k, `Anon ${k}`]))
  const ok = validateAnonymizedStructure({ sections: good }, keys, source)
  assert.equal(ok.valid, true)
  assert.equal(expectedSectionKeys(source, 'detailed', 3).length, 16)
}

function testNoSourceLeakScan() {
  const site = 'https://acme-widgets.io'
  const sections = {
    executiveBusinessAssessment: 'A B2B services company in Pune offers automation.',
  }
  const hits = scanSectionsForIdentifiers(sections, site)
  assert.equal(hits.length, 0)
}

testPrivacyDetection()
testStructureSnapshot()
testStructureDetailed()
testNoSourceLeakScan()
console.log(JSON.stringify({ ok: true, tests: ['privacy', 'snapshot-10', 'detailed-16', 'no-leak'] }))

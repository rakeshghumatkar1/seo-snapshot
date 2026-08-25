/**
 * Smoke tests for anonymised business-reference normalisation + homepage sample preference.
 * Run: node --experimental-strip-types scripts/_normalize-business-refs-smoke-test.js
 */
const assert = require('assert')
const {
  normalizeAnonymizedBusinessReferenceText,
  normalizeAnonymizedBusinessReferences,
  countGenericLabelOccurrences,
  preferAnonymizedHomepageSamples,
} = require('../lib/anonymize/normalizeBusinessReferences.ts')

const LABEL = 'B2B Digital Services Company'

function testCoreReplacements() {
  assert.equal(
    normalizeAnonymizedBusinessReferenceText(
      `The ${LABEL} appears strong.`,
      LABEL
    ),
    'The business appears strong.'
  )

  assert.equal(
    normalizeAnonymizedBusinessReferenceText(
      `The ${LABEL}'s website is clear.`,
      LABEL
    ),
    "The business's website is clear."
  )

  assert.equal(
    normalizeAnonymizedBusinessReferenceText(
      `Clients of the ${LABEL} may benefit from clearer messaging.`,
      LABEL
    ),
    'Clients of the business may benefit from clearer messaging.'
  )

  assert.equal(
    normalizeAnonymizedBusinessReferenceText(
      `${LABEL} should improve on-page clarity.`,
      LABEL
    ),
    'the business should improve on-page clarity.'
  )
}

function testPartialWordsUntouched() {
  const text =
    'Their digital services offering and company structure remain competitive in the market.'
  assert.equal(normalizeAnonymizedBusinessReferenceText(text, LABEL), text)
}

function testGrammarCleanup() {
  // Bare replace after article already consumed should not leave broken possessives
  const possessive = normalizeAnonymizedBusinessReferenceText(
    `Review the ${LABEL}'s's homepage next.`,
    LABEL
  )
  assert.ok(!/business's's/i.test(possessive))
  assert.ok(/business's homepage/i.test(possessive))
}

function testSectionsAndCount() {
  const sections = {
    a: `The ${LABEL} appears strong.`,
    b: `Clients of the ${LABEL} may benefit.`,
    c: 'Unrelated digital services and company structure notes.',
  }
  const cleaned = normalizeAnonymizedBusinessReferences(sections, LABEL)
  assert.equal(countGenericLabelOccurrences(cleaned, LABEL), 0)
  assert.equal(cleaned.a, 'The business appears strong.')
  assert.equal(cleaned.b, 'Clients of the business may benefit.')
  assert.equal(cleaned.c, sections.c)
}

function testHomepagePreference() {
  const anonymized = [{ slug: 'anon-1' }]
  const source = [{ slug: 'think-big-digital-seo-growth' }]
  assert.deepEqual(preferAnonymizedHomepageSamples(anonymized, source), anonymized)
  assert.deepEqual(preferAnonymizedHomepageSamples([], source), source)
}

testCoreReplacements()
testPartialWordsUntouched()
testGrammarCleanup()
testSectionsAndCount()
testHomepagePreference()
console.log(
  JSON.stringify({
    ok: true,
    tests: [
      'core-replacements',
      'partial-words',
      'grammar',
      'sections-count',
      'homepage-preference',
    ],
  })
)

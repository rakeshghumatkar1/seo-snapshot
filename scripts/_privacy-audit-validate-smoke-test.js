/**
 * Focused privacy-audit validation + brand-phrase scan smoke tests.
 * Run: node scripts/_privacy-audit-validate-smoke-test.js
 */
const assert = require('assert')
const {
  applyValidatedPrivacyAudit,
  filterSupportedPrivacyIssues,
  sectionContainsIssueText,
} = require('../lib/anonymize/privacyAuditValidate.ts')
const {
  brandPhraseVariantsFromWebsite,
  detectIdentifiers,
  runDeterministicPrivacyScan,
} = require('../lib/anonymize/privacyScan.ts')
const {
  normalizeAnonymizedBusinessReferences,
} = require('../lib/anonymize/normalizeBusinessReferences.ts')

function testUnsupportedAiIssueDiscarded() {
  const candidate = {
    executiveBusinessAssessment: 'The business has a robust online presence.',
  }
  const { supported, discarded } = filterSupportedPrivacyIssues(
    [
      {
        section: 'executiveBusinessAssessment',
        text: 'Continuum Associates',
        reason: 'Mention of the specific company name.',
      },
    ],
    candidate
  )
  assert.equal(supported.length, 0)
  assert.equal(discarded.length, 1)

  const validated = applyValidatedPrivacyAudit(
    {
      safe: false,
      issues: [
        {
          section: 'executiveBusinessAssessment',
          text: 'Continuum Associates',
          reason: 'Mention of the specific company name.',
        },
      ],
    },
    candidate,
    true
  )
  assert.equal(validated.safe, true)
  assert.equal(validated.issues.length, 0)
}

function testExactCompanyNameBlocks() {
  const candidate = {
    executiveBusinessAssessment: 'Continuum Associates delivers energy consulting.',
  }
  const validated = applyValidatedPrivacyAudit(
    {
      safe: false,
      issues: [
        {
          section: 'executiveBusinessAssessment',
          text: 'Continuum Associates',
          reason: 'Original company name remains.',
        },
      ],
    },
    candidate,
    true
  )
  assert.equal(validated.safe, false)
  assert.equal(validated.issues[0].text, 'Continuum Associates')
  assert.ok(sectionContainsIssueText(candidate.executiveBusinessAssessment, 'Continuum Associates'))
}

function testDomainDeterministicBlock() {
  const site = 'https://www.continuum-associates.com'
  const hits = detectIdentifiers(
    'Visit continuum-associates.com for details',
    site
  )
  assert.ok(hits.some((h) => h.type === 'host' || h.type === 'brand'))

  const scan = runDeterministicPrivacyScan(
    { a: 'See continuum associates and continuum-associates.com' },
    site
  )
  assert.equal(scan.passed, true)
  assert.ok(!/continuum[-\s]associates/i.test(scan.cleanedSections.a))
}

function testGenericLabelAllowed() {
  const label = 'Global Energy Consulting Firm'
  const candidate = {
    a: `The business serves industrial clients. Category stays public metadata elsewhere.`,
  }
  // Label in prose gets normalized away; audit must not treat label as leak when approved
  const withLabel = {
    a: `${label} appears once as a leftover.`,
  }
  const normalized = normalizeAnonymizedBusinessReferences(withLabel, label)
  assert.ok(!normalized.a.includes(label))

  const validated = applyValidatedPrivacyAudit(
    {
      safe: false,
      issues: [
        {
          section: 'a',
          text: label,
          reason: 'Looks like a company name.',
        },
      ],
    },
    normalized,
    true
  )
  // After normalize the label is gone, so unsupported → safe
  assert.equal(validated.safe, true)

  // Brand phrases must not over-match single tokens
  const brands = brandPhraseVariantsFromWebsite('https://continuum-associates.com')
  assert.ok(brands.includes('continuum-associates'))
  assert.ok(brands.includes('continuum associates'))
  assert.ok(!brands.includes('continuum'))
  assert.ok(!brands.includes('associates'))
  assert.equal(detectIdentifiers('Energy consulting continuum work', 'https://continuum-associates.com').length, 0)
}

function testFinalNormalizedDiffersFromPreNormalize() {
  const label = 'Global Energy Consulting Firm'
  const pre = {
    executiveBusinessAssessment: `${label} has a robust online presence.`,
  }
  const normalized = normalizeAnonymizedBusinessReferences(pre, label)
  assert.notEqual(pre.executiveBusinessAssessment, normalized.executiveBusinessAssessment)
  assert.ok(/the business/i.test(normalized.executiveBusinessAssessment))

  // Hallucinated source-name issue against normalized text must be discarded
  const validated = applyValidatedPrivacyAudit(
    {
      safe: false,
      issues: [
        {
          section: 'executiveBusinessAssessment',
          text: 'Continuum Associates',
          reason: 'Mention of the specific company name.',
        },
      ],
    },
    normalized,
    true
  )
  assert.equal(validated.safe, true)
}

function testRecheckSemanticsCleanVsLeak() {
  const clean = {
    a: 'The business has a robust online presence for energy consulting clients.',
  }
  const cleanResult = applyValidatedPrivacyAudit(
    {
      safe: false,
      issues: [
        { section: 'a', text: 'Continuum Associates', reason: 'Name leak' },
        { section: 'a', text: '', reason: 'Mention of the specific company name.' },
      ],
    },
    clean,
    true
  )
  assert.equal(cleanResult.safe, true, 'clean re-check → ready semantics')

  const leak = {
    a: 'Continuum Associates has a robust online presence.',
  }
  const leakResult = applyValidatedPrivacyAudit(
    {
      safe: false,
      issues: [
        { section: 'a', text: 'Continuum Associates', reason: 'Original company name remains.' },
      ],
    },
    leak,
    true
  )
  assert.equal(leakResult.safe, false, 'real leak re-check → needs_review')
  assert.equal(leakResult.issues[0].text, 'Continuum Associates')
}

function main() {
  testUnsupportedAiIssueDiscarded()
  testExactCompanyNameBlocks()
  testDomainDeterministicBlock()
  testGenericLabelAllowed()
  testFinalNormalizedDiffersFromPreNormalize()
  testRecheckSemanticsCleanVsLeak()
  console.log(
    JSON.stringify({
      ok: true,
      tests: [
        'unsupported-ai-issue-discarded',
        'exact-company-name-blocks',
        'domain-deterministic',
        'generic-label-allowed',
        'final-normalized-differs',
        'recheck-clean-vs-leak',
      ],
    })
  )
}

main()

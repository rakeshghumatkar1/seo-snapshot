/**
 * Snapshot V3 targeted auto-repair structural smoke tests (no network / no AI).
 * Run: npx tsx scripts/smoke-snapshot-auto-repair.ts
 */
import {
  SNAPSHOT_SECTION_MARKERS_V3,
  validateSnapshotMarkers,
} from '../lib/ai/parseReportV3'
import {
  mergeSnapshotRepairSections,
  shouldRetrySnapshotForMissingMarkers,
} from '../lib/ai/generateSnapshotReport'
import { buildSnapshotRepairSuffix } from '../lib/ai/prompts/snapshotPrompt'
import { isValidSnapshotV3Prompt } from '../lib/ai/prompts/promptValidation'

function buildFixture(omit: string[] = []): string {
  return SNAPSHOT_SECTION_MARKERS_V3.map((marker) => {
    if (omit.includes(marker)) return ''
    return `${marker}\nPlaceholder body for structural validation only. This text is long enough to pass length checks if needed later.\n`
  }).join('\n')
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

function sameMembers(actual: string[], expected: string[]) {
  if (actual.length !== expected.length) return false
  const set = new Set(actual)
  return expected.every((m) => set.has(m))
}

// TEST A — COMPLETE RESPONSE
const complete = buildFixture()
const checkA = shouldRetrySnapshotForMissingMarkers(complete)
assert(checkA.retry === false, 'TEST A: retry should be false for complete response')
assert(checkA.missing.length === 0, 'TEST A: missing should be empty')
assert(validateSnapshotMarkers(complete).valid === true, 'TEST A: markers valid')

// TEST B — EXACT CURRENT PRODUCTION FAILURE SHAPE
const prodFailure = buildFixture(['AI_DISCOVERY_READINESS:'])
const checkB = shouldRetrySnapshotForMissingMarkers(prodFailure)
assert(checkB.retry === true, 'TEST B: retry should be true for production failure')
assert(
  checkB.missing.length === 1 && checkB.missing[0] === 'AI_DISCOVERY_READINESS:',
  `TEST B: missing mismatch: ${checkB.missing.join('|')}`
)

// TEST C — MULTIPLE MARKERS MISSING
const multiMissing = buildFixture([
  'TRADITIONAL_SEARCH_READINESS:',
  'AI_DISCOVERY_READINESS:',
])
const checkC = shouldRetrySnapshotForMissingMarkers(multiMissing)
assert(
  sameMembers(checkC.missing, [
    'TRADITIONAL_SEARCH_READINESS:',
    'AI_DISCOVERY_READINESS:',
  ]),
  `TEST C: missing mismatch: ${checkC.missing.join('|')}`
)

// TEST D — REPAIR PROMPT ASKS ONLY FOR MISSING SECTION(S)
const repairSuffix = buildSnapshotRepairSuffix(checkC.missing)
assert(
  repairSuffix.includes('Return ONLY the missing section(s)') &&
    repairSuffix.includes('TRADITIONAL_SEARCH_READINESS:') &&
    repairSuffix.includes('AI_DISCOVERY_READINESS:'),
  'TEST D: targeted repair suffix is incomplete'
)

// TEST E — TARGETED REPAIR MERGES INTO ORIGINAL IN CANONICAL ORDER
const targetedRepair = [
  'TRADITIONAL_SEARCH_READINESS:',
  'Repaired traditional search readiness body with enough grounded detail for structural testing.',
  '',
  'AI_DISCOVERY_READINESS:',
  'Repaired AI discovery readiness body with enough grounded detail for structural testing.',
].join('\n')

const merged = mergeSnapshotRepairSections(multiMissing, targetedRepair, checkC.missing)
assert(!!merged, 'TEST E: targeted repair should merge')
assert(validateSnapshotMarkers(merged || '').valid, 'TEST E: merged report must contain all markers')
assert(
  SNAPSHOT_SECTION_MARKERS_V3.every((marker, index, markers) =>
    index === 0 || (merged || '').indexOf(markers[index - 1]) < (merged || '').indexOf(marker)
  ),
  'TEST E: merged markers must be in canonical order'
)

// TEST F — INCOMPLETE TARGETED REPAIR FAILS CLOSED
const incompleteRepair = 'AI_DISCOVERY_READINESS:\nOnly one repaired section.'
assert(
  mergeSnapshotRepairSections(multiMissing, incompleteRepair, checkC.missing) === null,
  'TEST F: incomplete repair must return null'
)

// TEST G — DB SNAPSHOT PROMPT VALIDATION REQUIRES ALL 10 MARKERS
assert(isValidSnapshotV3Prompt(complete), 'TEST G: complete V3 prompt should validate')
assert(
  !isValidSnapshotV3Prompt(buildFixture(['ENQUIRY_READINESS:'])),
  'TEST G: prompt missing any required marker must be rejected'
)

console.log(
  JSON.stringify({
    ok: true,
    tests: [
      'A-complete',
      'B-current-prod-failure',
      'C-multiple-missing',
      'D-targeted-repair-prompt',
      'E-targeted-repair-merge',
      'F-incomplete-repair-fails',
      'G-db-prompt-all-markers',
    ],
    markerCount: SNAPSHOT_SECTION_MARKERS_V3.length,
  })
)

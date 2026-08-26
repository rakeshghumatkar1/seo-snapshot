/**
 * Snapshot V3 Auto-Repair structural smoke tests (no network / no AI).
 * Run: npx tsx scripts/smoke-snapshot-auto-repair.ts
 */
import {
  SNAPSHOT_SECTION_MARKERS_V3,
  validateSnapshotMarkers,
} from '../lib/ai/parseReportV3'
import { shouldRetrySnapshotForMissingMarkers } from '../lib/ai/generateSnapshotReport'
import { buildSnapshotRepairSuffix } from '../lib/ai/prompts/snapshotPrompt'

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

// TEST B — EXACT PRODUCTION FAILURE SHAPE
const prodFailure = buildFixture([
  'TRADITIONAL_SEARCH_READINESS:',
  'AI_DISCOVERY_READINESS:',
])
const checkB = shouldRetrySnapshotForMissingMarkers(prodFailure)
assert(checkB.retry === true, 'TEST B: retry should be true for prod failure shape')
assert(
  sameMembers(checkB.missing, [
    'TRADITIONAL_SEARCH_READINESS:',
    'AI_DISCOVERY_READINESS:',
  ]),
  `TEST B: missing mismatch: ${checkB.missing.join('|')}`
)

// TEST C — ONE MARKER MISSING
const oneMissing = buildFixture(['ENQUIRY_READINESS:'])
const checkC = shouldRetrySnapshotForMissingMarkers(oneMissing)
assert(checkC.retry === true, 'TEST C: retry should be true')
assert(
  checkC.missing.length === 1 && checkC.missing[0] === 'ENQUIRY_READINESS:',
  `TEST C: expected ENQUIRY_READINESS: got ${checkC.missing.join('|')}`
)

// TEST D — MULTIPLE MARKERS MISSING
const multiMissing = buildFixture([
  'SEARCH_OPPORTUNITY:',
  'TRUST_REPUTATION:',
  'LIMITS_NEXT_STEP:',
])
const checkD = shouldRetrySnapshotForMissingMarkers(multiMissing)
assert(checkD.retry === true, 'TEST D: retry should be true')
assert(
  sameMembers(checkD.missing, [
    'SEARCH_OPPORTUNITY:',
    'TRUST_REPUTATION:',
    'LIMITS_NEXT_STEP:',
  ]),
  `TEST D: missing mismatch: ${checkD.missing.join('|')}`
)

// TEST E — REPAIRED RESPONSE COMPLETE (structural path simulation)
const firstCheck = shouldRetrySnapshotForMissingMarkers(prodFailure)
assert(firstCheck.retry === true, 'TEST E: first response should request repair')
const repairSuffix = buildSnapshotRepairSuffix(firstCheck.missing)
assert(
  repairSuffix.includes('TRADITIONAL_SEARCH_READINESS:') &&
    repairSuffix.includes('AI_DISCOVERY_READINESS:') &&
    repairSuffix.includes('COMPLETE Snapshot'),
  'TEST E: repair suffix must name missing markers and demand full report'
)
const repaired = buildFixture()
const repairCheck = validateSnapshotMarkers(repaired)
assert(repairCheck.valid === true, 'TEST E: repaired response must pass validation')
assert(
  shouldRetrySnapshotForMissingMarkers(repaired).retry === false,
  'TEST E: repaired response must not request another retry'
)

// TEST F — REPAIR STILL INVALID (no third attempt implied by flow)
const stillBroken = buildFixture(['AI_DISCOVERY_READINESS:'])
const secondCheck = validateSnapshotMarkers(stillBroken)
assert(secondCheck.valid === false, 'TEST F: second response still invalid')
assert(
  secondCheck.missing.includes('AI_DISCOVERY_READINESS:'),
  'TEST F: still missing AI_DISCOVERY_READINESS:'
)
// Flow contract: after second failure, generator returns null — never a third AI call.

console.log(
  JSON.stringify({
    ok: true,
    tests: [
      'A-complete',
      'B-prod-failure-shape',
      'C-one-missing',
      'D-multi-missing',
      'E-repair-success',
      'F-repair-still-invalid',
    ],
    markerCount: SNAPSHOT_SECTION_MARKERS_V3.length,
  })
)

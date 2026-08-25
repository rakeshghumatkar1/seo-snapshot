import {
  DETAILED_SECTION_MARKERS_V3,
  validateDetailedMarkers,
} from '../lib/ai/parseReportV3'

function buildFixture(omit: string[] = []): string {
  return DETAILED_SECTION_MARKERS_V3.map((marker) => {
    if (omit.includes(marker)) return ''
    return `${marker}\nPlaceholder body for structural validation only. This text is long enough to pass length checks if needed later.\n`
  }).join('\n')
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

const all16 = buildFixture()
const checkA = validateDetailedMarkers(all16)
assert(checkA.valid === true, 'Example A should be valid')
assert(checkA.missing.length === 0, 'Example A should have no missing markers')
assert(checkA.valid, 'Example A should not trigger retry')

const omitTraditional = buildFixture(['TRADITIONAL_SEARCH_READINESS:'])
const checkB = validateDetailedMarkers(omitTraditional)
assert(checkB.valid === false, 'Example B should be invalid')
assert(
  checkB.missing.length === 1 && checkB.missing[0] === 'TRADITIONAL_SEARCH_READINESS:',
  `Example B missing mismatch: ${checkB.missing.join('|')}`
)
assert(!checkB.valid, 'Example B should select retry path')

const omitTwo = buildFixture([
  'TRADITIONAL_SEARCH_READINESS:',
  'LOCAL_SEARCH_READINESS:',
])
const checkC = validateDetailedMarkers(omitTwo)
assert(checkC.valid === false, 'Example C should be invalid')
assert(
  checkC.missing.length === 2 &&
    checkC.missing.includes('TRADITIONAL_SEARCH_READINESS:') &&
    checkC.missing.includes('LOCAL_SEARCH_READINESS:'),
  `Example C missing mismatch: ${checkC.missing.join('|')}`
)
assert(!checkC.valid, 'Example C should select retry path')

console.log('Detailed marker validation smoke tests passed')

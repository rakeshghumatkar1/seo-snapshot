import { DetailedSectionsV3, SnapshotSectionsV3 } from '@/types/reportV3'

type SnapshotKey = keyof SnapshotSectionsV3
type DetailedKey = keyof DetailedSectionsV3

const SNAPSHOT_KEYS: Array<[string, SnapshotKey]> = [
  ['BUSINESS_CUSTOMER_UNDERSTANDING:', 'businessCustomerUnderstanding'],
  ['SEARCH_OPPORTUNITY:', 'searchOpportunity'],
  ['WEBSITE_OFFER_CLARITY:', 'websiteOfferClarity'],
  ['TRUST_REPUTATION:', 'trustReputation'],
  ['TRADITIONAL_SEARCH_READINESS:', 'traditionalSearchReadiness'],
  ['AI_DISCOVERY_READINESS:', 'aiDiscoveryReadiness'],
  ['CUSTOMER_CONTENT_OPPORTUNITIES:', 'customerContentOpportunities'],
  ['ENQUIRY_READINESS:', 'enquiryReadiness'],
  ['TOP_PRIORITY_ACTIONS:', 'topPriorityActions'],
  ['LIMITS_NEXT_STEP:', 'limitsNextStep'],
]

const DETAILED_KEYS: Array<[string, DetailedKey]> = [
  ['EXECUTIVE_BUSINESS_ASSESSMENT:', 'executiveBusinessAssessment'],
  ['SEARCH_AS_GROWTH_CHANNEL:', 'searchAsGrowthChannel'],
  ['CUSTOMER_INTENT_DISCOVERY:', 'customerIntentDiscovery'],
  ['POSITIONING_OFFER_CLARITY:', 'positioningOfferClarity'],
  ['COMMERCIAL_PAGE_READINESS:', 'commercialPageReadiness'],
  ['CONTENT_INFORMATION_ASSETS:', 'contentInformationAssets'],
  ['AUTHORITY_REPUTATION_TRUST:', 'authorityReputationTrust'],
  ['TRADITIONAL_SEARCH_READINESS:', 'traditionalSearchReadiness'],
  ['AI_DISCOVERY_READINESS:', 'aiDiscoveryReadiness'],
  ['LOCAL_SEARCH_READINESS:', 'localSearchReadiness'],
  ['COMPETITIVE_SEARCH_EVIDENCE:', 'competitiveSearchEvidence'],
  ['CONVERSION_ENQUIRY_READINESS:', 'conversionEnquiryReadiness'],
  ['MEASUREMENT_LIMITATIONS:', 'measurementLimitations'],
  ['PRIORITY_INVESTMENT_PLAN:', 'priorityInvestmentPlan'],
  ['ACTION_ROADMAP:', 'actionRoadmap'],
  ['EVIDENCE_LIMITATIONS:', 'evidenceLimitations'],
]

export const SNAPSHOT_SECTION_MARKERS_V3 = SNAPSHOT_KEYS.map(([marker]) => marker)
export const DETAILED_SECTION_MARKERS_V3 = DETAILED_KEYS.map(([marker]) => marker)

export type MarkerValidation = {
  valid: boolean
  missing: string[]
}

export type DetailedMarkerValidation = MarkerValidation
export type SnapshotMarkerValidation = MarkerValidation

/** Structural check: all required Snapshot V3 markers present in raw text. */
export function validateSnapshotMarkers(raw: string): SnapshotMarkerValidation {
  const text = String(raw || '')
  const missing = SNAPSHOT_SECTION_MARKERS_V3.filter(marker => !text.includes(marker))
  return {
    valid: missing.length === 0,
    missing,
  }
}

/** Structural check: all required Detailed V3 markers present in raw text. */
export function validateDetailedMarkers(raw: string): DetailedMarkerValidation {
  const text = String(raw || '')
  const missing = DETAILED_SECTION_MARKERS_V3.filter(marker => !text.includes(marker))
  return {
    valid: missing.length === 0,
    missing,
  }
}

function extractSections<T extends string>(raw: string, keys: Array<[string, T]>): Record<T, string> {
  const result = {} as Record<T, string>
  const positions = keys
    .map(([marker, key]) => ({ marker, key, index: raw.indexOf(marker) }))
    .filter(item => item.index >= 0)
    .sort((a, b) => a.index - b.index)

  for (let i = 0; i < positions.length; i++) {
    const current = positions[i]
    const next = positions[i + 1]
    const start = current.index + current.marker.length
    const end = next ? next.index : raw.length
    result[current.key] = raw.slice(start, end).trim()
  }

  for (const [, key] of keys) {
    if (!(key in result)) result[key] = ''
  }

  return result
}

function hasEnoughContent(
  sections: Record<string, string>,
  minFilled: number,
  minChars: number
): boolean {
  const filled = Object.values(sections).filter(value => value.length >= minChars)
  return filled.length >= minFilled
}

export function parseSnapshotReportV3(raw: string): SnapshotSectionsV3 | null {
  const markerCheck = validateSnapshotMarkers(raw)
  if (!markerCheck.valid) {
    console.error('[ParserV3] Snapshot missing markers:', markerCheck.missing.join(', '))
    return null
  }

  const sections = extractSections(raw, SNAPSHOT_KEYS) as SnapshotSectionsV3
  const emptyBodies = SNAPSHOT_KEYS.filter(([, key]) => !sections[key]).map(([marker]) => marker)

  if (emptyBodies.length > 0) {
    console.error('[ParserV3] Snapshot empty section bodies:', emptyBodies.join(', '))
    return null
  }

  if (!hasEnoughContent(sections as unknown as Record<string, string>, 8, 40)) {
    console.error('[ParserV3] Snapshot content insufficient')
    return null
  }

  return sections
}

export function parseDetailedReportV3(raw: string): DetailedSectionsV3 | null {
  const markerCheck = validateDetailedMarkers(raw)
  if (!markerCheck.valid) {
    console.error('[ParserV3] Detailed missing markers:', markerCheck.missing.join(', '))
    return null
  }

  const sections = extractSections(raw, DETAILED_KEYS) as DetailedSectionsV3
  const emptyBodies = DETAILED_KEYS.filter(([, key]) => !sections[key]).map(([marker]) => marker)

  if (emptyBodies.length > 0) {
    console.error('[ParserV3] Detailed empty section bodies:', emptyBodies.join(', '))
    return null
  }

  if (!hasEnoughContent(sections as unknown as Record<string, string>, 12, 40)) {
    console.error('[ParserV3] Detailed content insufficient')
    return null
  }

  return sections
}

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

export function parseSnapshotReportV3(raw: string): SnapshotSectionsV3 {
  return extractSections(raw, SNAPSHOT_KEYS) as SnapshotSectionsV3
}

export function parseDetailedReportV3(raw: string): DetailedSectionsV3 {
  return extractSections(raw, DETAILED_KEYS) as DetailedSectionsV3
}

export const SNAPSHOT_SECTION_MARKERS_V3 = SNAPSHOT_KEYS.map(([marker]) => marker)
export const DETAILED_SECTION_MARKERS_V3 = DETAILED_KEYS.map(([marker]) => marker)

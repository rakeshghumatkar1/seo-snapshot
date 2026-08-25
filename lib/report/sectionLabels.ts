import type { SnapshotSectionsV2, DetailedSectionsV2 } from '@/types/report'
import type { SnapshotSectionsV3, DetailedSectionsV3 } from '@/types/reportV3'

export type SectionLabel = { category: string; title: string }

export const SNAPSHOT_V3_SECTION_LABELS: Record<keyof SnapshotSectionsV3, SectionLabel> = {
  businessCustomerUnderstanding: { category: 'BUSINESS', title: 'Business & Customer Understanding' },
  searchOpportunity: { category: 'OPPORTUNITY', title: 'Search Opportunity' },
  websiteOfferClarity: { category: 'CLARITY', title: 'Website & Offer Clarity' },
  trustReputation: { category: 'TRUST', title: 'Trust & Reputation' },
  traditionalSearchReadiness: { category: 'SEARCH', title: 'Traditional Search Readiness' },
  aiDiscoveryReadiness: { category: 'AI DISCOVERY', title: 'AI Discovery Readiness' },
  customerContentOpportunities: { category: 'CONTENT', title: 'Customer & Content Opportunities' },
  enquiryReadiness: { category: 'ENQUIRY', title: 'Enquiry Readiness' },
  topPriorityActions: { category: 'PRIORITIES', title: 'Top Priority Actions' },
  limitsNextStep: { category: 'NEXT STEP', title: 'Limits & Next Step' },
}

export const DETAILED_V3_SECTION_LABELS: Record<keyof DetailedSectionsV3, SectionLabel> = {
  executiveBusinessAssessment: { category: 'EXECUTIVE', title: 'Executive Business Assessment' },
  searchAsGrowthChannel: { category: 'GROWTH', title: 'Search as a Growth Channel' },
  customerIntentDiscovery: { category: 'CUSTOMER JOURNEY', title: 'Customer Intent & Discovery' },
  positioningOfferClarity: { category: 'POSITIONING', title: 'Positioning & Offer Clarity' },
  commercialPageReadiness: { category: 'COMMERCIAL PAGES', title: 'Commercial Page Readiness' },
  contentInformationAssets: { category: 'CONTENT', title: 'Content & Information Assets' },
  authorityReputationTrust: { category: 'TRUST', title: 'Authority, Reputation & Trust' },
  traditionalSearchReadiness: { category: 'SEARCH', title: 'Traditional Search Readiness' },
  aiDiscoveryReadiness: { category: 'AI DISCOVERY', title: 'AI Discovery Readiness' },
  localSearchReadiness: { category: 'LOCAL', title: 'Local Search Readiness' },
  competitiveSearchEvidence: { category: 'COMPETITION', title: 'Competitive Search Evidence' },
  conversionEnquiryReadiness: { category: 'CONVERSION', title: 'Conversion & Enquiry Readiness' },
  measurementLimitations: { category: 'MEASUREMENT', title: 'Measurement Limitations' },
  priorityInvestmentPlan: { category: 'PRIORITIES', title: 'Priority Investment Plan' },
  actionRoadmap: { category: 'ROADMAP', title: 'Action Roadmap' },
  evidenceLimitations: { category: 'EVIDENCE', title: 'Evidence & Limitations' },
}

export const SNAPSHOT_V2_SECTION_LABELS: Record<keyof SnapshotSectionsV2, SectionLabel> = {
  introduction: { category: 'OVERVIEW', title: 'Introduction' },
  whySeoMatters: { category: 'CONTEXT', title: 'Why SEO Matters for This Website' },
  firstImpression: { category: 'FIRST LOOK', title: 'First Impression of the Website' },
  contentVisibility: { category: 'CONTENT', title: 'Content & Visibility Observations' },
  competitorPresence: { category: 'COMPETITION', title: 'Competitor Presence' },
  keywordOpportunities: { category: 'KEYWORDS', title: 'Keyword & Topic Opportunities' },
  technicalObservations: { category: 'TECHNICAL', title: 'Technical & Structure Observations' },
  whatCanBeImproved: { category: 'IMPROVEMENTS', title: 'What Can Be Improved' },
  nextSteps: { category: 'ACTION', title: 'Next Steps' },
  conclusion: { category: 'SUMMARY', title: 'Conclusion' },
}

export const DETAILED_V2_SECTION_LABELS: Record<keyof DetailedSectionsV2, SectionLabel> = {
  introduction: { category: 'OVERVIEW', title: 'Introduction' },
  whySeoMatters: { category: 'CONTEXT', title: 'Why SEO Matters for This Website' },
  websitePositioning: { category: 'POSITIONING', title: 'Website Positioning Review' },
  contentStrategy: { category: 'CONTENT', title: 'Content Strategy Review' },
  competitorLandscape: { category: 'COMPETITION', title: 'Competitor Landscape' },
  keywordDirection: { category: 'KEYWORDS', title: 'Keyword Direction & Topic Opportunities' },
  technicalSignals: { category: 'TECHNICAL', title: 'Site Structure & Technical Signals' },
  authorityTrust: { category: 'AUTHORITY', title: 'Authority & Trust Signals' },
  seoRoadmap: { category: 'ROADMAP', title: 'SEO Roadmap' },
  detailedRecommendations: { category: 'RECOMMENDATIONS', title: 'Detailed Recommendations' },
  nextSteps: { category: 'ACTION', title: 'Next Steps & Further Analysis' },
  conclusion: { category: 'SUMMARY', title: 'Conclusion' },
}

const META_KEYS = new Set(['reportVersion'])

function orderedKeysForSections(sections: Record<string, unknown>): string[] | null {
  if (typeof sections.executiveBusinessAssessment === 'string') {
    return Object.keys(DETAILED_V3_SECTION_LABELS)
  }
  if (typeof sections.businessCustomerUnderstanding === 'string') {
    return Object.keys(SNAPSHOT_V3_SECTION_LABELS)
  }
  if (typeof sections.websitePositioning === 'string') {
    return Object.keys(DETAILED_V2_SECTION_LABELS)
  }
  if (typeof sections.introduction === 'string') {
    return Object.keys(SNAPSHOT_V2_SECTION_LABELS)
  }
  return null
}

export function getSectionLabel(
  key: string,
  reportType: 'snapshot' | 'detailed',
  version: 2 | 3
): SectionLabel {
  if (version === 3) {
    if (reportType === 'snapshot') {
      return (
        SNAPSHOT_V3_SECTION_LABELS[key as keyof SnapshotSectionsV3] || {
          category: key.toUpperCase(),
          title: key,
        }
      )
    }
    return (
      DETAILED_V3_SECTION_LABELS[key as keyof DetailedSectionsV3] || {
        category: key.toUpperCase(),
        title: key,
      }
    )
  }

  if (reportType === 'snapshot') {
    return (
      SNAPSHOT_V2_SECTION_LABELS[key as keyof SnapshotSectionsV2] || {
        category: key.toUpperCase(),
        title: key,
      }
    )
  }
  return (
    DETAILED_V2_SECTION_LABELS[key as keyof DetailedSectionsV2] || {
      category: key.toUpperCase(),
      title: key,
    }
  )
}

export function iterableSectionEntries(
  sections: Record<string, unknown>,
  reportType?: 'snapshot' | 'detailed',
  version?: 2 | 3
): Array<[string, string]> {
  const entries = Object.entries(sections).filter(([key, value]) => {
    if (META_KEYS.has(key)) return false
    return typeof value === 'string' && value.trim().length > 10
  }) as Array<[string, string]>

  let order: string[] | null = null
  if (version === 3 && reportType === 'detailed') order = Object.keys(DETAILED_V3_SECTION_LABELS)
  else if (version === 3 && reportType === 'snapshot') order = Object.keys(SNAPSHOT_V3_SECTION_LABELS)
  else if (version === 2 && reportType === 'detailed') order = Object.keys(DETAILED_V2_SECTION_LABELS)
  else if (version === 2 && reportType === 'snapshot') order = Object.keys(SNAPSHOT_V2_SECTION_LABELS)
  else order = orderedKeysForSections(sections)

  if (!order?.length) return entries

  const map = new Map(entries)
  const ordered: Array<[string, string]> = []
  for (const key of order) {
    const value = map.get(key)
    if (typeof value === 'string') {
      ordered.push([key, value])
      map.delete(key)
    }
  }
  for (const [key, value] of map) ordered.push([key, value])
  return ordered
}

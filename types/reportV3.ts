/** Active V3 Snapshot section fields */
export interface SnapshotSectionsV3 {
  businessCustomerUnderstanding: string
  searchOpportunity: string
  websiteOfferClarity: string
  trustReputation: string
  traditionalSearchReadiness: string
  aiDiscoveryReadiness: string
  customerContentOpportunities: string
  enquiryReadiness: string
  topPriorityActions: string
  limitsNextStep: string
}

/** Active V3 Detailed section fields */
export interface DetailedSectionsV3 {
  executiveBusinessAssessment: string
  searchAsGrowthChannel: string
  customerIntentDiscovery: string
  positioningOfferClarity: string
  commercialPageReadiness: string
  contentInformationAssets: string
  authorityReputationTrust: string
  traditionalSearchReadiness: string
  aiDiscoveryReadiness: string
  localSearchReadiness: string
  competitiveSearchEvidence: string
  conversionEnquiryReadiness: string
  measurementLimitations: string
  priorityInvestmentPlan: string
  actionRoadmap: string
  evidenceLimitations: string
}

export const SNAPSHOT_V3_KEYS = [
  'BUSINESS_CUSTOMER_UNDERSTANDING',
  'SEARCH_OPPORTUNITY',
  'WEBSITE_OFFER_CLARITY',
  'TRUST_REPUTATION',
  'TRADITIONAL_SEARCH_READINESS',
  'AI_DISCOVERY_READINESS',
  'CUSTOMER_CONTENT_OPPORTUNITIES',
  'ENQUIRY_READINESS',
  'TOP_PRIORITY_ACTIONS',
  'LIMITS_NEXT_STEP',
] as const

export const DETAILED_V3_KEYS = [
  'EXECUTIVE_BUSINESS_ASSESSMENT',
  'SEARCH_AS_GROWTH_CHANNEL',
  'CUSTOMER_INTENT_DISCOVERY',
  'POSITIONING_OFFER_CLARITY',
  'COMMERCIAL_PAGE_READINESS',
  'CONTENT_INFORMATION_ASSETS',
  'AUTHORITY_REPUTATION_TRUST',
  'TRADITIONAL_SEARCH_READINESS',
  'AI_DISCOVERY_READINESS',
  'LOCAL_SEARCH_READINESS',
  'COMPETITIVE_SEARCH_EVIDENCE',
  'CONVERSION_ENQUIRY_READINESS',
  'MEASUREMENT_LIMITATIONS',
  'PRIORITY_INVESTMENT_PLAN',
  'ACTION_ROADMAP',
  'EVIDENCE_LIMITATIONS',
] as const

export const SNAPSHOT_V3_FIELD_MAP: Record<(typeof SNAPSHOT_V3_KEYS)[number], keyof SnapshotSectionsV3> = {
  BUSINESS_CUSTOMER_UNDERSTANDING: 'businessCustomerUnderstanding',
  SEARCH_OPPORTUNITY: 'searchOpportunity',
  WEBSITE_OFFER_CLARITY: 'websiteOfferClarity',
  TRUST_REPUTATION: 'trustReputation',
  TRADITIONAL_SEARCH_READINESS: 'traditionalSearchReadiness',
  AI_DISCOVERY_READINESS: 'aiDiscoveryReadiness',
  CUSTOMER_CONTENT_OPPORTUNITIES: 'customerContentOpportunities',
  ENQUIRY_READINESS: 'enquiryReadiness',
  TOP_PRIORITY_ACTIONS: 'topPriorityActions',
  LIMITS_NEXT_STEP: 'limitsNextStep',
}

export const DETAILED_V3_FIELD_MAP: Record<(typeof DETAILED_V3_KEYS)[number], keyof DetailedSectionsV3> = {
  EXECUTIVE_BUSINESS_ASSESSMENT: 'executiveBusinessAssessment',
  SEARCH_AS_GROWTH_CHANNEL: 'searchAsGrowthChannel',
  CUSTOMER_INTENT_DISCOVERY: 'customerIntentDiscovery',
  POSITIONING_OFFER_CLARITY: 'positioningOfferClarity',
  COMMERCIAL_PAGE_READINESS: 'commercialPageReadiness',
  CONTENT_INFORMATION_ASSETS: 'contentInformationAssets',
  AUTHORITY_REPUTATION_TRUST: 'authorityReputationTrust',
  TRADITIONAL_SEARCH_READINESS: 'traditionalSearchReadiness',
  AI_DISCOVERY_READINESS: 'aiDiscoveryReadiness',
  LOCAL_SEARCH_READINESS: 'localSearchReadiness',
  COMPETITIVE_SEARCH_EVIDENCE: 'competitiveSearchEvidence',
  CONVERSION_ENQUIRY_READINESS: 'conversionEnquiryReadiness',
  MEASUREMENT_LIMITATIONS: 'measurementLimitations',
  PRIORITY_INVESTMENT_PLAN: 'priorityInvestmentPlan',
  ACTION_ROADMAP: 'actionRoadmap',
  EVIDENCE_LIMITATIONS: 'evidenceLimitations',
}

export const SNAPSHOT_V3_DB_MARKERS = [
  'BUSINESS_CUSTOMER_UNDERSTANDING:',
  'SEARCH_OPPORTUNITY:',
  'AI_DISCOVERY_READINESS:',
  'TOP_PRIORITY_ACTIONS:',
] as const

export const DETAILED_V3_DB_MARKERS = [
  'EXECUTIVE_BUSINESS_ASSESSMENT:',
  'SEARCH_AS_GROWTH_CHANNEL:',
  'AI_DISCOVERY_READINESS:',
  'PRIORITY_INVESTMENT_PLAN:',
  'ACTION_ROADMAP:',
] as const

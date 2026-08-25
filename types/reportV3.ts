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

export interface SnapshotReportV3 {
  reportVersion: 3
  type: 'snapshot'
  websiteUrl: string
  sections: SnapshotSectionsV3
}

export interface DetailedReportV3 {
  reportVersion: 3
  type: 'detailed'
  websiteUrl: string
  sections: DetailedSectionsV3
}

export type ReportV3 = SnapshotReportV3 | DetailedReportV3
